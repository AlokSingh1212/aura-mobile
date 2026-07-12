/** Match live catalog products for AI concierge / search helpers. */

type ProductLike = {
  id: string;
  title?: string;
  name?: string;
  price?: number;
  vibe?: string;
  images?: string[];
  type?: string;
  maison?: { name?: string; id?: string };
};

const KEYWORD_RULES: { keys: string[]; reply: string; match: (p: ProductLike) => boolean }[] = [
  {
    keys: ["bag", "carryall", "purse", "tote"],
    reply: "Here is a carry bag from our live catalog that matches your query:",
    match: (p) => /bag|carry|tote|purse/i.test(String(p.title || p.name || "")),
  },
  {
    keys: ["hoodie", "vestment", "black", "fashion", "wear"],
    reply: "This fashion piece from our catalog fits your style query:",
    match: (p) =>
      p.type === "Fashion" ||
      /vest|hoodie|coat|jacket|dress|shirt/i.test(String(p.title || "")),
  },
  {
    keys: ["jacket", "trench", "coat"],
    reply: "I found this outerwear item in the catalog:",
    match: (p) => /jacket|trench|coat|blazer/i.test(String(p.title || "")),
  },
  {
    keys: ["cuff", "jewelry", "accessory", "ring", "watch"],
    reply: "Here is a jewelry or accessory match:",
    match: (p) =>
      p.type === "Jewelry" ||
      /cuff|ring|watch|jewel|chain/i.test(String(p.title || "")),
  },
  {
    keys: ["oil", "ghee", "grocery", "food", "atta", "rice"],
    reply: "From our grocery selection:",
    match: (p) =>
      /oil|ghee|atta|rice|food|grocery|snack|biscuit/i.test(String(p.title || "")),
  },
  {
    keys: ["phone", "mobile", "electronic", "laptop"],
    reply: "An electronics item from the shop:",
    match: (p) =>
      p.type === "Electronics" ||
      /phone|mobile|laptop|earbud|charger/i.test(String(p.title || "")),
  },
  {
    keys: ["beauty", "cream", "serum", "lipstick"],
    reply: "A beauty product from our catalog:",
    match: (p) =>
      p.type === "Beauty" ||
      /beauty|cream|serum|lip|skin/i.test(String(p.title || "")),
  },
];

export function matchProductFromQuery(
  query: string,
  products: ProductLike[]
): { product: ProductLike | null; replyText: string } {
  const list = products.filter((p) => p?.id);
  if (!list.length) {
    return {
      product: null,
      replyText: "Our catalog is loading — try again in a moment or browse All Products.",
    };
  }

  const lower = query.toLowerCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.keys.some((k) => lower.includes(k))) {
      const hit = list.find(rule.match);
      if (hit) return { product: hit, replyText: rule.reply };
    }
  }

  const tokenHit = list.find((p) =>
    lower.split(/\s+/).some(
      (w) => w.length > 2 && String(p.title || p.name || "").toLowerCase().includes(w)
    )
  );
  if (tokenHit) {
    return {
      product: tokenHit,
      replyText: "I found this item matching your search in our live catalog:",
    };
  }

  return {
    product: list[0],
    replyText: "Here is a top pick from our current catalog:",
  };
}
