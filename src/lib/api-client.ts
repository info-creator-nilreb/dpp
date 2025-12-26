/**
 * GLOBAL API CLIENT WITH 401 HANDLING
 * 
 * Intercepts all API calls and handles 401 responses globally.
 * Prevents infinite retry loops.
 */

let isHandling401 = false;
let logoutInProgress = false;

/**
 * Global fetch wrapper with 401 handling
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    credentials: "include", // Always include cookies
  });

  // Handle 401 Unauthorized globally
  if (response.status === 401 && !isHandling401) {
    isHandling401 = true;

    try {
      // Clear client auth state immediately
      clearAuthState();

      // Call logout endpoint (best effort - don't wait for it)
      handleLogout().catch((error) => {
        console.error("Logout on 401 failed:", error);
      });

      // Redirect to login (with small delay to prevent race conditions)
      setTimeout(() => {
        const currentPath = window.location.pathname;
        const isSuperAdmin = currentPath.startsWith("/super-admin");
        const loginPath = isSuperAdmin ? "/super-admin/login" : "/login";
        window.location.href = loginPath;
      }, 100);
    } finally {
      // Reset flag after a delay to allow redirect
      setTimeout(() => {
        isHandling401 = false;
      }, 1000);
    }
  }

  return response;
}

/**
 * Clear all client-side auth state
 */
function clearAuthState(): void {
  // Clear any localStorage/sessionStorage auth data
  try {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    sessionStorage.clear();
  } catch (error) {
    // Ignore errors (might be in SSR context)
  }
}

/**
 * Handle logout (best effort)
 */
async function handleLogout(): Promise<void> {
  if (logoutInProgress) {
    return; // Prevent multiple simultaneous logout calls
  }

  logoutInProgress = true;

  try {
    const currentPath = window.location.pathname;
    const isSuperAdmin = currentPath.startsWith("/super-admin");
    const logoutPath = isSuperAdmin
      ? "/api/super-admin/auth/logout"
      : "/api/auth/signout";

    // Call logout endpoint (don't wait for response)
    fetch(logoutPath, {
      method: "POST",
      credentials: "include",
    }).catch((error) => {
      console.error("Logout API call failed:", error);
    });
  } finally {
    setTimeout(() => {
      logoutInProgress = false;
    }, 2000);
  }
}

/**
 * Safe redirect helper (prevents multiple redirects)
 */
let redirectInProgress = false;

export function safeRedirect(path: string): void {
  if (redirectInProgress) {
    return;
  }

  redirectInProgress = true;
  window.location.href = path;
}

