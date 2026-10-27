# Scheduled task prompts
Export each cloud task's prompt into its own file here (name = task).

All four are routines and post to `/api/ingest/brief` with the `INGEST_SECRET` environment variable of
the Default environment (see `INGEST.md`). The secret never goes in a prompt or in this folder.

| Task | Type | Runs | Sends `kind` |
|---|---|---|---|
| daily-crypto-watchlist-scan | routine | 03:50 SGT daily | `scan` |
| midday-crypto-movers | routine | 14:30 SGT | `movers` |
| daily-intel-brief | routine | 07:42 SGT daily. One brief, identical every day; replaces the Intelligence Brief and both Pulse briefs. | `intel` |
| chief-kumo-weekly-review | routine | Sun 08:50 SGT. Reviews Intel and Scan only. | `review` |

Scan rule: minimum stop 1 ATR, only setups with R:R of at least 1:2.

The six old triggers (Daily Crypto Watchlist Scan, Midday Crypto Movers Alert, Daily Intelligence Brief,
Pulse Morning Brief, Pulse Weekend, Chief Kumo weekly review) are disabled. Their trigger ids are no
longer used.
