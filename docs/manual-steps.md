# Manual steps for the Queen

Everything the build could not do for you, in order. One step at a time. Never paste any of these
values into chat: they go only into the file or the website named in each step.

## A. Add the `meta` column in Supabase (2 minutes, safe)

1. Open supabase.com and sign in. Click your 1wan project.
2. In the left bar, click **SQL Editor**.
3. Click **New query**.
4. In VS Code (or Notepad), open `supabase/migrations/0003_briefs_meta.sql` from the 1wan folder. Copy all of it.
5. Paste it into the Supabase query box. Click **Run**.
6. You should see "Success. No rows returned." It only adds one empty column; nothing is deleted.

## B. Get your 5 Google Calendar secret addresses

Do this once per calendar (up to 5).

7. Open calendar.google.com on your computer.
8. Click the gear icon (top right), then **Settings**.
9. In the left column under **Settings for my calendars**, click the first calendar.
10. Scroll down to **Integrate calendar**. Find **Secret address in iCal format**. Click the copy icon next to it.
    (If you do not see it, the calendar belongs to someone else; only its owner can share that address.)
11. Paste it straight into the file in step 13 before copying the next one.

## C. Put them in `apps/web/.env.local`

12. In VS Code, open `apps/web/.env.local` (it already has your Supabase lines; leave those alone).
13. Add these lines at the bottom, one pair per calendar. Paste each secret address after the `=`, and pick a short label:

    ```
    GCAL_ICAL_URL_1=
    GCAL_NAME_1=Personal
    GCAL_ICAL_URL_2=
    GCAL_NAME_2=Dogs
    GCAL_ICAL_URL_3=
    GCAL_NAME_3=Study
    GCAL_ICAL_URL_4=
    GCAL_NAME_4=Work
    GCAL_ICAL_URL_5=
    GCAL_NAME_5=Health
    ```

    Any you do not use can stay empty.
14. Save the file (Ctrl+S).

## D. Make your INGEST_SECRET

15. In VS Code, open a terminal: menu **Terminal**, then **New Terminal**.
16. Type this and press Enter. It prints a long random secret made by your own computer:

    ```
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    ```

17. Copy the 64-character line it printed.
18. In `apps/web/.env.local`, add one more line and paste after the `=`:

    ```
    INGEST_SECRET=
    ```

19. Save the file (Ctrl+S). Keep this terminal open for step 30.

## E. Add the same values in Vercel, then redeploy

20. Open vercel.com and sign in. Click your **1wan** project.
21. Click **Settings** (top bar), then **Environment Variables** (left).
22. Check that `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are already listed. If `SUPABASE_SERVICE_ROLE_KEY` is missing, add it now from your `.env.local` (the ingest step needs it).
23. For each new line you added in steps 13 and 18, click **Add New** (or **Add Environment Variable**):
    - **Key**: the name before `=` (for example `GCAL_ICAL_URL_1`).
    - **Value**: the part after `=`.
    - Tick **Sensitive** if offered (all the `GCAL_ICAL_URL_*` lines and `INGEST_SECRET`).
    - Environments: **Production** and **Preview**.
    - Click **Save**.
    That is up to 11 entries: `GCAL_ICAL_URL_1` to `_5`, `GCAL_NAME_1` to `_5`, `INGEST_SECRET`.
24. Click **Deployments** (top bar).
25. On the newest deployment, click the **⋯** menu on the right, then **Redeploy**, then **Redeploy** again to confirm.
26. Wait until it says **Ready** (about a minute).

## F. Check it

27. Open your Vercel address and go to `/dashboard`. Sign in if asked.
28. In **Today**, the "Momo, your day" card should say **Live from Google Calendar** and show a chip per calendar. If one chip says "not reachable", re-copy that calendar's address (step 10).
29. Tap the **⋯** menu in the header and try the moon/sun button (day or night).
30. Throwaway ingest test (nothing is saved): open `prompts/INGEST.md`, copy the PowerShell block under **Throwaway test**, replace `<INGEST_SECRET>` with your secret and `<your-vercel-address>` with your Vercel address, paste it into the terminal from step 15, press Enter. You should see `ok : True` and `dryRun : True`.

## G. Add the tracker tables and bring in your four trackers (5 minutes, safe)

1. Open supabase.com, click your 1wan project, then **SQL Editor** in the left bar, then **New query**.
2. In VS Code, open `supabase/migrations/0004_trackers.sql`. Copy all of it.
3. Paste it into the Supabase query box. Click **Run**. You should see "Success. No rows returned." It only adds new, private tables; nothing existing changes.
4. In the VS Code terminal (View > Terminal), paste this and press Enter, using the email you log in with:
   `python -I scripts/import_trackers.py --email YOUR-LOGIN-EMAIL`
   This is a dry run. It only prints counts (trades, gamble, keys to add). Nothing is written.
5. If the counts look right, press the Up arrow, add ` --apply` at the end, and press Enter. You should see "Done." Running it again later is safe; it skips what is already there.

## H. Add stops to plans (1 minute, safe; do it after G)

1. In Supabase, click **SQL Editor**, then **New query**.
2. In VS Code, open `supabase/migrations/0005_plan_stop.sql`. Copy all of it.
3. Paste it into the query box. Click **Run**. You should see "Success. No rows returned." It only adds two empty columns (stop, target) to plans.

## I. Your astro and new work calendars (5 minutes)

1. In Google Calendar, copy the **Secret address in iCal format** of your astro calendar, and of your new work calendar (steps 7 to 10 above).
2. In VS Code, open `apps/web/.env.local`. Find the pair that was your old work calendar (for example `GCAL_ICAL_URL_4` and `GCAL_NAME_4`). Paste the astro address after `GCAL_ICAL_URL_4=` and change the name line to `GCAL_NAME_4=astro`.
3. Use a free slot for the new work calendar, for example `GCAL_ICAL_URL_5=` (paste its address) and `GCAL_NAME_5=Work`. If all five are taken, tell Claude Code which one to drop.
4. Save (Ctrl+S). In Vercel, Settings, Environment Variables: update the same names with the same values (tick Sensitive for the addresses), then Deployments, ⋯, Redeploy.
The app finds the astro feed by its name "astro", so the slot number does not matter.

## J. Let the Sunday Kumo task read your weekly packet (optional, 5 minutes)

The "Copy for Claude" button already works without this. Do it only if you want the scheduled task to fetch the packet by itself.
1. Already done for you: `apps/web/.env.local` now has a `READ_SECRET=` line. Open the file and copy the long value after the `=`.
2. In Vercel, Settings, Environment Variables: add `READ_SECRET` with the same value, tick Sensitive, Production and Preview. Then Deployments, ⋯, Redeploy.
3. Tell Claude Code it is done; it will run one throwaway read before the Sunday task uses it.

## K. Today's Vercel variables, in one go (10 minutes)

Claude Code could not add these itself: the Vercel command line is not signed in on this computer. Do it in the website instead. Never paste the values into chat.

What to add (names only; the values are in `apps/web/.env.local`):
- `READ_SECRET` (Sensitive)
- `GCAL_ICAL_URL_1` and `GCAL_NAME_1`: your work calendar slot (update both if they already exist; the address is Sensitive)
- Your astro calendar: it is **not in `.env.local` yet** (no calendar there is named "astro"). Do section I steps 1 to 3 first, then add that slot's `GCAL_ICAL_URL_n` (Sensitive) and `GCAL_NAME_n` = `astro`.

Clicks:
1. In VS Code, open `apps/web/.env.local` and keep it open next to the browser.
2. Open vercel.com, sign in, click your **1wan** project.
3. Click **Settings** (top bar), then **Environment Variables** (left).
4. For each name above: if it is already in the list, click its **⋯** then **Edit**; if not, use the form at the top.
   - **Key**: the name, exactly as written above.
   - **Value**: copy the part after `=` on that line in `.env.local`.
   - Tick **Sensitive** for `READ_SECRET` and every `GCAL_ICAL_URL_` line.
   - Environments: **Production** and **Preview**.
   - Click **Save**.
5. Click **Deployments** (top bar). On the newest one, click **⋯**, then **Redeploy**, then **Redeploy** again.
6. Wait for **Ready** (about a minute), then open your site and go to `/dashboard`. Calendar chips should show your work calendar; Luna's card should show "From your astro calendar" once the astro feed is in.
7. Tell Claude Code "variables are in". It will then do one throwaway read of the weekly packet.

Optional, so Claude Code can do this itself next time: in the VS Code terminal type `npx vercel login`, press Enter and follow the browser prompt. Then `npx vercel link` inside `apps/web` and pick the 1wan project.

## Later (not tonight)

31. Only after step 30 passes: point the scheduled tasks at the new address (build order step 6), starting with one task and a real throwaway brief, as `prompts/INGEST.md` describes.
