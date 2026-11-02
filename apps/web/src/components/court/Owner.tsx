"use client";

import { createContext, useContext } from "react";

// Whether the signed-in account is the owner (decided on the server, lib/owner.ts). Friends never render or fetch
// her trading areas (prices, releases, technicals, Trades) or her briefs. Defaults to true so the render tests and
// the browser harness keep showing the full Court.
const OwnerCtx = createContext(true);
export const OwnerProvider = OwnerCtx.Provider;
export const useOwner = () => useContext(OwnerCtx);
