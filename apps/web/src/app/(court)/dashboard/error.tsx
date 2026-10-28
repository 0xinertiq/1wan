"use client";

import { resetDevice } from "@/lib/court/store";

// Page-level safety net for the dashboard: a clear message instead of a blank "Application error" screen, a way to
// try again, and a way to clear this app's saved settings on this device (look, theme, folds, seen items, pauses).
// Server data (her state, briefs, journal) is never touched.
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="kcrash" role="alert">
      <h1>Something went wrong loading your Court</h1>
      <p>Your data is safe. Try again, and if it keeps happening, reset the saved settings on this device.</p>
      <div className="kcrash-act">
        <button className="btn" type="button" onClick={() => reset()}>Try again</button>
        <button className="btn ghost" type="button" onClick={() => { resetDevice(); location.reload(); }}>Reset saved settings on this device</button>
      </div>
      <p className="note">Only this browser&apos;s settings for 1(WAN) are cleared; nothing on the server changes.{error?.digest ? ` Reference: ${error.digest}` : ""}</p>
    </main>
  );
}
