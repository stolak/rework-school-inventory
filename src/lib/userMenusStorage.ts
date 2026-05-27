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

export const USER_MENUS_UPDATED_EVENT = "user-menus-updated";

function normalizePath(path: string): string {
  if (!path?.trim()) return "/";
  const withLeading = path.startsWith("/") ? path : `/${path}`;
  return withLeading.replace(/\/+$/, "") || "/";
}

/** True when a stored menu route maps to a sidebar item URL (exact or nested path). */
export function menuRouteMatchesSidebarUrl(
  menuRoute: string,
  sidebarUrl: string,
): boolean {
  const route = normalizePath(menuRoute);
  const url = normalizePath(sidebarUrl);
  if (url === "/") return route === "/";
  return route === url || route.startsWith(`${url}/`);
}

export function isSidebarUrlAllowed(
  sidebarUrl: string,
  menus: UserMenuItem[],
): boolean {
  return menus.some((menu) => {
    const status = menu.status?.toLowerCase();
    if (status && status !== "active") return false;
    return menuRouteMatchesSidebarUrl(menu.route, sidebarUrl);
  });
}

export function saveUserMenus(menus: UserMenuItem[]): void {
  localStorage.setItem(USER_MENUS_STORAGE_KEY, JSON.stringify({ menus }));
  window.dispatchEvent(new Event(USER_MENUS_UPDATED_EVENT));
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
