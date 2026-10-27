import type { MetadataRoute } from "next";
import { APP_NAME } from "@/lib/brand";

// PWA basics: name, icons drawn from Kumo's pixel sprite (scripts/make-icons.mjs), theme colour.
// Deliberately no service worker: nothing private is cached on the device.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: "Her own court: briefs, trades, money, garden and diary.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#FFF5F9",
    theme_color: "#FFA3C8",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
