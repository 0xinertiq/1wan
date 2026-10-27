// Fire-and-forget watering event for the garden (see /api/water). Never blocks the tick itself.
export function water(source: string, ref: string, on: boolean, weight = 1) {
  fetch("/api/water", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source, ref, on, weight }) }).catch(() => {});
}
