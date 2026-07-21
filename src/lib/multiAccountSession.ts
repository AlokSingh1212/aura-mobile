import AsyncStorage from "@react-native-async-storage/async-storage";

export type SavedAccount = {
  userId: string;
  email: string;
  username: string;
  token: string;
};

const STORAGE_KEY = "aura_saved_accounts_v1";

export async function loadSavedAccounts(): Promise<SavedAccount[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function persistSavedAccounts(accounts: SavedAccount[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

export async function upsertSavedAccount(account: SavedAccount): Promise<void> {
  const list = await loadSavedAccounts();
  const next = list.filter((a) => a.userId !== account.userId);
  next.unshift(account);
  await persistSavedAccounts(next.slice(0, 5));
}

export async function removeSavedAccount(userId: string): Promise<void> {
  const list = await loadSavedAccounts();
  await persistSavedAccounts(list.filter((a) => a.userId !== userId));
}
