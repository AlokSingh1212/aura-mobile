import { loadEcosystemSettings } from "@/lib/ecosystemSettings";

type Lang = "en" | "hi" | "fr" | "es" | "de" | "ar" | "ja" | "ko" | "zh";

const STRINGS: Record<Lang, Record<string, string>> = {
  en: {
    "settings.title": "Settings",
    "settings.language": "Language",
    "settings.payments": "Payment methods",
    "settings.data": "Download your information",
    "settings.delete": "Delete account",
    "auth.signIn": "Sign in",
    "auth.signOut": "Sign out",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.loading": "Loading…",
    "common.error": "Something went wrong",
    "insights.title": "Professional dashboard",
    "insights.followers": "Followers",
    "insights.reached": "Accounts reached",
    "insights.visits": "Profile visits",
  },
  hi: {
    "settings.title": "सेटिंग्स",
    "settings.language": "भाषा",
    "settings.payments": "भुगतान के तरीके",
    "settings.data": "अपनी जानकारी डाउनलोड करें",
    "settings.delete": "खाता हटाएं",
    "auth.signIn": "साइन इन",
    "auth.signOut": "साइन आउट",
    "common.save": "सहेजें",
    "common.cancel": "रद्द करें",
    "common.loading": "लोड हो रहा है…",
    "common.error": "कुछ गलत हो गया",
    "insights.title": "प्रोफेशनल डैशबोर्ड",
    "insights.followers": "फ़ॉलोअर्स",
    "insights.reached": "पहुँचे खाते",
    "insights.visits": "प्रोफ़ाइल विज़िट",
  },
  fr: {
    "settings.title": "Paramètres",
    "settings.language": "Langue",
    "settings.payments": "Modes de paiement",
    "settings.data": "Télécharger vos informations",
    "settings.delete": "Supprimer le compte",
    "auth.signIn": "Se connecter",
    "auth.signOut": "Se déconnecter",
    "common.save": "Enregistrer",
    "common.cancel": "Annuler",
    "common.loading": "Chargement…",
    "common.error": "Une erreur est survenue",
    "insights.title": "Tableau de bord pro",
    "insights.followers": "Abonnés",
    "insights.reached": "Comptes atteints",
    "insights.visits": "Visites du profil",
  },
  es: {
    "settings.title": "Ajustes",
    "settings.language": "Idioma",
    "settings.payments": "Métodos de pago",
    "settings.data": "Descargar tu información",
    "settings.delete": "Eliminar cuenta",
    "auth.signIn": "Iniciar sesión",
    "auth.signOut": "Cerrar sesión",
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.loading": "Cargando…",
    "common.error": "Algo salió mal",
    "insights.title": "Panel profesional",
    "insights.followers": "Seguidores",
    "insights.reached": "Cuentas alcanzadas",
    "insights.visits": "Visitas al perfil",
  },
  de: {
    "settings.title": "Einstellungen",
    "settings.language": "Sprache",
    "settings.payments": "Zahlungsmethoden",
    "settings.data": "Informationen herunterladen",
    "settings.delete": "Konto löschen",
    "auth.signIn": "Anmelden",
    "auth.signOut": "Abmelden",
    "common.save": "Speichern",
    "common.cancel": "Abbrechen",
    "common.loading": "Wird geladen…",
    "common.error": "Etwas ist schiefgelaufen",
    "insights.title": "Profi-Dashboard",
    "insights.followers": "Follower",
    "insights.reached": "Erreichte Konten",
    "insights.visits": "Profilbesuche",
  },
  ar: {
    "settings.title": "الإعدادات",
    "settings.language": "اللغة",
    "settings.payments": "طرق الدفع",
    "settings.data": "تنزيل معلوماتك",
    "settings.delete": "حذف الحساب",
    "auth.signIn": "تسجيل الدخول",
    "auth.signOut": "تسجيل الخروج",
    "common.save": "حفظ",
    "common.cancel": "إلغاء",
    "common.loading": "جارٍ التحميل…",
    "common.error": "حدث خطأ",
    "insights.title": "لوحة المحترف",
    "insights.followers": "المتابعون",
    "insights.reached": "الحسابات التي تم الوصول إليها",
    "insights.visits": "زيارات الملف الشخصي",
  },
  ja: {
    "settings.title": "設定",
    "settings.language": "言語",
    "settings.payments": "支払い方法",
    "settings.data": "情報をダウンロード",
    "settings.delete": "アカウントを削除",
    "auth.signIn": "ログイン",
    "auth.signOut": "ログアウト",
    "common.save": "保存",
    "common.cancel": "キャンセル",
    "common.loading": "読み込み中…",
    "common.error": "エラーが発生しました",
    "insights.title": "プロダッシュボード",
    "insights.followers": "フォロワー",
    "insights.reached": "リーチしたアカウント",
    "insights.visits": "プロフィール訪問",
  },
  ko: {
    "settings.title": "설정",
    "settings.language": "언어",
    "settings.payments": "결제 수단",
    "settings.data": "정보 다운로드",
    "settings.delete": "계정 삭제",
    "auth.signIn": "로그인",
    "auth.signOut": "로그아웃",
    "common.save": "저장",
    "common.cancel": "취소",
    "common.loading": "로딩 중…",
    "common.error": "문제가 발생했습니다",
    "insights.title": "프로 대시보드",
    "insights.followers": "팔로워",
    "insights.reached": "도달한 계정",
    "insights.visits": "프로필 방문",
  },
  zh: {
    "settings.title": "设置",
    "settings.language": "语言",
    "settings.payments": "支付方式",
    "settings.data": "下载你的信息",
    "settings.delete": "删除账户",
    "auth.signIn": "登录",
    "auth.signOut": "退出",
    "common.save": "保存",
    "common.cancel": "取消",
    "common.loading": "加载中…",
    "common.error": "出错了",
    "insights.title": "专业面板",
    "insights.followers": "粉丝",
    "insights.reached": "触达账户",
    "insights.visits": "主页访问",
  },
};

function resolveLang(code: string): Lang {
  const base = code.split("-")[0] as Lang;
  return STRINGS[base] ? base : "en";
}

let cachedLang: Lang = "en";

export async function refreshI18nLanguage() {
  const settings = await loadEcosystemSettings();
  cachedLang = resolveLang(settings.language.appLanguage || "en");
}

export function t(key: string, fallback?: string): string {
  return STRINGS[cachedLang]?.[key] ?? STRINGS.en[key] ?? fallback ?? key;
}

export function getCurrentLanguage(): Lang {
  return cachedLang;
}
