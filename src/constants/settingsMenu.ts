/** Instagram-style settings menu — every ecosystem area gets its own row + screen */
export type SettingsMenuItem = {
  id: string;
  label: string;
  sublabel?: string;
  route?: string;
  section: string;
  keywords?: string[];
  danger?: boolean;
};

export const SETTINGS_MENU: SettingsMenuItem[] = [
  // —— Your AURA account ——
  {
    id: "accounts-center",
    label: "Accounts Center",
    sublabel: "Profiles, passwords, personal details and security",
    route: "/settings/accounts",
    section: "Your AURA account",
    keywords: ["profile", "switch", "password", "email", "phone"],
  },
  {
    id: "archives",
    label: "Archives",
    sublabel: "Posts, stories and reels you've archived",
    route: "/settings/archives",
    section: "Your AURA account",
    keywords: ["saved", "hidden"],
  },
  {
    id: "your-activity",
    label: "Your activity",
    sublabel: "Likes, comments, watch history",
    route: "/settings/activity",
    section: "Your AURA account",
    keywords: ["history", "interactions"],
  },
  {
    id: "notifications",
    label: "Notifications",
    route: "/settings/notifications",
    section: "Your AURA account",
    keywords: ["push", "orders", "messages", "live"],
  },
  {
    id: "time-spent",
    label: "Time spent",
    sublabel: "Daily limits and quiet hours",
    route: "/settings/time",
    section: "Your AURA account",
    keywords: ["screen", "limit"],
  },

  // —— How you use AURA ——
  {
    id: "content-preferences",
    label: "Content preferences",
    sublabel: "Sensitive content and recommendations",
    route: "/settings/content",
    section: "How you use AURA",
    keywords: ["feed", "recommendations"],
  },
  {
    id: "creator-tools",
    label: "Creator tools",
    sublabel: "Reels quality, uploads and prompter",
    route: "/settings/creator",
    section: "How you use AURA",
    keywords: ["reels", "video", "upload"],
  },

  // —— Who can see your content ——
  {
    id: "account-privacy",
    label: "Account privacy",
    sublabel: "Public or private account",
    route: "/settings/privacy",
    section: "Who can see your content",
    keywords: ["private", "public", "followers"],
  },
  {
    id: "close-friends",
    label: "Close Friends",
    route: "/settings/close-friends",
    section: "Who can see your content",
    keywords: ["story", "share"],
  },
  {
    id: "blocked",
    label: "Blocked",
    route: "/settings/blocked",
    section: "Who can see your content",
    keywords: ["block", "restrict"],
  },

  // —— How others interact ——
  {
    id: "messages-replies",
    label: "Messages and story replies",
    route: "/settings/messages",
    section: "How others can interact with you",
    keywords: ["dm", "reply"],
  },
  {
    id: "tags-mentions",
    label: "Tags and mentions",
    route: "/settings/tags",
    section: "How others can interact with you",
    keywords: ["tag", "mention"],
  },

  // —— What you see ——
  {
    id: "favorites",
    label: "Favorites",
    route: "/settings/favorites",
    section: "What you see",
    keywords: ["feed", "priority"],
  },
  {
    id: "muted",
    label: "Muted accounts",
    route: "/settings/muted",
    section: "What you see",
    keywords: ["mute", "hide"],
  },

  // —— Your app and media ——
  {
    id: "saved",
    label: "Saved",
    route: "/settings/saved",
    section: "Your app and media",
    keywords: ["bookmark", "collection"],
  },
  {
    id: "accessibility",
    label: "Accessibility",
    route: "/settings/accessibility",
    section: "Your app and media",
    keywords: ["caption", "contrast"],
  },
  {
    id: "language",
    label: "Language",
    route: "/settings/language",
    section: "Your app and media",
    keywords: ["locale", "english"],
  },
  {
    id: "media-quality",
    label: "Media quality",
    sublabel: "Photos, videos and downloads",
    route: "/settings/creator",
    section: "Your app and media",
    keywords: ["hd", "cellular"],
  },

  // —— Orders and payments ——
  {
    id: "shop",
    label: "Shop preferences",
    sublabel: "Country, COD, offers and express delivery",
    route: "/settings/shop",
    section: "Orders and payments",
    keywords: ["checkout", "cod", "delivery"],
  },
  {
    id: "delivery",
    label: "Delivery addresses",
    route: "/settings/delivery",
    section: "Orders and payments",
    keywords: ["address", "shipping"],
  },
  {
    id: "orders",
    label: "Orders",
    route: "/shop/orders",
    section: "Orders and payments",
    keywords: ["track", "purchase", "history"],
  },
  {
    id: "payments",
    label: "Payment methods",
    route: "/settings/payments",
    section: "Orders and payments",
    keywords: ["card", "upi", "wallet"],
  },
  {
    id: "loyalty",
    label: "Loyalty Vault",
    route: "/account/loyalty-vault",
    section: "Orders and payments",
    keywords: ["rewards", "points"],
  },

  // —— For professionals ——
  {
    id: "store-management",
    label: "Store management",
    sublabel: "Catalog, orders, shipping, payouts and promotions",
    route: "/settings/store",
    section: "For professionals",
    keywords: ["shop", "seller", "catalog", "inventory", "instagram shop"],
  },
  {
    id: "business-suite",
    label: "AURA Business Suite",
    sublabel: "Catalog, ads, team and analytics",
    route: "/maison/business-suite",
    section: "For professionals",
    keywords: ["maison", "seller", "brand"],
  },
  {
    id: "ads-studio",
    label: "Ads Studio",
    route: "/maison/ads-studio",
    section: "For professionals",
    keywords: ["marketing", "campaign"],
  },
  {
    id: "sponsorships",
    label: "Brand partnerships",
    route: "/sponsorships",
    section: "For professionals",
    keywords: ["sponsor", "collab"],
  },

  // —— More info and support ——
  {
    id: "help",
    label: "Help",
    route: "/settings/help",
    section: "More info and support",
    keywords: ["support", "faq"],
  },
  {
    id: "support",
    label: "Contact support",
    route: "/settings/support",
    section: "More info and support",
    keywords: ["ticket", "report", "problem"],
  },
  {
    id: "about",
    label: "About",
    route: "/settings/about",
    section: "More info and support",
    keywords: ["version", "terms"],
  },
  {
    id: "download-data",
    label: "Download your information",
    route: "/settings/data",
    section: "More info and support",
    keywords: ["export", "json"],
  },
  {
    id: "delete-account",
    label: "Delete account",
    route: "/settings/delete-account",
    section: "More info and support",
    keywords: ["deactivate", "remove"],
    danger: true,
  },
];

export function groupSettingsMenu(items: SettingsMenuItem[]) {
  const sections: { title: string; items: SettingsMenuItem[] }[] = [];
  for (const item of items) {
    const last = sections[sections.length - 1];
    if (last?.title === item.section) {
      last.items.push(item);
    } else {
      sections.push({ title: item.section, items: [item] });
    }
  }
  return sections;
}

export function filterSettingsMenu(query: string, items = SETTINGS_MENU) {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      item.sublabel?.toLowerCase().includes(q) ||
      item.section.toLowerCase().includes(q) ||
      item.keywords?.some((k) => k.includes(q))
  );
}
