# Sources tested (step 15)

Every source is checked with a real fetch before it is used. Unverified sources are not shipped.

| Source | URL | Works | Latency | Update rate | Licence note |
|---|---|---|---|---|---|
| Telegram public preview (lane A) | https://t.me/s/<handle> | yes (tested @durov, 20 posts, 2026-10-27) | about 1 to 4 s | as posted; app caches 5 min | public web preview; excerpt and link only |
| Crypto.com Exchange candles | https://api.crypto.com/exchange/v1/public/get-candlestick | yes (daily ATR, step 4) | under 1 s | per candle | public market data |
| Crypto.com Exchange candles 1h, 4h, 1D | same endpoint, timeframe=1h/4h/1D, count=300 | yes (300 candles each, 2026-10-27) | about 0.2 s | per candle; app caches 5 / 15 / 60 min | public market data; unknown coins return no candles |
| Fed speeches | federalreserve.gov/feeds/speeches.xml | yes (2026-10-27) | 60 ms | as published | headline, source, link, time only |
| BLS latest releases | bls.gov/feed/bls_latest.rss | yes (1 item feed) (2026-10-27) | 160 ms | per release | headline, source, link, time only |
| Bank of Japan | boj.or.jp/en/rss/whatsnew.xml | yes (2026-10-27) | 210 ms | daily | headline, source, link, time only |
| BBC World | feeds.bbci.co.uk/news/world/rss.xml | yes (2026-10-27) | 60 ms | minutes | headline, source, link, time only |
| Guardian Business | theguardian.com/uk/business/rss | yes (2026-10-27) | 600 ms | minutes | headline, source, link, time only |
| MarketWatch | feeds.content.dowjones.io/public/rss/mw_topstories | yes (2026-10-27) | 780 ms | hours | headline, source, link, time only |
| Al Jazeera | aljazeera.com/xml/rss/all.xml | yes (2026-10-27) | 40 ms | minutes | headline, source, link, time only |
| DW Business | rss.dw.com/rdf/rss-en-bus | yes (2026-10-27) | 210 ms | minutes | headline, source, link, time only |
| Nikkei Asia | asia.nikkei.com/rss/feed/nar | yes (no item dates) (2026-10-27) | 560 ms | hours | headline, source, link, time only |
| Straits Times Business | straitstimes.com/news/business/rss.xml | yes (2026-10-27) | 60 ms | minutes | headline, source, link, time only |
| SCMP Business | scmp.com/rss/92/feed | yes (2026-10-27) | 240 ms | hours | headline, source, link, time only |
| Yonhap English | en.yna.co.kr/RSS/news.xml | yes (2026-10-27) | 640 ms | minutes | headline, source, link, time only |
| r/CryptoCurrency top | reddit.com/r/CryptoCurrency/top/.rss?t=day | yes (Reddit may rate-limit servers) (2026-10-27) | 1.6 s | daily top | headline, source, link, time only |
| BEA news | apps.bea.gov/rss/rss.xml | works but newest item about 3 weeks old: not added (2026-10-27) | 750 ms | slow | headline, source, link, time only |
| BIS press | bis.org/doclist/all_pressrels.rss | works but 4 s and 11 days old: not added (2026-10-27) | 4 s | slow | headline, source, link, time only |
| US Treasury | home.treasury.gov (OFAC feed) | no (403) (2026-10-27) |  |  | headline, source, link, time only |
| IMF news | imf.org/en/News/RSS | no (403) (2026-10-27) |  |  | headline, source, link, time only |
| MAS media releases | mas.gov.sg/rss/media-releases | no (404) (2026-10-27) |  |  | headline, source, link, time only |
| Coinbase blog | coinbase.com/blog/rss.xml | no (403) (2026-10-27) |  |  | headline, source, link, time only |
| r/Bitcoin top | reddit.com/r/Bitcoin/top/.rss | no (429 rate limited) (2026-10-27) |  |  | headline, source, link, time only |
| GDELT DOC 2.0 | api.gdeltproject.org/api/v2/doc/doc | no (timed out at 12 s) (2026-10-27) |  |  | headline, source, link, time only |
| Hacker News API | hacker-news.firebaseio.com/v0/topstories.json | works; off her lens: not added (2026-10-27) | 500 ms |  | headline, source, link, time only |
| Economic calendar (unofficial) | nfs.faireconomy.media/ff_calendar_thisweek.json | yes, 97 events this week with forecast and previous; unofficial (2026-10-27) | 3.3 s | weekly file | headline, source, link, time only |
| FOMC 2026 dates | federalreserve.gov/monetarypolicy/fomccalendars.htm | yes, all 8 meetings read; stored in config (2026-10-27) | 170 ms | yearly | headline, source, link, time only |
| OKX funding, open interest, ticker | okx.com/api/v5/public/funding-rate, open-interest, market/ticker | yes from her PC (2026-10-27) | 150 ms | live | headline, source, link, time only |
| Bybit linear tickers | api.bybit.com/v5/market/tickers?category=linear | yes from her PC (blocks some server regions) (2026-10-27) |  |  | headline, source, link, time only |
| Binance futures premium index | fapi.binance.com/fapi/v1/premiumIndex | yes from her PC (blocks US servers) (2026-10-27) |  |  | headline, source, link, time only |
