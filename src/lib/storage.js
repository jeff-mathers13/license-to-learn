// Single point of contact for persistence. The rest of the app only ever calls
// storageAdapter.get/set and never touches a specific backend directly.
export const STORAGE_KEY = "ppl-tracker-state-sectional-v1";

export const storageAdapter = (() => {
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
})()
