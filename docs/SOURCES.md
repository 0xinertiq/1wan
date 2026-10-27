# Sources tested (step 15)

Every source is checked with a real fetch before it is used. Unverified sources are not shipped.

| Source | URL | Works | Latency | Update rate | Licence note |
|---|---|---|---|---|---|
| Telegram public preview (lane A) | https://t.me/s/<handle> | yes (tested @durov, 20 posts, 2026-10-27) | about 1 to 4 s | as posted; app caches 5 min | public web preview; excerpt and link only |
| Crypto.com Exchange candles | https://api.crypto.com/exchange/v1/public/get-candlestick | yes (daily ATR, step 4) | under 1 s | per candle | public market data |
