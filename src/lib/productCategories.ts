export type ProductFieldType = "text" | "multiline" | "number" | "select" | "multi-select";

export interface ProductFieldDef {
  key: string;
  label: string;
  type: ProductFieldType;
  options?: string[];
  required?: boolean;
  placeholder?: string;
}

export interface ProductSubcategoryDef {
  id: string;
  label: string;
  sizeOptions?: string[];
  colorOptions?: string[];
  fields: ProductFieldDef[];
}

export interface ProductCategoryDef {
  id: string;
  label: string;
  icon: string;
  artifactType: string;
  vibeDefault: string;
  subcategories: ProductSubcategoryDef[];
}

export interface ResolvedProductForm {
  categoryId: string;
  categoryLabel: string;
  subcategoryId: string;
  subcategoryLabel: string;
  artifactType: string;
  vibeDefault: string;
  sizeOptions?: string[];
  colorOptions?: string[];
  fields: ProductFieldDef[];
}

const SIZES_APPAREL = ["XS", "S", "M", "L", "XL", "XXL"];
const COLORS_BASIC = ["Black", "White", "Navy", "Beige", "Brown", "Red", "Multi"];
const SIZES_SHOES = ["5", "6", "7", "8", "9", "10", "11", "12"];

export const PRODUCT_CATEGORIES: ProductCategoryDef[] = [
  {
    id: "fashion",
    label: "Fashion",
    icon: "shirt-outline",
    artifactType: "Fashion",
    vibeDefault: "Quiet Luxury",
    subcategories: [
      {
        id: "tops",
        label: "Tops & Tees",
        sizeOptions: SIZES_APPAREL,
        colorOptions: COLORS_BASIC,
        fields: [
          { key: "material", label: "Fabric", type: "text", required: true, placeholder: "Cotton, linen, silk…" },
          { key: "neckline", label: "Neckline", type: "select", options: ["Crew", "V-neck", "Collared", "Halter", "Off-shoulder"] },
          { key: "sleeve", label: "Sleeve", type: "select", options: ["Sleeveless", "Short", "3/4", "Full"] },
          { key: "fit", label: "Fit", type: "select", options: ["Regular", "Slim", "Oversized", "Relaxed"] },
          { key: "gender", label: "For", type: "select", options: ["Women", "Men", "Unisex"] },
          { key: "care", label: "Care", type: "text", placeholder: "Machine wash cold" },
        ],
      },
      {
        id: "bottoms",
        label: "Bottoms",
        sizeOptions: ["26", "28", "30", "32", "34", "36", "S", "M", "L", "XL"],
        colorOptions: COLORS_BASIC,
        fields: [
          { key: "material", label: "Fabric", type: "text", required: true },
          { key: "rise", label: "Rise", type: "select", options: ["Low", "Mid", "High"] },
          { key: "length", label: "Length", type: "select", options: ["Short", "Knee", "Ankle", "Full"] },
          { key: "fit", label: "Fit", type: "select", options: ["Skinny", "Straight", "Wide", "Relaxed"] },
          { key: "gender", label: "For", type: "select", options: ["Women", "Men", "Unisex"] },
        ],
      },
      {
        id: "dresses",
        label: "Dresses & Jumpsuits",
        sizeOptions: SIZES_APPAREL,
        colorOptions: COLORS_BASIC,
        fields: [
          { key: "material", label: "Fabric", type: "text", required: true },
          { key: "length", label: "Length", type: "select", options: ["Mini", "Midi", "Maxi", "Floor"] },
          { key: "occasion", label: "Occasion", type: "select", options: ["Casual", "Party", "Formal", "Bridal"] },
          { key: "silhouette", label: "Silhouette", type: "select", options: ["A-line", "Bodycon", "Wrap", "Shift"] },
        ],
      },
      {
        id: "outerwear",
        label: "Jackets & Coats",
        sizeOptions: SIZES_APPAREL,
        colorOptions: COLORS_BASIC,
        fields: [
          { key: "material", label: "Outer material", type: "text", required: true },
          { key: "lining", label: "Lining", type: "text" },
          { key: "closure", label: "Closure", type: "select", options: ["Zip", "Button", "Belt", "Open"] },
          { key: "season", label: "Season", type: "multi-select", options: ["Spring", "Summer", "Monsoon", "Winter"] },
        ],
      },
      {
        id: "ethnic",
        label: "Ethnic & Traditional",
        sizeOptions: SIZES_APPAREL,
        colorOptions: COLORS_BASIC,
        fields: [
          { key: "fabric", label: "Fabric", type: "select", options: ["Silk", "Cotton", "Linen", "Georgette", "Chiffon", "Other"], required: true },
          { key: "work", label: "Embroidery / Work", type: "text", placeholder: "Zari, mirror, block print…" },
          { key: "setIncludes", label: "Set includes", type: "text", placeholder: "Kurta + dupatta + bottom" },
          { key: "occasion", label: "Occasion", type: "select", options: ["Daily", "Festive", "Wedding", "Ceremony"] },
        ],
      },
    ],
  },
  {
    id: "beauty",
    label: "Beauty",
    icon: "flower-outline",
    artifactType: "Beauty",
    vibeDefault: "Aesthetic Core",
    subcategories: [
      {
        id: "skincare",
        label: "Skincare",
        colorOptions: ["Clear", "Tinted", "N/A"],
        fields: [
          { key: "volume", label: "Volume / Size", type: "text", required: true, placeholder: "50ml, 30g" },
          { key: "skinType", label: "Skin type", type: "multi-select", options: ["All", "Oily", "Dry", "Combination", "Sensitive"], required: true },
          { key: "concern", label: "Concern", type: "multi-select", options: ["Hydration", "Anti-aging", "Acne", "Brightening", "SPF"] },
          { key: "ingredients", label: "Key ingredients", type: "multiline" },
          { key: "crueltyFree", label: "Cruelty free", type: "select", options: ["Yes", "No"] },
        ],
      },
      {
        id: "makeup",
        label: "Makeup",
        colorOptions: ["Nude", "Pink", "Red", "Berry", "Coral", "Brown", "Clear"],
        fields: [
          { key: "volume", label: "Size", type: "text", required: true },
          { key: "shade", label: "Shade name / number", type: "text", required: true },
          { key: "finish", label: "Finish", type: "select", options: ["Matte", "Dewy", "Satin", "Glitter", "Natural"] },
          { key: "coverage", label: "Coverage", type: "select", options: ["Sheer", "Medium", "Full"] },
          { key: "longevity", label: "Long wear", type: "select", options: ["Standard", "12h+", "24h"] },
        ],
      },
      {
        id: "haircare",
        label: "Haircare",
        fields: [
          { key: "volume", label: "Size", type: "text", required: true },
          { key: "hairType", label: "Hair type", type: "multi-select", options: ["All", "Straight", "Wavy", "Curly", "Coily", "Coloured"] },
          { key: "benefit", label: "Benefit", type: "multi-select", options: ["Repair", "Volume", "Smooth", "Anti-frizz", "Growth"] },
          { key: "sulfateFree", label: "Sulfate free", type: "select", options: ["Yes", "No"] },
        ],
      },
      {
        id: "fragrance",
        label: "Fragrance",
        fields: [
          { key: "volume", label: "Volume (ml)", type: "text", required: true },
          { key: "concentration", label: "Concentration", type: "select", options: ["Eau de Cologne", "Eau de Toilette", "Eau de Parfum", "Parfum"] },
          { key: "notes", label: "Fragrance notes", type: "multiline", placeholder: "Top, heart, base notes" },
          { key: "gender", label: "For", type: "select", options: ["Women", "Men", "Unisex"] },
        ],
      },
    ],
  },
  {
    id: "jewelry",
    label: "Jewelry",
    icon: "diamond-outline",
    artifactType: "Luxury",
    vibeDefault: "Quiet Luxury",
    subcategories: [
      {
        id: "necklaces",
        label: "Necklaces & Pendants",
        colorOptions: ["Gold", "Silver", "Rose Gold", "Platinum", "Mixed"],
        fields: [
          { key: "material", label: "Metal", type: "select", options: ["Gold", "Silver", "Platinum", "Gold-plated", "Other"], required: true },
          { key: "purity", label: "Purity / KT", type: "text", placeholder: "14K, 18K, 925 silver" },
          { key: "stone", label: "Stone / Gem", type: "text" },
          { key: "chainLength", label: "Chain length (cm)", type: "text", required: true },
          { key: "weight", label: "Weight (grams)", type: "number" },
        ],
      },
      {
        id: "rings",
        label: "Rings",
        sizeOptions: ["5", "6", "7", "8", "9", "10", "11", "12", "Adjustable"],
        colorOptions: ["Gold", "Silver", "Rose Gold", "Platinum"],
        fields: [
          { key: "material", label: "Metal", type: "select", options: ["Gold", "Silver", "Platinum", "Other"], required: true },
          { key: "stone", label: "Stone", type: "text" },
          { key: "weight", label: "Weight (grams)", type: "number" },
          { key: "occasion", label: "Occasion", type: "select", options: ["Daily", "Engagement", "Wedding", "Statement"] },
        ],
      },
      {
        id: "earrings",
        label: "Earrings",
        colorOptions: ["Gold", "Silver", "Rose Gold", "Mixed"],
        fields: [
          { key: "material", label: "Metal", type: "select", options: ["Gold", "Silver", "Platinum", "Other"], required: true },
          { key: "type", label: "Type", type: "select", options: ["Stud", "Hoop", "Drop", "Jhumka", "Cuff"] },
          { key: "closure", label: "Closure", type: "select", options: ["Push back", "Screw", "Hook", "Clip"] },
          { key: "weight", label: "Pair weight (grams)", type: "number" },
        ],
      },
      {
        id: "watches",
        label: "Watches",
        colorOptions: ["Gold", "Silver", "Black", "Two-tone", "Rose Gold"],
        fields: [
          { key: "brand", label: "Brand", type: "text", required: true },
          { key: "movement", label: "Movement", type: "select", options: ["Quartz", "Automatic", "Manual", "Smart"] },
          { key: "caseSize", label: "Case size (mm)", type: "number", required: true },
          { key: "strap", label: "Strap material", type: "select", options: ["Leather", "Metal", "Silicone", "Fabric"] },
          { key: "waterResist", label: "Water resistance", type: "text", placeholder: "50m, 100m" },
        ],
      },
    ],
  },
  {
    id: "footwear",
    label: "Footwear",
    icon: "footsteps-outline",
    artifactType: "Fashion",
    vibeDefault: "Avant-Garde",
    subcategories: [
      {
        id: "sneakers",
        label: "Sneakers & Casual",
        sizeOptions: SIZES_SHOES,
        colorOptions: ["Black", "White", "Grey", "Multi"],
        fields: [
          { key: "upper", label: "Upper material", type: "text", required: true },
          { key: "sole", label: "Sole type", type: "select", options: ["Rubber", "EVA", "Leather", "Mixed"] },
          { key: "gender", label: "For", type: "select", options: ["Women", "Men", "Unisex"] },
        ],
      },
      {
        id: "heels",
        label: "Heels & Formals",
        sizeOptions: SIZES_SHOES,
        colorOptions: ["Black", "Nude", "Red", "Gold", "Silver"],
        fields: [
          { key: "heelHeight", label: "Heel height (cm)", type: "number", required: true },
          { key: "material", label: "Material", type: "text", required: true },
          { key: "toe", label: "Toe shape", type: "select", options: ["Pointed", "Round", "Open", "Square"] },
        ],
      },
      {
        id: "boots",
        label: "Boots",
        sizeOptions: SIZES_SHOES,
        colorOptions: ["Black", "Brown", "Tan", "Tan"],
        fields: [
          { key: "shaftHeight", label: "Shaft height", type: "select", options: ["Ankle", "Mid-calf", "Knee-high"] },
          { key: "material", label: "Material", type: "text", required: true },
          { key: "closure", label: "Closure", type: "select", options: ["Zip", "Lace", "Slip-on"] },
        ],
      },
    ],
  },
  {
    id: "electronics",
    label: "Electronics",
    icon: "phone-portrait-outline",
    artifactType: "Electronics",
    vibeDefault: "Brutalist Tech",
    subcategories: [
      {
        id: "phones",
        label: "Phones & Tablets",
        colorOptions: ["Black", "White", "Blue", "Gold", "Silver"],
        fields: [
          { key: "brand", label: "Brand", type: "text", required: true },
          { key: "model", label: "Model", type: "text", required: true },
          { key: "storage", label: "Storage", type: "select", options: ["64GB", "128GB", "256GB", "512GB", "1TB"], required: true },
          { key: "ram", label: "RAM", type: "select", options: ["4GB", "6GB", "8GB", "12GB", "16GB"] },
          { key: "warranty", label: "Warranty", type: "select", options: ["6 months", "1 year", "2 years"] },
          { key: "condition", label: "Condition", type: "select", options: ["New", "Refurbished", "Open box"] },
        ],
      },
      {
        id: "audio",
        label: "Audio & Headphones",
        colorOptions: ["Black", "White", "Silver", "Blue"],
        fields: [
          { key: "brand", label: "Brand", type: "text", required: true },
          { key: "type", label: "Type", type: "select", options: ["In-ear", "On-ear", "Over-ear", "Speaker", "Earbuds"] },
          { key: "connectivity", label: "Connectivity", type: "multi-select", options: ["Bluetooth", "Wired", "ANC", "Multipoint"] },
          { key: "battery", label: "Battery life", type: "text", placeholder: "30 hours" },
        ],
      },
      {
        id: "laptops",
        label: "Laptops & Computing",
        colorOptions: ["Silver", "Grey", "Black"],
        fields: [
          { key: "brand", label: "Brand", type: "text", required: true },
          { key: "processor", label: "Processor", type: "text", required: true },
          { key: "storage", label: "Storage", type: "select", options: ["256GB SSD", "512GB SSD", "1TB SSD", "2TB SSD"] },
          { key: "ram", label: "RAM", type: "select", options: ["8GB", "16GB", "32GB", "64GB"] },
          { key: "display", label: "Display size", type: "text", placeholder: '14"' },
        ],
      },
    ],
  },
  {
    id: "home",
    label: "Home & Decor",
    icon: "home-outline",
    artifactType: "Home",
    vibeDefault: "Quiet Luxury",
    subcategories: [
      {
        id: "furniture",
        label: "Furniture",
        colorOptions: ["Wood", "White", "Black", "Beige", "Multi"],
        fields: [
          { key: "dimensions", label: "Dimensions (L×W×H cm)", type: "text", required: true },
          { key: "material", label: "Material", type: "text", required: true },
          { key: "assembly", label: "Assembly", type: "select", options: ["Ready to use", "DIY assembly", "Professional install"] },
        ],
      },
      {
        id: "decor",
        label: "Decor & Art",
        colorOptions: COLORS_BASIC,
        fields: [
          { key: "dimensions", label: "Dimensions", type: "text" },
          { key: "material", label: "Material", type: "text", required: true },
          { key: "style", label: "Style", type: "select", options: ["Modern", "Traditional", "Minimal", "Bohemian", "Luxury"] },
        ],
      },
      {
        id: "kitchen",
        label: "Kitchen & Dining",
        fields: [
          { key: "material", label: "Material", type: "text", required: true },
          { key: "capacity", label: "Capacity / Pieces", type: "text" },
          { key: "dishwasherSafe", label: "Dishwasher safe", type: "select", options: ["Yes", "No"] },
        ],
      },
    ],
  },
  {
    id: "food",
    label: "Food & Gourmet",
    icon: "fast-food-outline",
    artifactType: "Food",
    vibeDefault: "Artisan",
    subcategories: [
      {
        id: "packaged",
        label: "Packaged Foods",
        fields: [
          { key: "weight", label: "Net weight", type: "text", required: true },
          { key: "shelfLife", label: "Shelf life", type: "text", required: true },
          { key: "dietary", label: "Dietary", type: "multi-select", options: ["Veg", "Non-Veg", "Vegan", "Gluten-free", "Organic"] },
          { key: "origin", label: "Origin", type: "text" },
        ],
      },
      {
        id: "beverages",
        label: "Beverages",
        fields: [
          { key: "volume", label: "Volume", type: "text", required: true },
          { key: "type", label: "Type", type: "select", options: ["Tea", "Coffee", "Juice", "Wine", "Spirits", "Other"] },
          { key: "shelfLife", label: "Best before", type: "text", required: true },
        ],
      },
    ],
  },
  {
    id: "sports",
    label: "Sports & Fitness",
    icon: "barbell-outline",
    artifactType: "Sports",
    vibeDefault: "Performance",
    subcategories: [
      {
        id: "apparel",
        label: "Sports Apparel",
        sizeOptions: SIZES_APPAREL,
        colorOptions: ["Black", "Grey", "Blue", "Red", "Neon"],
        fields: [
          { key: "material", label: "Material", type: "text", required: true },
          { key: "activity", label: "Activity", type: "select", options: ["Gym", "Running", "Yoga", "Outdoor", "Swim"] },
          { key: "moistureWicking", label: "Moisture wicking", type: "select", options: ["Yes", "No"] },
        ],
      },
      {
        id: "equipment",
        label: "Equipment & Gear",
        fields: [
          { key: "material", label: "Material", type: "text", required: true },
          { key: "weight", label: "Weight (kg)", type: "number" },
          { key: "skillLevel", label: "Skill level", type: "select", options: ["Beginner", "Intermediate", "Pro"] },
        ],
      },
    ],
  },
  {
    id: "books",
    label: "Books & Media",
    icon: "book-outline",
    artifactType: "Books",
    vibeDefault: "Classic",
    subcategories: [
      {
        id: "books",
        label: "Books",
        fields: [
          { key: "author", label: "Author", type: "text", required: true },
          { key: "format", label: "Format", type: "select", options: ["Hardcover", "Paperback", "E-book", "Audiobook"], required: true },
          { key: "language", label: "Language", type: "text", placeholder: "English" },
          { key: "pages", label: "Pages", type: "number" },
          { key: "genre", label: "Genre", type: "text" },
        ],
      },
    ],
  },
  {
    id: "other",
    label: "Other",
    icon: "cube-outline",
    artifactType: "General",
    vibeDefault: "Curated",
    subcategories: [
      {
        id: "general",
        label: "General product",
        fields: [
          { key: "details", label: "Product details", type: "multiline", required: true },
          { key: "brand", label: "Brand", type: "text" },
          { key: "condition", label: "Condition", type: "select", options: ["New", "Like new", "Used"] },
        ],
      },
    ],
  },
];

export function getCategoryById(id: string): ProductCategoryDef | undefined {
  return PRODUCT_CATEGORIES.find((c) => c.id === id);
}

export function resolveProductForm(categoryId: string, subcategoryId: string): ResolvedProductForm | null {
  const category = getCategoryById(categoryId);
  if (!category) return null;
  const sub = category.subcategories.find((s) => s.id === subcategoryId);
  if (!sub) return null;
  return {
    categoryId: category.id,
    categoryLabel: category.label,
    subcategoryId: sub.id,
    subcategoryLabel: sub.label,
    artifactType: category.artifactType,
    vibeDefault: category.vibeDefault,
    sizeOptions: sub.sizeOptions,
    colorOptions: sub.colorOptions,
    fields: sub.fields,
  };
}

export function buildVariantsFromSelections(
  form: Pick<ResolvedProductForm, "sizeOptions" | "colorOptions">,
  selectedSizes: string[],
  selectedColors: string[],
  basePrice: number,
  stockPerVariant: number
): { title: string; price: number; stock: number }[] {
  const sizes = form.sizeOptions?.length && selectedSizes.length ? selectedSizes : ["One Size"];
  const colors = form.colorOptions?.length && selectedColors.length ? selectedColors : ["Default"];

  const variants: { title: string; price: number; stock: number }[] = [];
  for (const color of colors) {
    for (const size of sizes) {
      const title =
        color === "Default" && size === "One Size"
          ? "Standard"
          : color === "Default"
            ? size
            : size === "One Size"
              ? color
              : `${color} / ${size}`;
      variants.push({ title, price: basePrice, stock: stockPerVariant });
    }
  }
  return variants;
}

export function validateProductForm(
  form: ResolvedProductForm,
  opts: {
    title: string;
    price: string;
    attributeValues: Record<string, string | string[]>;
    selectedSizes: string[];
    mediaCount: number;
  }
): string | null {
  if (!opts.title.trim()) return "Product title is required.";
  if (!opts.price.trim() || Number.isNaN(parseFloat(opts.price)) || parseFloat(opts.price) <= 0) {
    return "Enter a valid price.";
  }
  if (opts.mediaCount === 0) return "Add at least one photo or video.";
  for (const field of form.fields) {
    if (!field.required) continue;
    const val = opts.attributeValues[field.key];
    if (field.type === "multi-select") {
      if (!Array.isArray(val) || val.length === 0) return `${field.label} is required.`;
    } else if (!val || (typeof val === "string" && !val.trim())) {
      return `${field.label} is required.`;
    }
  }
  if (form.sizeOptions?.length && opts.selectedSizes.length === 0) {
    return "Select at least one size.";
  }
  return null;
}
