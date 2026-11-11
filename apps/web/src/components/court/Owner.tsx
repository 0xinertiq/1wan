"use client";

import { createContext, useContext } from "react";

// Whether the signed-in account is the owner (decided on the server, lib/owner.ts). Friends never render or fetch
// her trading areas (prices, releases, technicals, Trades) or her briefs. Defaults to true so the render tests and
// the browser harness keep showing the full Court.
const OwnerCtx = createContext(true);
// A real component, not OwnerCtx.Provider itself: the dashboard page is a server component, and a bare context passed
// across the server/browser boundary cannot be rendered (React error 306, "resolves to: Context"; fixed 11 Nov).
export function OwnerProvider({ value, children }: { value: boolean; children: React.ReactNode }) {
  return <OwnerCtx.Provider value={value}>{children}</OwnerCtx.Provider>;
}
export const useOwner = () => useContext(OwnerCtx);
