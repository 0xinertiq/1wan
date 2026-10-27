import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, Baloo_2, Ma_Shan_Zheng, Noto_Serif_SC, Quicksand, Silkscreen } from "next/font/google";
import { APP_NAME } from "@/lib/brand";
import "./tokens.css";
import "./dashboard.css";

// Separate root layout so the v52 dashboard CSS never mixes with the rest of the app.
export const metadata: Metadata = { title: APP_NAME, icons: { icon: [{ url: "/icons/icon-192.png", sizes: "192x192" }, { url: "/icons/icon.svg", type: "image/svg+xml" }], apple: "/icons/apple-touch-icon.png" }, appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "default" } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: [{ media: "(prefers-color-scheme: light)", color: "#FFA3C8" }, { media: "(prefers-color-scheme: dark)", color: "#1C1630" }] };

// Self-hosted by next/font: the same families and weights the Google Fonts link used. Each is a CSS
// variable (--nf-*) that dashboard.css and tokens.css use in place of the font names. The two Chinese
// fonts keep every character slice and are not preloaded (they are large and only used for the seals).
const baloo = Baloo_2({ subsets: ["latin"], weight: ["500", "600", "700", "800"], display: "swap", variable: "--nf-baloo" });
const atkinson = Atkinson_Hyperlegible({ subsets: ["latin"], weight: ["400", "700"], display: "swap", variable: "--nf-atkinson" });
const silkscreen = Silkscreen({ subsets: ["latin"], weight: ["400", "700"], display: "swap", variable: "--nf-silkscreen" });
const quicksand = Quicksand({ subsets: ["latin"], weight: ["500", "600"], display: "swap", variable: "--nf-quicksand" });
const maShan = Ma_Shan_Zheng({ weight: "400", display: "swap", preload: false, variable: "--nf-mashan" });
const notoSerif = Noto_Serif_SC({ weight: ["600", "700"], display: "swap", preload: false, variable: "--nf-noto" });
const FONT_VARS = [baloo, atkinson, silkscreen, quicksand, maShan, notoSerif].map((f) => f.variable).join(" ");

// Before paint: day or night (her saved choice wins, otherwise the system setting), and the design
// version, "classic" by default. "?ui=new" or "?ui=classic" in the address switches and remembers it.
const BOOT =
  "try{var d=document.documentElement,t=localStorage.getItem('kumo.theme');if(t==='dark'||t==='light')d.setAttribute('data-theme',t);" +
  "var q=new URLSearchParams(location.search).get('ui');if(q==='new'||q==='classic')localStorage.setItem('kumo.ui',q);" +
  "d.setAttribute('data-ui',localStorage.getItem('kumo.ui')==='new'?'new':'classic');}catch(e){}";

export default function CourtLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={FONT_VARS} data-ui="classic" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
