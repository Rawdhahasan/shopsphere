-- Public review listing for product pages.
--
-- Profiles are private (RLS: own row only), so visitors can't read reviewer
-- names directly. This function returns approved reviews of active products
-- with a privacy-safe display name ("Alice C."). It never exposes user ids,
-- emails or unapproved reviews.

create or replace function public.get_product_reviews(p_product_id uuid)
returns table (
  id uuid,
  rating smallint,
  title text,
  body text,
  is_verified_purchase boolean,
  created_at timestamptz,
  author_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.id,
    r.rating,
    r.title,
    r.body,
    r.is_verified_purchase,
    r.created_at,
    case
      when coalesce(trim(pr.full_name), '') = '' then 'ShopSphere customer'
      when position(' ' in trim(pr.full_name)) = 0 then trim(pr.full_name)
      else split_part(trim(pr.full_name), ' ', 1) || ' '
        || upper(left(regexp_replace(trim(pr.full_name), '^.*\s+', ''), 1)) || '.'
    end as author_name
  from public.reviews r
  join public.products p on p.id = r.product_id and p.status = 'active'
  left join public.profiles pr on pr.id = r.user_id
  where r.product_id = p_product_id
    and r.status = 'approved'
  order by r.created_at desc
  limit 50;
$$;

revoke execute on function public.get_product_reviews(uuid) from public;
grant execute on function public.get_product_reviews(uuid) to anon, authenticated;
