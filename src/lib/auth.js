// Talks to Azure Static Web Apps' built-in authentication endpoints (/.auth/*). These
// only exist once the app is actually running under the SWA runtime — either deployed
// to Azure, or locally via the Static Web Apps CLI emulator (`swa start`). Under plain
// `vite dev`, or anywhere else this hasn't been deployed, /.auth/me simply won't resolve
// the way SWA expects — every function here degrades to "signed out" rather than throwing,
// the same graceful-fallback approach used by the storage adapter.
//
// This is identity only for right now. Nothing here is wired to progress/data sync —
// see the README's "What's NOT done yet" section. Login lets you show who's using the
// app; it doesn't yet change where their data lives.

export async function fetchCurrentUser() {
  try {
    const res = await fetch("/.auth/me");
    if (!res.ok) return null;
    const data = await res.json();
    const principal = data?.clientPrincipal;
    if (!principal) return null;
    return {
      userId: principal.userId,
      username: principal.userDetails,
      provider: principal.identityProvider,
      roles: principal.userRoles || [],
    };
  } catch {
    // Most common case during local development: /.auth/me doesn't exist outside
    // the SWA runtime, so fetch() either 404s or the response isn't valid JSON.
    return null;
  }
}

// Identity providers pre-registered by SWA on every tier, including Free — no custom
// app registration needed for these. Custom providers are a Standard-tier feature.
export const AUTH_PROVIDERS = [
  { id: "github", label: "GitHub" },
  { id: "google", label: "Google" },
  { id: "twitter", label: "Twitter / X" },
  { id: "aad", label: "Microsoft" },
];

export function loginUrl(provider = "github", redirectTo = "/") {
  return `/.auth/login/${provider}?post_login_redirect_uri=${encodeURIComponent(redirectTo)}`;
}

export function logoutUrl(redirectTo = "/") {
  return `/.auth/logout?post_logout_redirect_uri=${encodeURIComponent(redirectTo)}`;
}
