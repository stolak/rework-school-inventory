export const USER_MENUS_STORAGE_KEY = "userMenus";

export type UserMenuItem = {
  id: string;
  route: string;
  caption: string;
  status: string;
};

export type StoredUserMenus = {
  menus: UserMenuItem[];
};

export function saveUserMenus(menus: UserMenuItem[]): void {
  localStorage.setItem(USER_MENUS_STORAGE_KEY, JSON.stringify({ menus }));
}

export function clearUserMenus(): void {
  localStorage.removeItem(USER_MENUS_STORAGE_KEY);
}

export function getStoredUserMenus(): StoredUserMenus | null {
  const raw = localStorage.getItem(USER_MENUS_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredUserMenus;
    if (!Array.isArray(parsed?.menus)) return null;
    return parsed;
  } catch {
    return null;
  }
}
