import type { LanguageSettings } from "@/lib/ecosystemSettings";

type Dict = Record<string, string>;

const EN: Dict = {
  "settings.title": "Settings and activity",
  "settings.accounts": "Accounts Center",
  "settings.notifications": "Notifications",
  "settings.privacy": "Account privacy",
  "settings.store": "Store management",
  "settings.help": "Help",
  "settings.support": "Contact support",
  "settings.orders": "Orders",
  "settings.time_limit.title": "Time limit reached",
  "settings.time_limit.body": "You reached your daily AURA time limit. Take a break or adjust limits in Time spent.",
  "settings.time_limit.continue": "Continue 15 min",
  "settings.time_limit.settings": "Change limit",
  "store.hub.title": "Store management",
  "store.catalog": "Catalog",
  "store.orders": "Orders",
  "store.shipping": "Shipping & delivery",
  "store.payouts": "Payouts & earnings",
  "store.customers": "Customer messages",
  "store.promotions": "Promotions",
  "store.policies": "Shop policies",
  "store.vacation": "Vacation mode",
};

const HI: Dict = {
  "settings.title": "सेटिंग्स और गतिविधि",
  "settings.accounts": "अकाउंट्स सेंटर",
  "settings.notifications": "सूचनाएं",
  "settings.privacy": "अकाउंट गोपनीयता",
  "settings.store": "स्टोर प्रबंधन",
  "settings.help": "सहायता",
  "settings.support": "सपोर्ट से संपर्क",
  "settings.orders": "ऑर्डर",
  "settings.time_limit.title": "समय सीमा पूरी",
  "settings.time_limit.body": "आपकी दैनिक AURA समय सीमा पूरी हो गई।",
  "settings.time_limit.continue": "15 मिनट और",
  "settings.time_limit.settings": "सीमा बदलें",
  "store.hub.title": "स्टोर प्रबंधन",
  "store.catalog": "कैटलॉग",
  "store.orders": "ऑर्डर",
  "store.shipping": "शिपिंग और डिलीवरी",
  "store.payouts": "भुगतान और कमाई",
  "store.customers": "ग्राहक संदेश",
  "store.promotions": "प्रमोशन",
  "store.policies": "दुकान नीतियां",
  "store.vacation": "वैकेशन मोड",
};

const FR: Dict = {
  ...EN,
  "settings.title": "Paramètres et activité",
  "settings.store": "Gestion de la boutique",
  "store.hub.title": "Gestion de la boutique",
};

const PACKS: Record<string, Dict> = { en: EN, hi: HI, fr: FR };

let activeLang = "en";

export function setActiveLanguage(settings: LanguageSettings) {
  if (settings.useDeviceLanguage) {
    activeLang = "en";
    return;
  }
  activeLang = settings.appLanguage in PACKS ? settings.appLanguage : "en";
}

export function t(key: string, fallback?: string): string {
  const pack = PACKS[activeLang] || EN;
  return pack[key] || EN[key] || fallback || key;
}

export function getActiveLanguage() {
  return activeLang;
}
