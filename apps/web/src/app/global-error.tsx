"use client";

import { resetDevice } from "@/lib/court/store";

// Last-resort safety net (an error outside the dashboard page itself): a clear message, Try again, and a reset of
// this app's saved settings on this device only. Server data is never touched.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: "48px 16px", fontFamily: "system-ui, sans-serif", background: "#FFE8F1", color: "#5A2745" }}>
        <main role="alert" style={{ maxWidth: 560, margin: "0 auto" }}>
          <h1 style={{ fontSize: 24 }}>Something went wrong loading 1(WAN)</h1>
          <p>Your data is safe. Try again, and if it keeps happening, reset the saved settings on this device.</p>
          <p>
            <button type="button" onClick={() => reset()} style={{ minHeight: 44, marginRight: 8 }}>Try again</button>
            <button type="button" onClick={() => { resetDevice(); location.reload(); }} style={{ minHeight: 44 }}>Reset saved settings on this device</button>
          </p>
        </main>
      </body>
    </html>
  );
}
