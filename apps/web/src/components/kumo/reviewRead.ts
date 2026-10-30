"use client";

import { useEffect, useState } from "react";

// Kumo's weekly review read state, kept on this device only (localStorage), so no saved state shape changes.
// The Court shows the review while it is unread; the News tab carries a dot until it is marked read.
// The Court records the latest review's time so the nav can show the dot without loading briefs itself.
const READ = "1wan-review-read", LATEST = "1wan-review-latest", EV = "1wan-review";

export function useReview(at?: string | null) {
  const [st, setSt] = useState<{ read: string | null; latest: string | null; ok: boolean }>({ read: null, latest: null, ok: false });
  useEffect(() => {
    const load = () => { try { setSt({ read: localStorage.getItem(READ), latest: localStorage.getItem(LATEST), ok: true }); } catch { setSt((s) => ({ ...s, ok: true })); } };
    if (at) { try { if (localStorage.getItem(LATEST) !== at) { localStorage.setItem(LATEST, at); window.dispatchEvent(new Event(EV)); } } catch {} }
    load();
    window.addEventListener(EV, load); window.addEventListener("storage", load);
    return () => { window.removeEventListener(EV, load); window.removeEventListener("storage", load); };
  }, [at]);
  const cur = at ?? st.latest;
  const markRead = (x: string) => { try { localStorage.setItem(READ, x); } catch {} window.dispatchEvent(new Event(EV)); };
  return { ready: st.ok, unread: st.ok && !!cur && st.read !== cur, markRead };
}
