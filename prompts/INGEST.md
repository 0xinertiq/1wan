# Sending a brief to 1(WAN)

How a scheduled task posts its brief to the new dashboard. Do not point any task here until the
throwaway test at the bottom has passed (build order step 6).

## Address

```
POST https://<your-vercel-address>/api/ingest/brief
```

Add `?dryRun=1` to check a request without saving anything.

## Headers

```
Authorization: Bearer <INGEST_SECRET>
Content-Type: application/json
```

`INGEST_SECRET` is the long random value in Vercel (and `apps/web/.env.local`). Keep it in the task's
secret settings, never inside the prompt text itself.

## Body (exact JSON)

```json
{
  "kind": "scan",
  "title": "Daily Crypto Watchlist Scan, Fri 16 Oct",
  "body": "Markdown text of the brief.",
  "meta": { "sources": "Bigdata unavailable, used web search and RSS" },
  "at": "2026-10-16T03:50:00+08:00"
}
```

| Field | Required | Rules |
|---|---|---|
| `kind` | yes | One of the names below. |
| `title` | yes | Text, 1 to 200 characters. |
| `body` | yes | Markdown text, 1 to 100,000 characters. |
| `meta` | no | Object, up to 4,000 characters as JSON. `meta.sources` is text or a list of text; it shows as the "Sources:" line under the brief. |
| `at` | no | ISO time within 2 days of now. Left out means "now". |

Any other field is refused. Briefs are written once as shared briefs (no user id).

### Kind names

| Task | Send `kind` |
|---|---|
| daily-crypto-watchlist-scan, 03:50 SGT daily | `scan` |
| midday-crypto-movers, 14:30 SGT | `movers` |
| daily-intel-brief, 07:42 SGT daily | `intel` |
| chief-kumo-weekly-review, Sun 08:50 SGT | `review` |

All four post with the `INGEST_SECRET` environment variable of the Default environment.

Scan rule: minimum stop 1 ATR, only setups with R:R of at least 1:2.

The daily intel brief replaced both Pulse briefs. `pulse` is still accepted so old briefs keep showing.

The full list of accepted names lives in `apps/web/src/lib/briefKinds.ts`.

### Coins for the price list

The dashboard shows live prices for the coins named in the newest `scan` brief (for example `BTC`,
`NEAR`, `ONDO`, or `NEARUSDT`). Keep tickers in capitals in the scan body.

## Answers

| Status | Meaning |
|---|---|
| 200 `{"ok":true,"id":"...","kind":"scan","at":"..."}` | Saved. |
| 200 `{"ok":true,"dryRun":true,"would_write":{...}}` | Valid, nothing saved. |
| 400 | Something in the body is wrong; `error` says what. |
| 401 | Missing or wrong secret. |
| 413 | Body over 200 KB. |
| 429 | More than 20 requests in 10 minutes. Wait and retry once. |
| 503 | The server has no `INGEST_SECRET` yet. |

## Line to add to each task prompt (later, after the test)

> When the brief is final, send it with an HTTP POST to `https://<your-vercel-address>/api/ingest/brief`,
> header `Authorization: Bearer` plus the INGEST_SECRET from this task's secrets, JSON body
> `{"kind": "<kind from the table>", "title": "...", "body": "...", "meta": {"sources": "<which sources you used, and any that were unavailable>"}}`.
> If the answer is not `"ok": true`, say so at the top of the brief.

## Throwaway test (do this first)

In PowerShell on your computer, replace the two placeholders, then run:

```powershell
$secret = "<INGEST_SECRET>"
$body = '{"kind":"scan","title":"Throwaway test","body":"Test only. Safe to ignore.","meta":{"sources":"manual test"}}'
Invoke-RestMethod -Method Post -Uri "https://<your-vercel-address>/api/ingest/brief?dryRun=1" -Headers @{ Authorization = "Bearer $secret" } -ContentType "application/json" -Body $body
```

You should see `ok : True` and `dryRun : True`. Nothing is saved by a dry run.
