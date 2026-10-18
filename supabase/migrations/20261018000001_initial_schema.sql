-- =============================================================================
-- ShopSphere · 001 · Core schema
-- Tables, enums, constraints and indexes. Security (RLS) lives in 003.
--
-- Conventions
--   * Money is stored as integer cents (price_cents = 2999 means $29.99).
--   * Every product has at least one variant. Price, SKU and stock live on the
--     variant; a product without options simply has one "Default" variant.
--   * Orders copy product name, price and address at purchase time, so later
--     catalog edits never change historical orders.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('customer', 'admin');
create type public.product_status as enum ('draft', 'active', 'archived');
create type public.order_status as enum (
  'pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
);
create type public.review_status as enum ('pending', 'approved', 'rejected');
create type public.discount_type as enum ('percentage', 'fixed_amount');
create type public.inventory_reason as enum (
  'initial', 'restock', 'adjustment', 'reservation', 'reservation_release', 'return'
);

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text check (char_length(full_name) <= 120),
  phone       text check (char_length(phone) <= 32),
  avatar_url  text,
  role        public.user_role not null default 'customer',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.profiles is 'One row per auth user. Created automatically on sign-up.';

create table public.addresses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  label        text check (char_length(label) <= 40),
  full_name    text not null check (char_length(full_name) between 1 and 120),
  phone        text check (char_length(phone) <= 32),
  line1        text not null check (char_length(line1) between 1 and 200),
  line2        text check (char_length(line2) <= 200),
  city         text not null check (char_length(city) between 1 and 100),
  region       text check (char_length(region) <= 100),
  postal_code  text not null check (char_length(postal_code) between 1 and 20),
  country_code char(2) not null check (country_code ~ '^[A-Z]{2}$'),
  is_default   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index addresses_user_id_idx on public.addresses (user_id);
create unique index addresses_one_default_per_user on public.addresses (user_id) where is_default;

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------
create table public.categories (
  id           uuid primary key default gen_random_uuid(),
  parent_id    uuid references public.categories (id) on delete set null,
  name         text not null check (char_length(name) between 1 and 80),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description  text check (char_length(description) <= 1000),
  image_path   text,
  sort_order   integer not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (parent_id is distinct from id)
);
create index categories_parent_id_idx on public.categories (parent_id);

create table public.products (
  id                 uuid primary key default gen_random_uuid(),
  category_id        uuid references public.categories (id) on delete set null,
  name               text not null check (char_length(name) between 1 and 160),
  slug               text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  short_description  text check (char_length(short_description) <= 300),
  description        text check (char_length(description) <= 10000),
  brand              text check (char_length(brand) <= 80),
  -- [{ "label": "Dimensions", "value": "W 80 × D 40 cm" }, ...]
  specifications     jsonb not null default '[]'::jsonb check (jsonb_typeof(specifications) = 'array'),
  status             public.product_status not null default 'draft',
  is_featured        boolean not null default false,
  seo_title          text check (char_length(seo_title) <= 70),
  seo_description    text check (char_length(seo_description) <= 160),

  -- Denormalised for fast listing, sorting and filtering. Maintained by
  -- triggers in 002 — never written by the app.
  min_price_cents    integer check (min_price_cents >= 0),
  max_price_cents    integer check (max_price_cents >= 0),
  total_stock        integer not null default 0 check (total_stock >= 0),
  avg_rating         numeric(3, 2) not null default 0 check (avg_rating between 0 and 5),
  review_count       integer not null default 0 check (review_count >= 0),

  search_vector      tsvector generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(brand, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(short_description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) stored,

  published_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index products_category_id_idx on public.products (category_id);
create index products_status_idx on public.products (status);
create index products_featured_idx on public.products (is_featured) where status = 'active';
create index products_search_idx on public.products using gin (search_vector);

create table public.product_images (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products (id) on delete cascade,
  storage_path  text not null check (char_length(storage_path) between 1 and 500),
  alt_text      text not null default '' check (char_length(alt_text) <= 200),
  position      smallint not null default 0,
  created_at    timestamptz not null default now()
);
create index product_images_product_id_idx on public.product_images (product_id, position);

-- Option types a product offers: "Color", "Size", "Material" (max 3 per product, enforced in app).
create table public.product_options (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 40),
  position    smallint not null default 0,
  unique (product_id, name)
);

-- The choices for one option: "Oak", "Walnut" / "Small", "Large".
create table public.product_option_values (
  id          uuid primary key default gen_random_uuid(),
  option_id   uuid not null references public.product_options (id) on delete cascade,
  value       text not null check (char_length(value) between 1 and 60),
  swatch_hex  text check (swatch_hex ~ '^#[0-9A-Fa-f]{6}$'),
  position    smallint not null default 0,
  unique (option_id, value)
);

-- A buyable combination, e.g. "Oak / Large". Holds its own price, SKU and stock.
create table public.product_variants (
  id                      uuid primary key default gen_random_uuid(),
  product_id              uuid not null references public.products (id) on delete cascade,
  sku                     text not null unique check (char_length(sku) between 1 and 64),
  title                   text not null default 'Default' check (char_length(title) between 1 and 160),
  price_cents             integer not null check (price_cents >= 0),
  compare_at_price_cents  integer check (compare_at_price_cents > price_cents),
  stock_quantity          integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold     integer not null default 5 check (low_stock_threshold >= 0),
  weight_grams            integer check (weight_grams >= 0),
  image_id                uuid references public.product_images (id) on delete set null,
  position                smallint not null default 0,
  is_active               boolean not null default true,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index product_variants_product_id_idx on public.product_variants (product_id, position);

-- Which option values make up each variant (Oak + Large → "Oak / Large").
create table public.product_variant_options (
  variant_id       uuid not null references public.product_variants (id) on delete cascade,
  option_value_id  uuid not null references public.product_option_values (id) on delete cascade,
  primary key (variant_id, option_value_id)
);
create index product_variant_options_value_idx on public.product_variant_options (option_value_id);

-- ---------------------------------------------------------------------------
-- Shopping
-- ---------------------------------------------------------------------------
-- Signed-in carts. Guest carts live in the browser and merge in on login.
create table public.cart_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  variant_id  uuid not null references public.product_variants (id) on delete cascade,
  quantity    integer not null check (quantity between 1 and 99),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, variant_id)
);

create table public.wishlist_items (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, product_id)
);
create index wishlist_items_product_id_idx on public.wishlist_items (product_id);

create table public.discount_codes (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null unique check (code ~ '^[A-Z0-9_-]{3,32}$'),
  description         text check (char_length(description) <= 200),
  type                public.discount_type not null,
  -- Whole percent (1–100) for 'percentage'; cents for 'fixed_amount'.
  value               integer not null check (value > 0),
  min_subtotal_cents  integer not null default 0 check (min_subtotal_cents >= 0),
  max_redemptions     integer check (max_redemptions > 0),
  redemption_count    integer not null default 0 check (redemption_count >= 0),
  starts_at           timestamptz,
  ends_at             timestamptz,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (type <> 'percentage' or value <= 100),
  check (ends_at is null or starts_at is null or ends_at > starts_at),
  check (max_redemptions is null or redemption_count <= max_redemptions)
);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create sequence public.order_number_seq start 100001;

create table public.orders (
  id                          uuid primary key default gen_random_uuid(),
  order_number                text not null unique default ('SS-' || nextval('public.order_number_seq')),
  user_id                     uuid references public.profiles (id) on delete set null,
  email                       text not null,
  status                      public.order_status not null default 'pending_payment',
  currency                    char(3) not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  subtotal_cents              integer not null check (subtotal_cents >= 0),
  discount_cents              integer not null default 0 check (discount_cents >= 0),
  shipping_cents              integer not null default 0 check (shipping_cents >= 0),
  tax_cents                   integer not null default 0 check (tax_cents >= 0),
  total_cents                 integer not null check (total_cents >= 0),
  discount_code_id            uuid references public.discount_codes (id) on delete set null,
  discount_code               text,
  shipping_address            jsonb not null check (jsonb_typeof(shipping_address) = 'object'),
  stripe_checkout_session_id  text unique,
  stripe_payment_intent_id    text unique,
  tracking_carrier            text check (char_length(tracking_carrier) <= 60),
  tracking_number             text check (char_length(tracking_number) <= 100),
  -- Reserved stock is released if payment hasn't completed by this time.
  reservation_expires_at      timestamptz,
  paid_at                     timestamptz,
  shipped_at                  timestamptz,
  delivered_at                timestamptz,
  cancelled_at                timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  check (discount_cents <= subtotal_cents),
  check (total_cents = subtotal_cents - discount_cents + shipping_cents + tax_cents)
);
create index orders_user_id_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);
create index orders_created_at_idx on public.orders (created_at desc);

create table public.order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders (id) on delete cascade,
  product_id        uuid references public.products (id) on delete set null,
  variant_id        uuid references public.product_variants (id) on delete set null,
  product_name      text not null,
  variant_title     text,
  sku               text not null,
  image_path        text,
  unit_price_cents  integer not null check (unit_price_cents >= 0),
  quantity          integer not null check (quantity between 1 and 99),
  line_total_cents  integer not null,
  created_at        timestamptz not null default now(),
  check (line_total_cents = unit_price_cents * quantity)
);
create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);
create index order_items_variant_id_idx on public.order_items (variant_id);

-- Timeline shown on the customer's order tracking page.
create table public.order_status_history (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  status      public.order_status not null,
  note        text check (char_length(note) <= 500),
  changed_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);
create index order_status_history_order_id_idx on public.order_status_history (order_id, created_at);

-- ---------------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------------
create table public.reviews (
  id                    uuid primary key default gen_random_uuid(),
  product_id            uuid not null references public.products (id) on delete cascade,
  user_id               uuid not null references public.profiles (id) on delete cascade,
  rating                smallint not null check (rating between 1 and 5),
  title                 text check (char_length(title) <= 120),
  body                  text check (char_length(body) <= 5000),
  status                public.review_status not null default 'pending',
  is_verified_purchase  boolean not null default false,
  moderated_by          uuid references public.profiles (id) on delete set null,
  moderated_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (product_id, user_id)
);
create index reviews_product_status_idx on public.reviews (product_id, status, created_at desc);
create index reviews_status_idx on public.reviews (status, created_at desc);

-- ---------------------------------------------------------------------------
-- Operations
-- ---------------------------------------------------------------------------
-- Audit log of every stock change (restocks, reservations, manual adjustments).
create table public.inventory_movements (
  id               uuid primary key default gen_random_uuid(),
  variant_id       uuid not null references public.product_variants (id) on delete cascade,
  quantity_change  integer not null check (quantity_change <> 0),
  reason           public.inventory_reason not null,
  order_id         uuid references public.orders (id) on delete set null,
  note             text check (char_length(note) <= 500),
  created_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now()
);
create index inventory_movements_variant_idx on public.inventory_movements (variant_id, created_at desc);

-- Single-row table of store-wide settings.
create table public.store_settings (
  id                             smallint primary key default 1 check (id = 1),
  store_name                     text not null default 'ShopSphere' check (char_length(store_name) between 1 and 80),
  support_email                  text check (char_length(support_email) <= 254),
  currency                       char(3) not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  flat_shipping_cents            integer not null default 1200 check (flat_shipping_cents >= 0),
  free_shipping_threshold_cents  integer default 15000 check (free_shipping_threshold_cents >= 0),
  tax_rate_bps                   integer not null default 0 check (tax_rate_bps between 0 and 10000),
  announcement_text              text check (char_length(announcement_text) <= 160),
  updated_at                     timestamptz not null default now()
);
insert into public.store_settings (id) values (1);

-- Stripe webhook events already handled. Lets the webhook ignore retries safely.
create table public.stripe_events (
  id            text primary key,
  type          text not null,
  received_at   timestamptz not null default now(),
  processed_at  timestamptz
);
