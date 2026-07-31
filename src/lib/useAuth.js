import { useState, useEffect } from "react";
import { fetchCurrentUser } from "./auth";

// Fetches the current SWA-authenticated user once on mount. Resolves to `user: null`
// (not an error state) in any environment without the SWA auth runtime behind it —
// local `vite dev`, or anywhere this hasn't been deployed to Azure yet. `checked`
// distinguishes "still checking" from "confirmed signed out", useful if a caller wants
// to avoid a flash of "Sign in" before the check completes.
export function useAuth() {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchCurrentUser().then((u) => {
      if (!cancelled) {
        setUser(u);
        setChecked(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { user, checked };
}
