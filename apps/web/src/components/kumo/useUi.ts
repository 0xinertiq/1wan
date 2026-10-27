"use client";

import { useEffect, useState } from "react";

// Which design is on: "new" (default) or "classic". Follows the data-ui attribute the Settings switch sets.
export function useUi(): "new" | "classic" {
  const [ui, setUi] = useState<"new" | "classic">("new");
  useEffect(() => {
    const el = document.documentElement;
    const read = () => setUi(el.getAttribute("data-ui") === "classic" ? "classic" : "new");
    read();
    const mo = new MutationObserver(read);
    mo.observe(el, { attributes: true, attributeFilter: ["data-ui"] });
    return () => mo.disconnect();
  }, []);
  return ui;
}
