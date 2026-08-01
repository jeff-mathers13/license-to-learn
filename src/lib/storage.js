// Single point of contact for persistence. The rest of the app only ever calls
// storageAdapter.get/set and never touches a specific backend directly.
export const STORAGE_KEY = "ppl-tracker-state-sectional-v1";

// Thrown by storageAdapter.set when the remote backend rejects a write because the
// signed-in session has expired (401). Distinguished from other failures so the
// caller's retry loop can short-circuit instead of burning attempts on something
// no amount of retrying will fix.
export class AuthExpiredError extends Error {
  constructor() {
    super("Signed-in session expired");
    this.name = "AuthExpiredError";
  }
}

const localAdapter = (() => {
  const hasClaudeStorage = typeof window !== "undefined" && !!window.storage;
  const hasLocalStorage = (() => {
    try {
      if (typeof window === "undefined" || !window.localStorage) return false;
      const probe = "__ltl_probe__";
      window.localStorage.setItem(probe, "1");
      window.localStorage.removeItem(probe);
      return true;
    } catch {
      return false; // e.g. private browsing modes that block site storage
    }
  })();

  if (hasClaudeStorage) {
    return {
      backend: "claude",
      available: true,
      // Resolves to the stored string, or null if nothing is stored yet.
      async get(key) {
        try {
          const result = await window.storage.get(key);
          return result?.value ?? null;
        } catch (e) {
          // Claude storage throws for keys that don't exist yet — expected on first run.
          console.log("No existing saved state found (expected on first run):", e?.message || e);
          return null;
        }
      },
      // Resolves to true on success, false on a failed write (caller handles retries).
      async set(key, value) {
        const result = await window.storage.set(key, value);
        return !!result;
      },
    };
  }

  if (hasLocalStorage) {
    return {
      backend: "local",
      available: true,
      async get(key) {
        return window.localStorage.getItem(key);
      },
      async set(key, value) {
        window.localStorage.setItem(key, value); // throws on quota errors; caller's retry/catch handles it
        return true;
      },
    };
  }

  return {
    backend: "none",
    available: false,
    async get() {
      return null;
    },
    async set() {
      return false;
    },
  };
})();

// Set once a signed-in user is confirmed (see configureRemoteUser/clearRemoteUser below).
// Only the presence/absence of a remote user toggles which backend get/set use — nothing
// else in the app needs to know a remote backend exists at all.
let remoteUserId = null;

export function configureRemoteUser(userId) {
  remoteUserId = userId;
}

export function clearRemoteUser() {
  remoteUserId = null;
}

async function remoteGet(key) {
  try {
    const res = await fetch("/api/progress", { credentials: "include" });
    if (res.status === 204) return null; // no data saved for this account yet — expected on first sign-in
    if (!res.ok) throw new Error(`GET /api/progress failed: ${res.status}`);
    const text = await res.text();
    // Read-path mirroring only: keep a local "last known good" cache for offline/error
    // fallback. Never mirrored on the write path — see remoteSet.
    try {
      window.localStorage.setItem(key, text);
    } catch {
      // best-effort cache; ignore quota/availability errors here
    }
    return text;
  } catch (e) {
    console.error("Remote storage read failed, falling back to local cache:", e?.message || e);
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
}

async function remoteSet(value) {
  const res = await fetch("/api/progress", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: value,
  });
  if (res.status === 401) throw new AuthExpiredError();
  return res.ok;
}

export const storageAdapter = {
  get backend() {
    return remoteUserId ? "remote" : localAdapter.backend;
  },
  get available() {
    return remoteUserId ? true : localAdapter.available;
  },
  async get(key) {
    if (remoteUserId) return remoteGet(key);
    return localAdapter.get(key);
  },
  async set(key, value) {
    if (remoteUserId) return remoteSet(value);
    return localAdapter.set(key, value);
  },
};
