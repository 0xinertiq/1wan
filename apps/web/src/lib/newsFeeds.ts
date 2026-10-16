// Free RSS feeds for the Headlines window (Pip). Each one answered with valid RSS on 16 Oct 2026.
// Headline, source, time and link only: no article text, nothing behind a paywall.
// This list is the baseline that works even when Bigdata credits run out.

export type NewsGroup = "Crypto" | "Macro" | "Markets" | "World" | "Local";
export type Feed = { id: string; name: string; group: NewsGroup; url: string };

export const NEWS_FEEDS: Feed[] = [
  { id: "coindesk", name: "CoinDesk", group: "Crypto", url: "https://www.coindesk.com/arc/outboundfeeds/rss/" },
  { id: "cointelegraph", name: "Cointelegraph", group: "Crypto", url: "https://cointelegraph.com/rss" },
  { id: "decrypt", name: "Decrypt", group: "Crypto", url: "https://decrypt.co/feed" },
  { id: "theblock", name: "The Block", group: "Crypto", url: "https://www.theblock.co/rss.xml" },
  { id: "btcmag", name: "Bitcoin Magazine", group: "Crypto", url: "https://bitcoinmagazine.com/.rss/full/" },
  { id: "fed", name: "Federal Reserve", group: "Macro", url: "https://www.federalreserve.gov/feeds/press_all.xml" },
  { id: "ecb", name: "ECB", group: "Macro", url: "https://www.ecb.europa.eu/rss/press.html" },
  { id: "sec", name: "SEC", group: "Markets", url: "https://www.sec.gov/news/pressreleases.rss" },
  { id: "cnbc", name: "CNBC Markets", group: "Markets", url: "https://www.cnbc.com/id/10000664/device/rss/rss.html" },
  { id: "cna-biz", name: "CNA Business", group: "Markets", url: "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6936" },
  { id: "bbc-biz", name: "BBC Business", group: "World", url: "https://feeds.bbci.co.uk/news/business/rss.xml" },
  { id: "cna-sg", name: "CNA Singapore", group: "Local", url: "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=10416" },
  { id: "bt-sg", name: "The Business Times", group: "Local", url: "https://www.businesstimes.com.sg/rss/top-stories" },
];

export const NEWS_GROUPS: NewsGroup[] = ["Macro", "Markets", "Crypto", "World", "Local"];
