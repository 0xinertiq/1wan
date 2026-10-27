// Free RSS feeds for the Headlines window (Pip). Each one answered with valid RSS on 16 Oct 2026.
// Headline, source, time and link only: no article text, nothing behind a paywall.
// This list is the baseline that works even when Bigdata credits run out.

export type NewsGroup = "Crypto" | "Macro" | "Markets" | "World" | "Local";
export type Region = "Global" | "US" | "Asia" | "Singapore" | "Crypto";
export const REGIONS: Region[] = ["Global", "US", "Asia", "Singapore", "Crypto"];
// tier feeds the cluster score: primary (central banks, regulators, statistics) > wire > media > social.
export type Tier = "primary" | "wire" | "media" | "social";
export type Feed = { id: string; name: string; group: NewsGroup; url: string; region?: Region; tier?: Tier };

export const NEWS_FEEDS: Feed[] = [
  { region: "Crypto", tier: "media", id: "coindesk", name: "CoinDesk", group: "Crypto", url: "https://www.coindesk.com/arc/outboundfeeds/rss/" },
  { region: "Crypto", tier: "media", id: "cointelegraph", name: "Cointelegraph", group: "Crypto", url: "https://cointelegraph.com/rss" },
  { region: "Crypto", tier: "media", id: "decrypt", name: "Decrypt", group: "Crypto", url: "https://decrypt.co/feed" },
  { region: "Crypto", tier: "media", id: "theblock", name: "The Block", group: "Crypto", url: "https://www.theblock.co/rss.xml" },
  { region: "Crypto", tier: "media", id: "btcmag", name: "Bitcoin Magazine", group: "Crypto", url: "https://bitcoinmagazine.com/.rss/full/" },
  { region: "US", tier: "primary", id: "fed", name: "Federal Reserve", group: "Macro", url: "https://www.federalreserve.gov/feeds/press_all.xml" },
  { region: "Global", tier: "primary", id: "ecb", name: "ECB", group: "Macro", url: "https://www.ecb.europa.eu/rss/press.html" },
  { region: "US", tier: "primary", id: "sec", name: "SEC", group: "Markets", url: "https://www.sec.gov/news/pressreleases.rss" },
  { region: "US", tier: "wire", id: "cnbc", name: "CNBC Markets", group: "Markets", url: "https://www.cnbc.com/id/10000664/device/rss/rss.html" },
  { region: "Asia", tier: "wire", id: "cna-biz", name: "CNA Business", group: "Markets", url: "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6936" },
  { region: "Global", tier: "wire", id: "bbc-biz", name: "BBC Business", group: "World", url: "https://feeds.bbci.co.uk/news/business/rss.xml" },
  { region: "Singapore", tier: "wire", id: "cna-sg", name: "CNA Singapore", group: "Local", url: "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=10416" },
  { region: "Singapore", tier: "wire", id: "bt-sg", name: "The Business Times", group: "Local", url: "https://www.businesstimes.com.sg/rss/top-stories" },
  // Added 27 Oct 2026 after live tests (docs/SOURCES.md).
  { region: "US", tier: "primary", id: "fed-speech", name: "Fed speeches", group: "Macro", url: "https://www.federalreserve.gov/feeds/speeches.xml" },
  { region: "US", tier: "primary", id: "bls", name: "BLS releases", group: "Macro", url: "https://www.bls.gov/feed/bls_latest.rss" },
  { region: "Asia", tier: "primary", id: "boj", name: "Bank of Japan", group: "Macro", url: "https://www.boj.or.jp/en/rss/whatsnew.xml" },
  { region: "Global", tier: "wire", id: "bbc-world", name: "BBC World", group: "World", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { region: "Global", tier: "wire", id: "guardian-biz", name: "Guardian Business", group: "Markets", url: "https://www.theguardian.com/uk/business/rss" },
  { region: "US", tier: "wire", id: "marketwatch", name: "MarketWatch", group: "Markets", url: "https://feeds.content.dowjones.io/public/rss/mw_topstories" },
  { region: "Global", tier: "wire", id: "aljazeera", name: "Al Jazeera", group: "World", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { region: "Global", tier: "wire", id: "dw-biz", name: "DW Business", group: "Markets", url: "https://rss.dw.com/rdf/rss-en-bus" },
  { region: "Asia", tier: "wire", id: "nikkei", name: "Nikkei Asia", group: "Markets", url: "https://asia.nikkei.com/rss/feed/nar" },
  { region: "Singapore", tier: "wire", id: "st-biz", name: "Straits Times Business", group: "Local", url: "https://www.straitstimes.com/news/business/rss.xml" },
  { region: "Asia", tier: "wire", id: "scmp-biz", name: "SCMP Business", group: "Markets", url: "https://www.scmp.com/rss/92/feed" },
  { region: "Asia", tier: "wire", id: "yonhap", name: "Yonhap English", group: "World", url: "https://en.yna.co.kr/RSS/news.xml" },
  { region: "Crypto", tier: "social", id: "reddit-cc", name: "r/CryptoCurrency top", group: "Crypto", url: "https://www.reddit.com/r/CryptoCurrency/top/.rss?t=day" },
];

export const NEWS_GROUPS: NewsGroup[] = ["Macro", "Markets", "Crypto", "World", "Local"];
