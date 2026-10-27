import type { Metadata, Viewport } from "next";
import { APP_NAME } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = { title: APP_NAME, icons: { icon: [{ url: "/icons/icon-192.png", sizes: "192x192" }, { url: "/icons/icon.svg", type: "image/svg+xml" }], apple: "/icons/apple-touch-icon.png" }, appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "default" } };

export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#FFA3C8" }, { media: "(prefers-color-scheme: dark)", color: "#1C1630" }] };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
