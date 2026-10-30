"use client";

import { useUi } from "./useUi";

// Renders its children only in the New look (or only in Classic with classic), so a widget that moved to a
// New-look tab is never mounted twice.
export function NewOnly({ children, classic }: { children?: React.ReactNode; classic?: React.ReactNode }) {
  return <>{useUi() === "new" ? children : classic ?? null}</>;
}
