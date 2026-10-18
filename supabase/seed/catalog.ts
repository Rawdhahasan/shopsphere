/**
 * ShopSphere development catalog: the single source of truth for seed data.
 *
 * `npm run db:seed:generate` turns this file into `supabase/seed.sql` and
 * `docs/IMAGE_CREDITS.md`. Edit products here, never in the generated files.
 *
 * Photography: every image is a free photo from Unsplash (served from
 * images.unsplash.com, not the paid plus.unsplash.com), used under the
 * Unsplash License: https://unsplash.com/license. No visible third-party
 * branding. Photographers are credited in docs/IMAGE_CREDITS.md.
 */

export type Photo = {
  /** Unsplash CDN id, e.g. "photo-1612196808214-b8e1d6145a8c". */
  cdn: string;
  /** Unsplash photo page id, e.g. "WUrXahlyjBo". */
  page: string;
  photographer: string;
  alt: string;
};

export type OptionDef = { name: string; values: { value: string; swatch?: string }[] };

export type VariantDef = {
  /** Option name → value, e.g. { Color: "Moss" }. Omit for single-variant products. */
  options?: Record<string, string>;
  priceCents: number;
  compareAtCents?: number;
  stock: number;
  /** Index into the product's `images` to show when this variant is selected. */
  image?: number;
};

export type ProductDef = {
  slug: string;
  name: string;
  category: string;
  skuPrefix: string;
  shortDescription: string;
  description: string;
  specifications: { label: string; value: string }[];
  status?: "draft" | "active" | "archived";
  featured?: boolean;
  /** ISO date; defaults to a staggered date so "newest" sorting works. */
  publishedAt?: string;
  options?: OptionDef[];
  variants: VariantDef[];
  images: Photo[];
};

export type CategoryDef = {
  slug: string;
  name: string;
  description: string;
  image: Photo;
};

const photo = (cdn: string, page: string, photographer: string, alt: string): Photo => ({
  cdn,
  page,
  photographer,
  alt,
});

// ---------------------------------------------------------------------------
// Photography
// ---------------------------------------------------------------------------
const P = {
  loungeChair: photo(
    "photo-1580480055273-228ff5388ef8",
    "NLlWwR4d3qU",
    "SCOPIC LTD",
    "Arden Lounge Chair in oat bouclé with a solid oak swivel base",
  ),
  sofa: photo(
    "photo-1775029676739-86443af4010d",
    "pYqXT6hoRbQ",
    "Aleksandra Dementeva",
    "Lune Two-Seater Sofa in ivory with linen cushions beside a side table",
  ),
  throw: photo(
    "photo-1757969704802-4d0050f038d7",
    "G3ljETYuoo8",
    "Costa Live",
    "Fringed Cotton Throw in ivory draped over an armchair",
  ),
  nestingTables: photo(
    "photo-1611486212355-d276af4581c0",
    "xej3GOtAQ-o",
    "Sam Moghadam",
    "Halden Nesting Tables in walnut, set of three",
  ),
  floorLamp: photo(
    "photo-1630578877871-1a2f9d372fd2",
    "RV9T8txb2uY",
    "John Black",
    "Pleat Floor Lamp with a pleated linen shade glowing in the evening",
  ),
  plates: photo(
    "photo-1571987530791-58e3e7744d99",
    "Vrztewqmi4Q",
    "Callum Shaw",
    "Terra Stoneware Dinner Plate in chalk glaze, seen from above",
  ),
  platesStack: photo(
    "photo-1620818309896-df4306ec95d8",
    "fMErCi1ld3Q",
    "Aleksey Cherenkevich",
    "Stacks of Terra Stoneware plates on a shelf",
  ),
  tumblerMoss: photo(
    "photo-1782351076283-73aa35f76058",
    "BGEqCc-bQHg",
    "Adam Rasheed",
    "Kiln Stoneware Tumbler in speckled moss glaze",
  ),
  tumblerRust: photo(
    "photo-1782351094137-14cef7134c18",
    "n9I_Xp7nyCk",
    "Adam Rasheed",
    "Kiln Stoneware Tumbler in rust glaze",
  ),
  espressoCups: photo(
    "photo-1590422749897-47036da0b0ff",
    "u_jt9A7FADk",
    "Diana Light",
    "Four handmade Pinch Espresso Cups stacked together",
  ),
  servingBoard: photo(
    "photo-1587302108992-20648821725d",
    "OOv2sCKwYAA",
    "Mockup Graphics",
    "Olive Wood Serving Board with a carved handle",
  ),
  carafe: photo(
    "photo-1775202313737-abaabb5a3eca",
    "tU-7tQgL-eU",
    "Elena Golubeva",
    "Water being poured from the Ribbed Glass Carafe into a glass",
  ),
  napkins: photo(
    "photo-1596433904500-97b901c5d274",
    "HbiRi1Owk9k",
    "Svitlana",
    "Washed Linen Napkins folded in natural, blush and stone",
  ),
  duvet: photo(
    "photo-1617325247661-675ab4b64ae2",
    "gVKmonDbotU",
    "Deconovo",
    "Bed dressed in the Stonewashed Linen Duvet Cover in white",
  ),
  duvetNatural: photo(
    "photo-1634665810235-011d663754e7",
    "2NDtPNiLcD0",
    "Kateryna Hliznitsova",
    "Close-up of stonewashed linen in natural",
  ),
  duvetSlate: photo(
    "photo-1518019671582-55004f1bc9ab",
    "FseXc3OsIic",
    "Luca Laurence",
    "Close-up of stonewashed linen in slate",
  ),
  sheets: photo(
    "photo-1542728929-2b5d9a0c8d48",
    "9nhxEa3PK30",
    "Sincerely Media",
    "Organic Cotton Sheet Set in white on an unmade bed",
  ),
  bedsideTable: photo(
    "photo-1766928714376-3263576f7b73",
    "5IVx5mvURJw",
    "Puscas Adryan",
    "Alder Bedside Table with a drawer and open shelf",
  ),
  tableLamp: photo(
    "photo-1769255119650-f658d3dbc397",
    "VdrwI_63-Po",
    "Bhautik Patel",
    "Halo Table Lamp with a walnut base and linen shade",
  ),
  bathrobe: photo(
    "photo-1780571525506-67e3bb9ca947",
    "rv312P5_Egw",
    "Grace Anne Bobadilla",
    "Two Cloud Cotton Bathrobes hanging in a warm-lit bathroom",
  ),
  towel: photo(
    "photo-1638232928539-6e91c47ddec5",
    "46g2RzaaxJ0",
    "MADEINEGYPT.CA",
    "Plush Cotton Bath Towel in stone, rolled",
  ),
  towelsHanging: photo(
    "photo-1616663717839-2fea42e1a1f6",
    "4dUC7Fine5g",
    "the blowup",
    "Plush Cotton Bath Towels in white and charcoal on hooks",
  ),
  bathMat: photo(
    "photo-1681742308509-e32e0a7c2cb8",
    "sICX7aw6gls",
    "Almas Salakhov",
    "Close-up of the Chenille Bath Mat's soft loops",
  ),
  soapDispenser: photo(
    "photo-1783149173371-d852d86563c4",
    "7gYlkoV1e1A",
    "Laura Chouette",
    "Ribbed Glass Soap Dispenser with a brass pump on a windowsill",
  ),
  vase: photo(
    "photo-1612196808214-b8e1d6145a8c",
    "WUrXahlyjBo",
    "Mathilde Langevin",
    "Ridge Ceramic Vase in matte white on a marble plinth",
  ),
  candle: photo(
    "photo-1705417929633-19d68b4e72a3",
    "_MuRSNbZlGU",
    "Hanna Shapovalova",
    "Ribbed Pillar Candle in ivory held in a hand",
  ),
  baskets: photo(
    "photo-1626037235530-fe56de7d6459",
    "siGGsRqd9z4",
    "Sina Saadatmand",
    "Tidal Woven Baskets nested together",
  ),
  mirror: photo(
    "photo-1618220252344-8ec99ec624b1",
    "g3KbcDWrBUM",
    "Spacejoy",
    "Linden Round Mirror with an oak frame above an entryway bench",
  ),
  rug: photo(
    "photo-1600166898405-da9535204843",
    "p00r5JmTMpY",
    "Erfan Banaei",
    "Ivory Fringed Wool Rug partly rolled, showing its tonal border and knotted fringe",
  ),
  coffeeTable: photo(
    "photo-1713184367696-507ea9fe27b9",
    "T55TD7ZUo0c",
    "Clay Banks",
    "Pebble Walnut Coffee Table with an open book and a mug in front of a sofa",
  ),
  sideboard: photo(
    "photo-1767963758785-b9def36c13e3",
    "UrQeWGobTnI",
    "Imani Bahati",
    "Reed Fluted Oak Sideboard styled with a table lamp, books and a sculptural vase",
  ),
  cushions: photo(
    "photo-1611489704434-2612dc89c992",
    "jerLmkgxQhA",
    "Veronika Martinelli",
    "Tove Linen Cushions in ivory and rust stacked on a striped rug",
  ),
  diningTable: photo(
    "photo-1636138388621-258a72ecb07e",
    "Uaf1g970Hrk",
    "Jonathan Borba",
    "Saga Oak Dining Table with eight chairs under pendant lights in a bright room",
  ),
  dutchOven: photo(
    "photo-1770672438590-413eae05e595",
    "fHf8QYOS5q8",
    "NATHAN MULLET",
    "Hearth Enameled Dutch Oven in sage with a freshly baked sourdough loaf",
  ),
  mugs: photo(
    "photo-1536936812504-0e77dc3f0b40",
    "CipURjPCXOo",
    "Katja Vogt",
    "Dune Stoneware Mugs with speckled glaze on an open kitchen shelf",
  ),
  wineGlass: photo(
    "photo-1662738221889-2344690f7dc1",
    "WT_r3dUwx6I",
    "Ambitious Studio* | Rick Barrett",
    "An Aria hand-blown wine glass of white wine on a stone table",
  ),
  duvetInsert: photo(
    "photo-1516894780606-8d6bf03297cf",
    "dEUYgSzEosc",
    "jurien huggins",
    "Cloudrest Duvet Insert loosely gathered on an unmade bed",
  ),
  silkPillow: photo(
    "photo-1595501402656-5dfa3497a4c7",
    "1MebQd9i6SI",
    "Trude Jonsson Stangel",
    "A pillow in a Mulberry Silk Pillowcase catching striped morning light",
  ),
  spindleBed: photo(
    "photo-1780672823770-dc40e2181cdf",
    "-_GU-VDIHnk",
    "Taylor Friehl",
    "Rhea Oak Spindle Bed dressed in white linen beside a bedside table and lamp",
  ),
  laundryBasket: photo(
    "photo-1467043153537-a4fba2cd39ef",
    "7tFlUFGa7Dk",
    "Sarah Dorweiler",
    "Sora Seagrass Laundry Basket with a towel, next to a white chair",
  ),
  showerCurtain: photo(
    "photo-1590421198005-3139329e9222",
    "VV_ioP2riow",
    "Joyful",
    "Waffle Weave Shower Curtain in white with a grey woven band, beside hand towels",
  ),
  oliveSoap: photo(
    "photo-1624459311872-54933a141308",
    "sbZQn-AYHNQ",
    "Sincerely Media",
    "Two bars of Pure Olive Bar Soap on grey stone with dried grasses",
  ),
  handTowels: photo(
    "photo-1616663717839-2fea42e1a1f6",
    "4dUC7Fine5g",
    "the blowup",
    "Waffle Hand Towels in white and charcoal hanging above a bathtub",
  ),
  bathTray: photo(
    "photo-1638986362449-eb8a867ae77d",
    "rLv41IRXShE",
    "Eugenia Pan'kiv",
    "Ash Wood Bath Tray across a bathtub with a brush, sponge and a cup",
  ),
  floorMirror: photo(
    "photo-1667610342763-7618517d9651",
    "qwdCMprHWKg",
    "Mathilde Langevin",
    "Arch Floor Mirror leaning against a wall beside two terracotta vessels",
  ),
  taperCandle: photo(
    "photo-1543251698-9ef753c40fbc",
    "2S7vOqq6f_U",
    "Annie Spratt",
    "A lit beeswax taper candle in a dark candlestick among winter greenery",
  ),
  budPlanter: photo(
    "photo-1554936198-b66e9f8ec01a",
    "SHiqkFW5VO4",
    "Andy Crone",
    "Celadon Bud Planter with a small fern on a pale wooden table",
  ),
  candlesticks: photo(
    "photo-1730658481792-da3dca70fcdb",
    "mwrMvNJYic8",
    "Noyo creatif",
    "Three Cone Brass Candlesticks of different heights on a white background",
  ),
} satisfies Record<string, Photo>;

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export const categories: CategoryDef[] = [
  {
    slug: "living",
    name: "Living",
    description: "Lounge chairs, sofas, side tables and lighting for rooms made for slowing down.",
    image: P.sofa,
  },
  {
    slug: "kitchen-dining",
    name: "Kitchen & Dining",
    description: "Stoneware, glass and table linen for everyday meals and long dinners alike.",
    image: P.platesStack,
  },
  {
    slug: "bedroom",
    name: "Bedroom",
    description: "Stonewashed linen, organic cotton and quiet furniture for restful rooms.",
    image: P.duvet,
  },
  {
    slug: "bath",
    name: "Bath",
    description: "Plush towels, robes and considered accessories for a calmer bathroom.",
    image: P.bathrobe,
  },
  {
    slug: "decor",
    name: "Decor",
    description: "Vases, candles, baskets and mirrors: the finishing layer of a home.",
    image: P.vase,
  },
];

const BRAND = "ShopSphere Studio";
export const brand = BRAND;

const oak = { value: "Natural Oak", swatch: "#C8A27A" };
const smokedOak = { value: "Smoked Oak", swatch: "#6B5442" };

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
export const products: ProductDef[] = [
  // Living ------------------------------------------------------------------
  {
    slug: "arden-lounge-chair",
    name: "Arden Lounge Chair",
    category: "living",
    skuPrefix: "ARD",
    featured: true,
    shortDescription: "A low, enveloping swivel chair in textured upholstery on a solid oak base.",
    description:
      "Arden is built for the slow hours: a deep, gently reclined seat and a high back that wraps around you. The upholstery is a dense, hard-wearing weave, and the four-star base is turned from solid FSC-certified oak. It swivels smoothly through a full turn, so it can face the window or the conversation.",
    specifications: [
      { label: "Dimensions", value: "W 74 × D 78 × H 82 cm · seat height 42 cm" },
      {
        label: "Materials",
        value: "Solid oak base, high-resilience foam, upholstery from 89% recycled polyester",
      },
      { label: "Care", value: "Vacuum regularly; spot clean with a damp cloth" },
      { label: "Lead time", value: "Ships in 1–2 weeks" },
    ],
    options: [
      {
        name: "Upholstery",
        values: [
          { value: "Oat Bouclé", swatch: "#D9CFC1" },
          { value: "Stone Linen", swatch: "#B8B1A5" },
        ],
      },
      { name: "Base", values: [oak, smokedOak] },
    ],
    variants: [
      { options: { Upholstery: "Oat Bouclé", Base: "Natural Oak" }, priceCents: 89000, stock: 6 },
      { options: { Upholstery: "Oat Bouclé", Base: "Smoked Oak" }, priceCents: 92000, stock: 3 },
      { options: { Upholstery: "Stone Linen", Base: "Natural Oak" }, priceCents: 89000, stock: 0 },
      { options: { Upholstery: "Stone Linen", Base: "Smoked Oak" }, priceCents: 92000, stock: 4 },
    ],
    images: [P.loungeChair],
  },
  {
    slug: "lune-two-seater-sofa",
    name: "Lune Two-Seater Sofa",
    category: "living",
    skuPrefix: "LUN",
    featured: true,
    shortDescription: "A compact sofa with soft, rounded arms and feather-wrapped cushions.",
    description:
      "Lune fits generous comfort into a footprint made for apartments. Feather-wrapped seat cushions keep their shape, the rounded arms are just the right height for leaning, and the slim oak legs lift it off the floor so the room feels lighter. The covers are removable and washable.",
    specifications: [
      { label: "Dimensions", value: "W 176 × D 88 × H 80 cm · seat depth 58 cm" },
      {
        label: "Materials",
        value: "Kiln-dried hardwood frame, feather-wrapped foam, cotton-linen cover",
      },
      { label: "Care", value: "Removable covers, cool wash or dry clean" },
      { label: "Lead time", value: "Ships in 3–4 weeks" },
    ],
    options: [
      {
        name: "Color",
        values: [
          { value: "Ivory", swatch: "#EEE8DD" },
          { value: "Sand", swatch: "#D6C6AE" },
        ],
      },
    ],
    variants: [
      { options: { Color: "Ivory" }, priceCents: 189000, compareAtCents: 219000, stock: 3 },
      { options: { Color: "Sand" }, priceCents: 189000, compareAtCents: 219000, stock: 2 },
    ],
    images: [P.sofa],
  },
  {
    slug: "fringed-cotton-throw",
    name: "Fringed Cotton Throw",
    category: "living",
    skuPrefix: "FCT",
    shortDescription: "A heavyweight waffle-knit throw with hand-knotted fringe.",
    description:
      "Woven from long-staple cotton in a deep waffle texture, this throw is warm without weight and only softens with washing. The fringe is knotted by hand at each end. Drape it over a chair, fold it at the foot of the bed, or keep it within reach of the sofa.",
    specifications: [
      { label: "Dimensions", value: "130 × 170 cm plus 8 cm fringe" },
      { label: "Materials", value: "100% long-staple cotton" },
      { label: "Care", value: "Machine wash cold, line dry" },
    ],
    options: [
      {
        name: "Color",
        values: [
          { value: "Ivory", swatch: "#EFEAE0" },
          { value: "Oat", swatch: "#D8CBB5" },
          { value: "Charcoal", swatch: "#4A4744" },
        ],
      },
    ],
    variants: [
      { options: { Color: "Ivory" }, priceCents: 12500, stock: 24 },
      { options: { Color: "Oat" }, priceCents: 12500, stock: 18 },
      { options: { Color: "Charcoal" }, priceCents: 12500, stock: 9 },
    ],
    images: [P.throw],
  },
  {
    slug: "halden-nesting-tables",
    name: "Halden Nesting Tables",
    category: "living",
    skuPrefix: "HAL",
    shortDescription: "Three solid-wood side tables that tuck neatly into one another.",
    description:
      "Use them together as a stepped display, pull one out for a drink beside the sofa, or spread all three across a room when guests arrive. Each table is made from solid wood with a waterfall edge that shows the grain running continuously from top to leg.",
    specifications: [
      { label: "Dimensions", value: "Large W 50 × D 35 × H 45 cm; medium and small nest inside" },
      { label: "Materials", value: "Solid FSC-certified hardwood, hardwax oil finish" },
      { label: "Care", value: "Wipe with a dry cloth; re-oil once a year" },
    ],
    options: [{ name: "Finish", values: [{ value: "Walnut", swatch: "#7A4E2D" }, oak] }],
    variants: [
      { options: { Finish: "Walnut" }, priceCents: 42000, stock: 5 },
      { options: { Finish: "Natural Oak" }, priceCents: 39000, stock: 7 },
    ],
    images: [P.nestingTables],
  },
  {
    slug: "pleat-floor-lamp",
    name: "Pleat Floor Lamp",
    category: "living",
    skuPrefix: "PLT",
    shortDescription:
      "A slender floor lamp with a hand-pleated linen shade and a warm, diffused glow.",
    description:
      "The shade is pleated by hand from natural linen, so the light it gives is soft and even, more glow than glare. A slim powder-coated stem and a weighted base keep it steady without taking up floor space. It comes with an inline dimmer.",
    specifications: [
      { label: "Dimensions", value: "H 150 cm · shade Ø 38 cm" },
      { label: "Materials", value: "Linen shade, powder-coated steel, weighted base" },
      { label: "Bulb", value: "E26/E27, max 60 W LED (not included)" },
    ],
    variants: [{ priceCents: 36000, stock: 11 }],
    images: [P.floorLamp],
  },

  // Kitchen & Dining -------------------------------------------------------------
  {
    slug: "terra-stoneware-dinner-plates",
    name: "Terra Stoneware Dinner Plates, Set of 4",
    category: "kitchen-dining",
    skuPrefix: "TER",
    featured: true,
    shortDescription: "Wheel-thrown stoneware plates with a soft, satin-matte glaze.",
    description:
      "Each plate is thrown on the wheel and finished with a satin glaze that feels almost like stone under the hand. Slight variations in shape and tone are part of the character. They're dishwasher and microwave safe, and sturdy enough for every day.",
    specifications: [
      { label: "Dimensions", value: "Ø 27 cm · set of 4" },
      { label: "Materials", value: "High-fired stoneware, lead-free glaze" },
      { label: "Care", value: "Dishwasher and microwave safe" },
    ],
    options: [
      {
        name: "Glaze",
        values: [
          { value: "Chalk", swatch: "#ECE8E1" },
          { value: "Oat", swatch: "#D9CDB9" },
        ],
      },
    ],
    variants: [
      { options: { Glaze: "Chalk" }, priceCents: 9600, stock: 30 },
      { options: { Glaze: "Oat" }, priceCents: 9600, stock: 4 },
    ],
    images: [P.plates, P.platesStack],
  },
  {
    slug: "kiln-stoneware-tumbler",
    name: "Kiln Stoneware Tumbler",
    category: "kitchen-dining",
    skuPrefix: "KLN",
    shortDescription: "A handleless stoneware cup with an exposed clay foot.",
    description:
      "Made for coffee, tea, water or wine, the tumbler sits comfortably in the hand. The glaze stops short of the base to reveal the raw, toasted clay, and every piece carries its own speckling from the kiln.",
    specifications: [
      { label: "Dimensions", value: "Ø 8 × H 11 cm · 300 ml" },
      { label: "Materials", value: "Speckled stoneware, food-safe glaze" },
      { label: "Care", value: "Dishwasher safe" },
    ],
    options: [
      {
        name: "Glaze",
        values: [
          { value: "Moss", swatch: "#5E7458" },
          { value: "Rust", swatch: "#B9734A" },
        ],
      },
    ],
    variants: [
      { options: { Glaze: "Moss" }, priceCents: 3400, stock: 40, image: 0 },
      { options: { Glaze: "Rust" }, priceCents: 3400, stock: 26, image: 1 },
    ],
    images: [P.tumblerMoss, P.tumblerRust],
  },
  {
    slug: "pinch-espresso-cups",
    name: "Pinch Espresso Cups, Set of 4",
    category: "kitchen-dining",
    skuPrefix: "PIN",
    shortDescription: "Small hand-pinched porcelain cups with a raw, tactile finish.",
    description:
      "Shaped by hand rather than cast, each cup holds a double espresso and stacks neatly when not in use. The unglazed exterior is soft and chalky, and the inside is glazed for easy cleaning.",
    specifications: [
      { label: "Dimensions", value: "Ø 6.5 × H 5.5 cm · 90 ml · set of 4" },
      { label: "Materials", value: "Porcelain, glazed interior" },
      { label: "Care", value: "Hand wash recommended" },
    ],
    variants: [{ priceCents: 5800, stock: 15 }],
    images: [P.espressoCups],
  },
  {
    slug: "olive-wood-serving-board",
    name: "Olive Wood Serving Board",
    category: "kitchen-dining",
    skuPrefix: "OLV",
    shortDescription: "A paddle board carved from a single piece of olive wood.",
    description:
      "Olive wood is dense, naturally antibacterial and dramatically grained, so no two boards look alike. Use it for bread, cheese or as a trivet at the table. The carved handle has a hole for hanging.",
    specifications: [
      { label: "Dimensions", value: "Medium 38 × 20 cm · Large 48 × 26 cm" },
      { label: "Materials", value: "Solid olive wood, food-safe oil" },
      { label: "Care", value: "Hand wash, dry upright, oil occasionally" },
    ],
    options: [{ name: "Size", values: [{ value: "Medium" }, { value: "Large" }] }],
    variants: [
      { options: { Size: "Medium" }, priceCents: 5800, stock: 20 },
      { options: { Size: "Large" }, priceCents: 7800, stock: 12 },
    ],
    images: [P.servingBoard],
  },
  {
    slug: "ribbed-glass-carafe",
    name: "Ribbed Glass Carafe",
    category: "kitchen-dining",
    skuPrefix: "RIB",
    shortDescription: "A mouth-blown carafe with fine vertical ribs that catch the light.",
    description:
      "Mouth-blown from lead-free borosilicate glass, the carafe is light, heat-resistant and pours cleanly without dripping. Its fine ribbing scatters light across the table. It holds a full litre.",
    specifications: [
      { label: "Dimensions", value: "Ø 10 × H 24 cm · 1 L" },
      { label: "Materials", value: "Mouth-blown borosilicate glass" },
      { label: "Care", value: "Dishwasher safe" },
    ],
    variants: [{ priceCents: 6800, stock: 2 }],
    images: [P.carafe],
  },
  {
    slug: "washed-linen-napkins",
    name: "Washed Linen Napkins, Set of 4",
    category: "kitchen-dining",
    skuPrefix: "NAP",
    shortDescription: "Generously sized stonewashed linen napkins, soft from the first use.",
    description:
      "Cut from European flax linen and stonewashed for a lived-in softness, these napkins are made to be used and washed again and again. Mitred corners and a narrow hem keep them neat.",
    specifications: [
      { label: "Dimensions", value: "45 × 45 cm · set of 4" },
      { label: "Materials", value: "100% European flax linen, OEKO-TEX certified" },
      { label: "Care", value: "Machine wash warm, tumble dry low" },
    ],
    options: [
      {
        name: "Color",
        values: [
          { value: "Natural", swatch: "#D9CDBB" },
          { value: "Blush", swatch: "#E5C3B3" },
          { value: "Stone", swatch: "#A7A296" },
        ],
      },
    ],
    variants: [
      { options: { Color: "Natural" }, priceCents: 4800, stock: 35 },
      { options: { Color: "Blush" }, priceCents: 4800, stock: 22 },
      { options: { Color: "Stone" }, priceCents: 4800, stock: 14 },
    ],
    images: [P.napkins],
  },

  // Bedroom --------------------------------------------------------------------
  {
    slug: "stonewashed-linen-duvet-cover",
    name: "Stonewashed Linen Duvet Cover",
    category: "bedroom",
    skuPrefix: "DUV",
    featured: true,
    shortDescription: "Breathable French flax linen, stonewashed for a relaxed, rumpled softness.",
    description:
      "Linen keeps you cool in summer and warm in winter, and it gets softer with every wash. Ours is woven from French flax and stonewashed so it feels broken-in from the first night. It has hidden coconut-shell buttons and corner ties to keep the duvet in place.",
    specifications: [
      { label: "Dimensions", value: "Full/Queen 228 × 228 cm · King 264 × 228 cm" },
      { label: "Materials", value: "100% French flax linen, 165 gsm, OEKO-TEX certified" },
      { label: "Care", value: "Machine wash warm, tumble dry low" },
    ],
    options: [
      { name: "Size", values: [{ value: "Full/Queen" }, { value: "King" }] },
      {
        name: "Color",
        values: [
          { value: "White", swatch: "#F4F2EE" },
          { value: "Natural", swatch: "#E3D8C3" },
          { value: "Slate", swatch: "#6E7A80" },
        ],
      },
    ],
    variants: [
      { options: { Size: "Full/Queen", Color: "White" }, priceCents: 24000, stock: 10, image: 0 },
      { options: { Size: "King", Color: "White" }, priceCents: 28000, stock: 8, image: 0 },
      { options: { Size: "Full/Queen", Color: "Natural" }, priceCents: 24000, stock: 12, image: 1 },
      { options: { Size: "King", Color: "Natural" }, priceCents: 28000, stock: 5, image: 1 },
      { options: { Size: "Full/Queen", Color: "Slate" }, priceCents: 24000, stock: 6, image: 2 },
      { options: { Size: "King", Color: "Slate" }, priceCents: 28000, stock: 2, image: 2 },
    ],
    images: [P.duvet, P.duvetNatural, P.duvetSlate],
  },
  {
    slug: "organic-cotton-sheet-set",
    name: "Organic Cotton Sheet Set",
    category: "bedroom",
    skuPrefix: "SHT",
    shortDescription: "Crisp, cool percale in GOTS-certified organic cotton.",
    description:
      "Percale is woven one-over-one for a matte, crisp hand that stays cool all night. The set includes a fitted sheet with deep pockets, a flat sheet and two pillowcases, all made from GOTS-certified organic cotton.",
    specifications: [
      { label: "Includes", value: "Fitted sheet, flat sheet, 2 pillowcases" },
      {
        label: "Materials",
        value: "100% organic cotton percale, 300 thread count, GOTS certified",
      },
      { label: "Care", value: "Machine wash warm, tumble dry low" },
    ],
    options: [{ name: "Size", values: [{ value: "Queen" }, { value: "King" }] }],
    variants: [
      { options: { Size: "Queen" }, priceCents: 18000, compareAtCents: 22000, stock: 14 },
      { options: { Size: "King" }, priceCents: 21000, compareAtCents: 25000, stock: 9 },
    ],
    images: [P.sheets],
  },
  {
    slug: "alder-bedside-table",
    name: "Alder Bedside Table",
    category: "bedroom",
    skuPrefix: "ALD",
    shortDescription: "A compact bedside table with a soft-close drawer and an open shelf.",
    description:
      "Alder keeps the essentials close: a soft-close drawer for the things you'd rather not see and an open shelf for the book you're reading. The frame is solid oak, finished with a matte lacquer that resists water rings.",
    specifications: [
      { label: "Dimensions", value: "W 45 × D 35 × H 55 cm" },
      { label: "Materials", value: "Solid oak frame, oak veneer drawer, matte lacquer" },
      { label: "Assembly", value: "Legs attach in minutes; tools included" },
    ],
    variants: [{ priceCents: 46000, stock: 4 }],
    images: [P.bedsideTable],
  },
  {
    slug: "halo-table-lamp",
    name: "Halo Table Lamp",
    category: "bedroom",
    skuPrefix: "HLO",
    featured: true,
    shortDescription: "A turned walnut base under a drum shade of natural linen.",
    description:
      "Halo's base is turned from a single piece of walnut and topped with a linen drum shade that softens the light into a warm halo. It's a natural fit for a bedside, a console or a reading corner.",
    specifications: [
      { label: "Dimensions", value: "H 42 cm · shade Ø 26 cm" },
      { label: "Materials", value: "Solid walnut, linen shade, braided fabric cord" },
      { label: "Bulb", value: "E26/E27, max 40 W LED (not included)" },
    ],
    variants: [{ priceCents: 19500, stock: 13 }],
    images: [P.tableLamp],
  },

  // Bath -------------------------------------------------------------------------
  {
    slug: "cloud-cotton-bathrobe",
    name: "Cloud Cotton Bathrobe",
    category: "bath",
    skuPrefix: "ROB",
    shortDescription: "A plush, hotel-weight robe in looped Turkish cotton.",
    description:
      "Heavy enough to feel indulgent and absorbent enough to replace a towel, the robe is woven in Turkey from long-staple cotton. It has a shawl collar, deep pockets and a belt that stays tied.",
    specifications: [
      { label: "Sizing", value: "S/M fits UK 6–12 / US 2–8 · L/XL fits UK 14–20 / US 10–16" },
      { label: "Materials", value: "100% Turkish cotton terry, 450 gsm" },
      { label: "Care", value: "Machine wash warm, tumble dry" },
    ],
    options: [{ name: "Size", values: [{ value: "S/M" }, { value: "L/XL" }] }],
    variants: [
      { options: { Size: "S/M" }, priceCents: 12800, stock: 16 },
      { options: { Size: "L/XL" }, priceCents: 12800, stock: 11 },
    ],
    images: [P.bathrobe],
  },
  {
    slug: "plush-cotton-bath-towel",
    name: "Plush Cotton Bath Towel",
    category: "bath",
    skuPrefix: "TWL",
    shortDescription: "Dense, thirsty towels in heavyweight Egyptian cotton.",
    description:
      "Woven from Egyptian cotton with long, absorbent loops, these towels feel substantial and dry quickly. A herringbone band at each end adds a quiet detail.",
    specifications: [
      { label: "Dimensions", value: "Hand 50 × 90 cm · Bath 70 × 140 cm" },
      { label: "Materials", value: "100% Egyptian cotton, 650 gsm" },
      { label: "Care", value: "Machine wash warm, tumble dry; avoid fabric softener" },
    ],
    options: [
      {
        name: "Color",
        values: [
          { value: "Stone", swatch: "#8D8C88" },
          { value: "White", swatch: "#F5F4F0" },
        ],
      },
      { name: "Size", values: [{ value: "Hand" }, { value: "Bath" }] },
    ],
    variants: [
      { options: { Color: "Stone", Size: "Hand" }, priceCents: 2400, stock: 40, image: 0 },
      { options: { Color: "Stone", Size: "Bath" }, priceCents: 5800, stock: 25, image: 0 },
      { options: { Color: "White", Size: "Hand" }, priceCents: 2400, stock: 38, image: 1 },
      { options: { Color: "White", Size: "Bath" }, priceCents: 5800, stock: 0, image: 1 },
    ],
    images: [P.towel, P.towelsHanging],
  },
  {
    slug: "chenille-bath-mat",
    name: "Chenille Bath Mat",
    category: "bath",
    skuPrefix: "MAT",
    shortDescription: "A deep-pile cotton chenille mat that's soft underfoot and quick to dry.",
    description:
      "Thick chenille loops soak up water and feel wonderful under bare feet. A non-slip latex-free backing keeps it in place on tile, and it machine washes without losing its loft.",
    specifications: [
      { label: "Dimensions", value: "50 × 80 cm" },
      { label: "Materials", value: "100% cotton chenille, non-slip backing" },
      { label: "Care", value: "Machine wash warm, tumble dry low" },
    ],
    variants: [{ priceCents: 5400, stock: 18 }],
    images: [P.bathMat],
  },
  {
    slug: "ribbed-glass-soap-dispenser",
    name: "Ribbed Glass Soap Dispenser",
    category: "bath",
    skuPrefix: "SOA",
    shortDescription: "A refillable ribbed glass dispenser with a brushed-brass pump.",
    description:
      "Swap single-use bottles for something you'll want to keep on display. The heavy ribbed glass is tinted a soft smoke, and the brushed-brass pump resists water spots. It holds 350 ml of hand or dish soap.",
    specifications: [
      { label: "Dimensions", value: "Ø 7.5 × H 18 cm · 350 ml" },
      { label: "Materials", value: "Tinted glass, brushed brass-finish pump" },
      { label: "Care", value: "Hand wash" },
    ],
    variants: [{ priceCents: 3800, stock: 22 }],
    images: [P.soapDispenser],
  },

  // Decor -------------------------------------------------------------------------
  {
    slug: "ridge-ceramic-vase",
    name: "Ridge Ceramic Vase",
    category: "decor",
    skuPrefix: "RDG",
    featured: true,
    shortDescription: "A full-bodied matte vase that stands on its own or with a single stem.",
    description:
      "Ridge takes its shape from traditional storage jars: a wide shoulder, a narrow foot and a small collar at the neck. The matte glaze is waterproof inside, so it holds fresh flowers as well as dried branches.",
    specifications: [
      { label: "Dimensions", value: "Medium H 25 cm · Large H 36 cm" },
      { label: "Materials", value: "Stoneware, matte glaze, glazed interior" },
      { label: "Care", value: "Wipe clean; not dishwasher safe" },
    ],
    options: [{ name: "Size", values: [{ value: "Medium" }, { value: "Large" }] }],
    variants: [
      { options: { Size: "Medium" }, priceCents: 6800, stock: 9 },
      { options: { Size: "Large" }, priceCents: 11800, stock: 3 },
    ],
    images: [P.vase],
  },
  {
    slug: "ribbed-pillar-candle",
    name: "Ribbed Pillar Candle",
    category: "decor",
    skuPrefix: "CND",
    shortDescription: "An unscented, hand-poured pillar candle with a fluted profile.",
    description:
      "Poured by hand from a blend of rapeseed and coconut wax, these candles burn slowly and cleanly. They're unscented, so they'll sit happily on a dinner table, and the fluted sides cast soft shadows as they burn.",
    specifications: [
      { label: "Dimensions", value: "Small Ø 7 × H 10 cm · Tall Ø 7 × H 15 cm" },
      { label: "Burn time", value: "Small approx. 30 hours · Tall approx. 45 hours" },
      { label: "Materials", value: "Rapeseed and coconut wax, cotton wick" },
    ],
    options: [{ name: "Size", values: [{ value: "Small" }, { value: "Tall" }] }],
    variants: [
      { options: { Size: "Small" }, priceCents: 2400, stock: 50 },
      { options: { Size: "Tall" }, priceCents: 3600, stock: 30 },
    ],
    images: [P.candle],
  },
  {
    slug: "tidal-woven-baskets",
    name: "Tidal Woven Baskets, Set of 3",
    category: "decor",
    skuPrefix: "TID",
    shortDescription: "Three nesting baskets hand-woven from natural palm leaf.",
    description:
      "Hand-woven in a herringbone pattern from sun-dried palm leaf, the baskets nest for storage and work alone for throws, toys, plants or fruit. Every set is made by a small cooperative of weavers.",
    specifications: [
      { label: "Dimensions", value: "Ø 22, 28 and 34 cm" },
      { label: "Materials", value: "Natural palm leaf" },
      { label: "Care", value: "Keep dry; brush off dust" },
    ],
    variants: [{ priceCents: 8600, stock: 7 }],
    images: [P.baskets],
  },
  {
    slug: "linden-round-mirror",
    name: "Linden Round Mirror",
    category: "decor",
    skuPrefix: "LIN",
    shortDescription: "A clean round mirror in a slim solid-oak frame.",
    description:
      "A mirror that brightens a hallway or bathroom without competing with the rest of the room. The frame is solid oak, finished with a clear matte oil, and the glass is copper-free for a long, clear life.",
    specifications: [
      { label: "Dimensions", value: "Ø 60 cm or Ø 80 cm · frame depth 3 cm" },
      { label: "Materials", value: "Solid oak frame, copper-free mirror glass" },
      { label: "Mounting", value: "Fixings included; hangs from a single hook" },
    ],
    options: [{ name: "Diameter", values: [{ value: "60 cm" }, { value: "80 cm" }] }],
    variants: [
      { options: { Diameter: "60 cm" }, priceCents: 28000, stock: 6 },
      { options: { Diameter: "80 cm" }, priceCents: 36000, stock: 3 },
    ],
    images: [P.mirror],
  },
  {
    slug: "travertine-bookends",
    name: "Travertine Bookends",
    category: "decor",
    skuPrefix: "TRV",
    status: "draft",
    shortDescription: "A pair of solid travertine bookends. Coming soon.",
    description:
      "Cut from honed travertine with a slight natural pitting, the bookends are heavy enough to hold a full shelf. Draft product: visible to admins only until photography is ready.",
    specifications: [
      { label: "Dimensions", value: "W 12 × D 10 × H 15 cm each" },
      { label: "Materials", value: "Honed travertine, felt base" },
    ],
    variants: [{ priceCents: 12000, stock: 0 }],
    images: [],
  },
  // New arrivals (October 2026) -------------------------------------------
  {
    slug: "ivory-fringed-wool-rug",
    name: "Ivory Fringed Wool Rug",
    category: "living",
    skuPrefix: "RUG",
    publishedAt: "2026-10-16T00:00:00.000Z",
    shortDescription:
      "A hand-knotted wool rug in soft ivory with a tonal border and knotted fringe.",
    description:
      "Knotted by hand from undyed New Zealand wool, this rug has a low, dense pile that feels soft underfoot and wears beautifully. A quiet tonal border frames the field, and the fringe is finished by hand at each end.\n\nWool is naturally stain-resistant and slow to show wear, which makes it a good choice for living rooms that are actually lived in.",
    specifications: [
      { label: "Materials", value: "100% undyed wool, cotton warp" },
      { label: "Pile height", value: "8 mm" },
      { label: "Care", value: "Vacuum without the beater bar; professional clean" },
      { label: "Lead time", value: "Ships in 1–2 weeks" },
    ],
    options: [{ name: "Size", values: [{ value: "5 × 8 ft" }, { value: "8 × 10 ft" }] }],
    variants: [
      { options: { Size: "5 × 8 ft" }, priceCents: 42000, stock: 7 },
      { options: { Size: "8 × 10 ft" }, priceCents: 78000, compareAtCents: 92000, stock: 3 },
    ],
    images: [P.rug],
  },
  {
    slug: "pebble-walnut-coffee-table",
    name: "Pebble Walnut Coffee Table",
    category: "living",
    skuPrefix: "PBL",
    publishedAt: "2026-10-12T00:00:00.000Z",
    shortDescription:
      "An organic, pebble-shaped coffee table in solid walnut with a soft oiled finish.",
    description:
      "No sharp corners, no hard lines: Pebble's top is shaped like a river stone and sits on three sculpted legs. It's cut from solid American black walnut and finished with a hard-wax oil that deepens in colour over the years.",
    specifications: [
      { label: "Dimensions", value: "W 110 × D 68 × H 36 cm" },
      { label: "Materials", value: "Solid American black walnut, hard-wax oil" },
      { label: "Care", value: "Wipe with a damp cloth; re-oil once a year" },
      { label: "Lead time", value: "Ships in 2–3 weeks" },
    ],
    variants: [{ priceCents: 96000, stock: 4 }],
    images: [P.coffeeTable],
  },
  {
    slug: "reed-fluted-oak-sideboard",
    name: "Reed Fluted Oak Sideboard",
    category: "living",
    skuPrefix: "REE",
    featured: true,
    publishedAt: "2026-10-17T00:00:00.000Z",
    shortDescription: "A long, low sideboard with fluted oak doors and soft-close storage.",
    description:
      "Reed's sliding doors are made of fine vertical flutes that catch the light and hide the clutter. Inside, two adjustable shelves and a cable cut-out make it just as useful under a television as in a dining room.",
    specifications: [
      { label: "Dimensions", value: "W 180 × D 45 × H 72 cm" },
      { label: "Materials", value: "Oak veneer on FSC-certified board, solid oak legs" },
      { label: "Storage", value: "2 sliding doors, 2 adjustable shelves, cable outlet" },
      { label: "Lead time", value: "Ships in 3–4 weeks" },
    ],
    variants: [{ priceCents: 138000, stock: 3 }],
    images: [P.sideboard],
  },
  {
    slug: "tove-linen-cushion",
    name: "Tove Linen Cushion",
    category: "living",
    skuPrefix: "TOV",
    publishedAt: "2026-10-09T00:00:00.000Z",
    shortDescription: "A stonewashed linen cushion with a feather insert and hidden zip.",
    description:
      "Tove's cover is woven from European flax and stonewashed until it drapes softly. The feather-and-down insert is generously filled, so the cushion holds its shape and takes a satisfying karate chop.",
    specifications: [
      { label: "Size", value: "50 × 50 cm" },
      { label: "Materials", value: "100% linen cover, feather and down insert" },
      { label: "Care", value: "Cover machine washable at 40°C" },
    ],
    options: [
      {
        name: "Color",
        values: [
          { value: "Ivory", swatch: "#EFEAE1" },
          { value: "Rust", swatch: "#B25A33" },
        ],
      },
    ],
    variants: [
      { options: { Color: "Ivory" }, priceCents: 5800, stock: 24 },
      { options: { Color: "Rust" }, priceCents: 5800, stock: 14 },
    ],
    images: [P.cushions],
  },
  {
    slug: "saga-oak-dining-table",
    name: "Saga Oak Dining Table",
    category: "kitchen-dining",
    skuPrefix: "SAG",
    featured: true,
    publishedAt: "2026-10-14T00:00:00.000Z",
    shortDescription: "A solid oak dining table with a softly bevelled top, made for long dinners.",
    description:
      "Saga is built from solid European oak with traditional mortise-and-tenon joints, so it will outlast many sets of chairs. The edges of the top are gently bevelled, which makes it look lighter than it is, and the matt lacquer stands up to everyday spills.",
    specifications: [
      {
        label: "Dimensions",
        value: "6-seat: L 180 × W 90 × H 75 cm · 8-seat: L 220 × W 95 × H 75 cm",
      },
      { label: "Materials", value: "Solid FSC-certified European oak, matt lacquer" },
      { label: "Care", value: "Wipe with a damp cloth; use coasters for hot dishes" },
      { label: "Lead time", value: "Made to order, ships in 5–6 weeks" },
    ],
    options: [{ name: "Size", values: [{ value: "Seats 6" }, { value: "Seats 8" }] }],
    variants: [
      { options: { Size: "Seats 6" }, priceCents: 149000, stock: 3 },
      { options: { Size: "Seats 8" }, priceCents: 189000, stock: 2 },
    ],
    images: [P.diningTable],
  },
  {
    slug: "hearth-enameled-dutch-oven",
    name: "Hearth Enameled Dutch Oven",
    category: "kitchen-dining",
    skuPrefix: "HTH",
    publishedAt: "2026-10-11T00:00:00.000Z",
    shortDescription: "Enameled cast iron for slow braises, stews and crusty sourdough.",
    description:
      "Heavy cast iron holds an even heat for hours, and the smooth enamel inside needs no seasoning. The tight-fitting lid keeps moisture in for braises and steam in for bread. It goes from hob to oven to table, and works on every heat source including induction.",
    specifications: [
      { label: "Capacity", value: "4.5 qt (4.3 L) or 6.5 qt (6.2 L)" },
      { label: "Materials", value: "Enameled cast iron, stainless steel knob" },
      { label: "Heat sources", value: "Gas, electric, induction; oven safe to 260°C" },
      { label: "Care", value: "Dishwasher safe; hand washing keeps the enamel glossy" },
    ],
    options: [{ name: "Capacity", values: [{ value: "4.5 qt" }, { value: "6.5 qt" }] }],
    variants: [
      { options: { Capacity: "4.5 qt" }, priceCents: 17500, stock: 10 },
      { options: { Capacity: "6.5 qt" }, priceCents: 21500, stock: 6 },
    ],
    images: [P.dutchOven],
  },
  {
    slug: "dune-stoneware-mugs",
    name: "Dune Stoneware Mugs, Set of 4",
    category: "kitchen-dining",
    skuPrefix: "DUN",
    publishedAt: "2026-10-07T00:00:00.000Z",
    shortDescription: "Wheel-thrown stoneware mugs with a speckled glaze and an unglazed foot.",
    description:
      "Each Dune mug is thrown on the wheel, so no two are quite alike. A speckled, oatmeal glaze breaks over the rim, and the raw clay foot shows how the piece was made. They hold a generous 350 ml and sit well in two hands.",
    specifications: [
      { label: "Capacity", value: "350 ml each" },
      { label: "Materials", value: "Stoneware, lead-free glaze" },
      { label: "Care", value: "Dishwasher and microwave safe" },
    ],
    variants: [{ priceCents: 6400, compareAtCents: 7800, stock: 18 }],
    images: [P.mugs],
  },
  {
    slug: "aria-hand-blown-wine-glasses",
    name: "Aria Hand-Blown Wine Glasses, Set of 2",
    category: "kitchen-dining",
    skuPrefix: "ARI",
    publishedAt: "2026-10-05T00:00:00.000Z",
    shortDescription: "Thin, mouth-blown glasses with a fine rim and a long, slender stem.",
    description:
      "Aria glasses are blown by hand from lead-free crystal, which lets the rim be finer than machine-made glass. The tall, gently tapered bowl suits both whites and lighter reds.",
    specifications: [
      { label: "Capacity", value: "450 ml each" },
      { label: "Height", value: "23 cm" },
      { label: "Materials", value: "Lead-free crystal, mouth-blown" },
      { label: "Care", value: "Hand wash recommended" },
    ],
    variants: [{ priceCents: 5400, stock: 20 }],
    images: [P.wineGlass],
  },
  {
    slug: "cloudrest-duvet-insert",
    name: "Cloudrest Duvet Insert",
    category: "bedroom",
    skuPrefix: "CLD",
    publishedAt: "2026-10-13T00:00:00.000Z",
    shortDescription:
      "An all-season down-alternative duvet that's light, warm and machine washable.",
    description:
      "Cloudrest is filled with fine recycled microfibre that lofts like down, without the feathers. Baffle-box stitching keeps the fill evenly spread, and the breathable cotton shell keeps you comfortable from autumn to spring.",
    specifications: [
      { label: "Materials", value: "Organic cotton shell, recycled microfibre fill" },
      { label: "Warmth", value: "All-season (medium weight)" },
      { label: "Care", value: "Machine wash at 40°C; tumble dry low" },
    ],
    options: [{ name: "Size", values: [{ value: "Full/Queen" }, { value: "King" }] }],
    variants: [
      { options: { Size: "Full/Queen" }, priceCents: 22000, stock: 9 },
      { options: { Size: "King" }, priceCents: 26000, stock: 5 },
    ],
    images: [P.duvetInsert],
  },
  {
    slug: "mulberry-silk-pillowcase",
    name: "Mulberry Silk Pillowcase",
    category: "bedroom",
    skuPrefix: "MUL",
    publishedAt: "2026-10-08T00:00:00.000Z",
    shortDescription: "A 22-momme mulberry silk pillowcase that's cool, smooth and kind to hair.",
    description:
      "Woven from long-fibre mulberry silk, this pillowcase feels cool to the touch and reduces friction, so hair tangles less and skin isn't creased by the morning. An envelope closure keeps the pillow in place without a zip.",
    specifications: [
      { label: "Size", value: "Standard, 51 × 76 cm" },
      { label: "Materials", value: "100% mulberry silk, 22 momme" },
      { label: "Care", value: "Hand wash or delicate cycle in a mesh bag; air dry" },
    ],
    options: [
      {
        name: "Color",
        values: [
          { value: "Pearl", swatch: "#EDE9E1" },
          { value: "Graphite", swatch: "#4A4A4C" },
        ],
      },
    ],
    variants: [
      { options: { Color: "Pearl" }, priceCents: 8900, stock: 15 },
      { options: { Color: "Graphite" }, priceCents: 8900, stock: 0 },
    ],
    images: [P.silkPillow],
  },
  {
    slug: "rhea-oak-spindle-bed",
    name: "Rhea Oak Spindle Bed",
    category: "bedroom",
    skuPrefix: "RHE",
    featured: true,
    publishedAt: "2026-10-15T00:00:00.000Z",
    shortDescription: "A light, airy bed frame with a spindle headboard in solid oak.",
    description:
      "Rhea's headboard is made of turned oak spindles that let light and air pass through, so even a small bedroom feels open. The frame is solid oak throughout, with a sprung slatted base included and no need for a box spring.",
    specifications: [
      {
        label: "Dimensions",
        value: "Queen: W 168 × L 215 cm · King: W 208 × L 215 cm · headboard H 100 cm",
      },
      { label: "Materials", value: "Solid FSC-certified oak, birch slats" },
      { label: "Includes", value: "Sprung slatted base; mattress not included" },
      { label: "Lead time", value: "Ships in 3–4 weeks" },
    ],
    options: [{ name: "Size", values: [{ value: "Queen" }, { value: "King" }] }],
    variants: [
      { options: { Size: "Queen" }, priceCents: 169000, stock: 3 },
      { options: { Size: "King" }, priceCents: 189000, stock: 2 },
    ],
    images: [P.spindleBed],
  },
  {
    slug: "sora-seagrass-laundry-basket",
    name: "Sora Seagrass Laundry Basket",
    category: "bedroom",
    skuPrefix: "SOR",
    publishedAt: "2026-10-04T00:00:00.000Z",
    shortDescription: "A hand-woven seagrass basket with handles, for laundry, throws or toys.",
    description:
      "Sora is woven by hand from natural seagrass in a tight, sturdy weave. The rolled top folds down for a lower profile, and two woven handles make it easy to carry to the wash.",
    specifications: [
      { label: "Dimensions", value: "Ø 40 × H 50 cm" },
      { label: "Materials", value: "Natural seagrass" },
      { label: "Care", value: "Wipe with a dry cloth; keep away from damp" },
    ],
    variants: [{ priceCents: 8600, stock: 12 }],
    images: [P.laundryBasket],
  },
  {
    slug: "waffle-weave-shower-curtain",
    name: "Waffle Weave Shower Curtain",
    category: "bath",
    skuPrefix: "CUR",
    publishedAt: "2026-10-10T00:00:00.000Z",
    shortDescription:
      "A heavyweight cotton waffle curtain with a woven band, quick-drying and soft.",
    description:
      "A deep waffle weave gives this curtain body and texture, and the cotton dries quickly between showers. A woven band near the top adds a quiet detail. Hang it on its own or with a liner.",
    specifications: [
      { label: "Size", value: "180 × 180 cm" },
      { label: "Materials", value: "100% cotton, reinforced buttonholes" },
      { label: "Care", value: "Machine wash at 40°C" },
    ],
    variants: [{ priceCents: 9800, stock: 14 }],
    images: [P.showerCurtain],
  },
  {
    slug: "pure-olive-bar-soap",
    name: "Pure Olive Bar Soap, Set of 3",
    category: "bath",
    skuPrefix: "OLS",
    publishedAt: "2026-10-03T00:00:00.000Z",
    shortDescription: "Cold-process olive oil soap that's gentle, unscented and long-lasting.",
    description:
      "Made in small batches from olive oil and cured for eight weeks, these bars give a creamy lather and last far longer than ordinary soap. They're unscented and suitable for sensitive skin, face and hands alike.",
    specifications: [
      { label: "Weight", value: "3 × 120 g" },
      { label: "Ingredients", value: "Saponified olive oil, water, sea salt" },
      { label: "Care", value: "Keep dry between uses to make each bar last" },
    ],
    variants: [{ priceCents: 2400, stock: 40 }],
    images: [P.oliveSoap],
  },
  {
    slug: "waffle-hand-towels",
    name: "Waffle Hand Towels, Set of 2",
    category: "bath",
    skuPrefix: "HTW",
    publishedAt: "2026-10-06T00:00:00.000Z",
    shortDescription: "Light, absorbent waffle-weave cotton hand towels with a hanging loop.",
    description:
      "Waffle weave is lighter than terry but just as absorbent, and it dries much faster. These towels soften with every wash, and a cotton loop lets them hang neatly from a hook.",
    specifications: [
      { label: "Size", value: "50 × 90 cm each" },
      { label: "Materials", value: "100% Turkish cotton" },
      { label: "Care", value: "Machine wash at 60°C; tumble dry low" },
    ],
    options: [
      {
        name: "Color",
        values: [
          { value: "White", swatch: "#F5F3EF" },
          { value: "Charcoal", swatch: "#4B4A48" },
        ],
      },
    ],
    variants: [
      { options: { Color: "White" }, priceCents: 3800, stock: 25 },
      { options: { Color: "Charcoal" }, priceCents: 3800, stock: 4 },
    ],
    images: [P.handTowels],
  },
  {
    slug: "ash-wood-bath-tray",
    name: "Ash Wood Bath Tray",
    category: "bath",
    skuPrefix: "ASH",
    publishedAt: "2026-10-02T00:00:00.000Z",
    shortDescription:
      "A slatted ash tray that rests across the tub for a book, candle or cup of tea.",
    description:
      "Made from solid ash with an oiled, water-resistant finish, the tray sits securely across most bathtubs. The gaps between the slats let water drain away, and non-slip pads underneath keep it steady.",
    specifications: [
      { label: "Dimensions", value: "L 75 × W 20 × H 3 cm" },
      { label: "Materials", value: "Solid ash, natural oil finish" },
      { label: "Care", value: "Wipe dry after use; re-oil occasionally" },
    ],
    variants: [{ priceCents: 7800, stock: 9 }],
    images: [P.bathTray],
  },
  {
    slug: "arch-floor-mirror",
    name: "Arch Floor Mirror",
    category: "decor",
    skuPrefix: "ARC",
    featured: true,
    publishedAt: "2026-10-16T12:00:00.000Z",
    shortDescription: "A full-length arched mirror with a slim metal frame, to lean or hang.",
    description:
      "A tall arch brings a soft, architectural shape to a hallway or bedroom and bounces light around the room. The slim powder-coated frame keeps it minimal, and it can lean against a wall or hang from the included cleat.",
    specifications: [
      { label: "Dimensions", value: "W 70 × H 170 cm" },
      { label: "Materials", value: "Powder-coated steel frame, 5 mm safety-backed glass" },
      { label: "Includes", value: "Wall cleat and anti-tip strap" },
    ],
    variants: [{ priceCents: 34000, compareAtCents: 39000, stock: 5 }],
    images: [P.floorMirror],
  },
  {
    slug: "beeswax-taper-candles",
    name: "Beeswax Taper Candles, Set of 6",
    category: "decor",
    skuPrefix: "BEE",
    publishedAt: "2026-10-01T12:00:00.000Z",
    shortDescription: "Hand-dipped beeswax tapers with a warm glow and a faint scent of honey.",
    description:
      "Dipped by hand in pure beeswax, these tapers burn cleanly and slowly with a bright, warm flame. They fit standard candlesticks and give about eight hours of light each.",
    specifications: [
      { label: "Size", value: "H 25 cm, Ø 2.2 cm" },
      { label: "Materials", value: "100% beeswax, cotton wick" },
      { label: "Burn time", value: "About 8 hours each" },
    ],
    variants: [{ priceCents: 3400, stock: 30 }],
    images: [P.taperCandle],
  },
  {
    slug: "celadon-bud-planter",
    name: "Celadon Bud Planter",
    category: "decor",
    skuPrefix: "CEL",
    publishedAt: "2026-10-09T12:00:00.000Z",
    shortDescription:
      "A small stoneware planter in a crackled celadon glaze, with a drainage hole.",
    description:
      "The soft green celadon glaze crackles as it cools in the kiln, so every planter has its own pattern. A drainage hole and cork plug let you choose between a happy plant and a dry shelf.",
    specifications: [
      { label: "Dimensions", value: "Small: Ø 11 × H 10 cm · Large: Ø 16 × H 14 cm" },
      { label: "Materials", value: "Glazed stoneware, cork plug" },
      { label: "Care", value: "Wipe clean; frost sensitive" },
    ],
    options: [{ name: "Size", values: [{ value: "Small" }, { value: "Large" }] }],
    variants: [
      { options: { Size: "Small" }, priceCents: 3600, stock: 14 },
      { options: { Size: "Large" }, priceCents: 5800, stock: 9 },
    ],
    images: [P.budPlanter],
  },
  {
    slug: "cone-brass-candlesticks",
    name: "Cone Brass Candlesticks, Set of 3",
    category: "decor",
    skuPrefix: "CON",
    publishedAt: "2026-10-12T12:00:00.000Z",
    shortDescription: "Three solid brass candlesticks in graduated heights, on slender cone bases.",
    description:
      "Cast in solid brass and finished by hand, these candlesticks are weighted to stand steady. Grouped in three heights they make a small skyline on a table or mantel, and the unlacquered brass develops a soft patina over time.",
    specifications: [
      { label: "Heights", value: "18, 23 and 28 cm" },
      { label: "Materials", value: "Solid unlacquered brass" },
      { label: "Fits", value: "Standard taper candles, 2.2 cm" },
    ],
    variants: [{ priceCents: 9600, compareAtCents: 12000, stock: 7 }],
    images: [P.candlesticks],
  },
];

// ---------------------------------------------------------------------------
// Discount codes and store settings
// ---------------------------------------------------------------------------
export const discountCodes = [
  {
    code: "WELCOME10",
    description: "10% off your first order",
    type: "percentage",
    value: 10,
    minSubtotalCents: 0,
  },
  {
    code: "SAVE25",
    description: "$25 off orders over $150",
    type: "fixed_amount",
    value: 2500,
    minSubtotalCents: 15000,
  },
  {
    code: "SUMMER30",
    description: "Expired summer sale (for testing)",
    type: "percentage",
    value: 30,
    minSubtotalCents: 0,
    startsAt: "2026-06-01T00:00:00Z",
    endsAt: "2026-09-01T00:00:00Z",
  },
  {
    code: "LAUNCH5",
    description: "Fully redeemed launch code (for testing)",
    type: "percentage",
    value: 5,
    minSubtotalCents: 0,
    maxRedemptions: 5,
    redemptionCount: 5,
  },
] as const;

export const storeSettings = {
  storeName: "ShopSphere",
  supportEmail: "hello@shopsphere.example",
  announcement: "Complimentary shipping on orders over $150",
};
