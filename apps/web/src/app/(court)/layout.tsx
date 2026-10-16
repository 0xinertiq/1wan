import type { Metadata, Viewport } from "next";
import { APP_NAME } from "@/lib/brand";
import "./dashboard.css";

// Separate root layout so the v52 dashboard CSS never mixes with the rest of the app.
export const metadata: Metadata = { title: APP_NAME };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function CourtLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Atkinson+Hyperlegible:wght@400;700&family=Silkscreen:wght@400;700&family=Ma+Shan+Zheng&family=Noto+Serif+SC:wght@600;700&family=Quicksand:wght@500;600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
