"""Import her four tracker artifacts (data-import/trackers/) into Supabase.

Needs migration 0004. Dry run by default. Add --apply to write. Safe to re-run:
ledger rows are upserted by id, watering events are skipped if already there,
and user_state keys that already exist are kept (the app's copy is newer).
Prints counts only, never data contents.

  python -I scripts/import_trackers.py --email you@example.com [--apply]
  python -I scripts/import_trackers.py --only-user [--apply]   (when there is exactly one login)
"""
import argparse
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from import_export import ROOT, Supa, load_env, read  # noqa: E402

SRC = ROOT / "data-import" / "trackers" / "trackers-pack"
LEDGER = SRC / "swing-trade-ledger" / "db"
DAY = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def day(v):
    return v if isinstance(v, str) and DAY.match(v) else None


def num(v):
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) else None


def page_state(name):
    """The JSON a claude.ai artifact saved in its <script id="state"> tag, or None."""
    p = SRC / name / "index.html"
    if not p.exists():
        return None
    m = re.search(r'<script[^>]*id=["\']state["\'][^>]*>(.*?)</script>', p.read_text(encoding="utf-8"), re.S)
    txt = m.group(1).strip() if m else ""
    return json.loads(txt) if txt else None


def docs(folder):
    return [(p.stem, read(p)) for p in sorted((LEDGER / folder).glob("*.json"))] if (LEDGER / folder).exists() else []


def main():
    ap = argparse.ArgumentParser()
    who = ap.add_mutually_exclusive_group(required=True)
    who.add_argument("--email")
    who.add_argument("--only-user", action="store_true", help="use the single Supabase login; never prints it")
    ap.add_argument("--apply", action="store_true")
    a = ap.parse_args()

    env = load_env()
    s = Supa(env["NEXT_PUBLIC_SUPABASE_URL"], env["SUPABASE_SERVICE_ROLE_KEY"])

    users = s.req("GET", "/auth/v1/admin/users?per_page=200")["users"]
    if a.only_user:
        if len(users) != 1:
            sys.exit(f"--only-user needs exactly one login; found {len(users)}. Use --email instead.")
        me = users[0]
    else:
        me = next((u for u in users if (u.get("email") or "").lower() == a.email.lower()), None)
    if not me:
        sys.exit("No Supabase login found for that email. Invite yourself first (Authentication > Users).")
    uid = me["id"]

    for t in ("trades", "plans", "gamble", "ledger_settings", "watering_events", "user_state"):
        s.req("GET", f"/rest/v1/{t}?select=*&limit=0")  # exits if migration 0004 is not run yet

    trades = [{
        "user_id": uid, "id": i, "date": day(d.get("date")), "inst": d.get("inst"), "dir": d.get("dir"),
        "entry": num(d.get("entry")), "exit": num(d.get("exit")), "stop": num(d.get("stop")),
        "size": num(d.get("size")), "lev": num(d.get("lev")), "pnl": num(d.get("pnl")),
        "setup": d.get("setup"), "lesson": d.get("lesson"), "tags": d.get("tags") or [],
        "rules": d.get("rules"), "checks": d.get("checks"), "plan_id": d.get("planId"),
        "at": d.get("createdAt") or (d.get("date") + "T12:00:00+08:00" if day(d.get("date")) else None),
    } for i, d in docs("trades")]

    plans = [{
        "user_id": uid, "id": i, "date": day(d.get("date")), "inst": d.get("inst"), "dir": d.get("dir"),
        "entry": num(d.get("entry")), "until": day(d.get("until")), "thesis": d.get("thesis"),
        "wrong": d.get("wrong"), "checks": d.get("checks"), "triggered": bool(d.get("triggered")),
        "placed": bool(d.get("placed")), "outcome": d.get("outcome") or "open", "at": d.get("createdAt"),
    } for i, d in docs("plans")]

    gamble = [{
        "user_id": uid, "id": i, "date": day(d.get("date")), "what": d.get("what"),
        "pnl": num(d.get("pnl")), "note": d.get("note"), "at": d.get("createdAt"),
    } for i, d in docs("gamble")]

    settings = dict(docs("settings")).get("main")
    wallets = (dict(docs("gamblemeta")).get("wallets") or {}).get("wallets") or []
    ledger = None
    if settings or wallets:
        settings = settings or {}
        ledger = {"user_id": uid, "account": num(settings.get("account")), "risk_pct": num(settings.get("riskPct")),
                  "rules": [r for r in settings.get("rules") or [] if isinstance(r, str)],
                  "wallets": [{"name": w.get("name"), "amount": num(w.get("amount"))} for w in wallets]}

    # user_state keys. grid is the 64 Actionables ticks; samsara keeps its weekly counters.
    mandala = SRC / "64-actionables" / "db" / "data" / "users" / "me" / "mandala.json"
    # Small Wins goes to swins: the key wins already holds the dashboard's diary wins.
    keys = {"swins": page_state("small-wins"), "money": page_state("money-wins"),
            "grid": read(mandala) if mandala.exists() else None, "samsara": page_state("samsara")}
    keys = {k: v for k, v in keys.items() if v is not None}

    # Garden history: one watering event per trade and per day of logged anchors.
    water = [{"user_id": uid, "at": t["at"], "source": "trade", "ref": "trade:" + t["id"], "weight": 1}
             for t in trades if t["at"]]
    for d, v in sorted(((keys.get("swins") or {}).get("log") or {}).items()):
        n = sum(1 for x in v if x) if isinstance(v, list) else 0
        if day(d) and n:
            water.append({"user_id": uid, "at": d + "T21:00:00+08:00", "source": "anchors", "ref": "anchors:" + d, "weight": n})

    row = s.req("GET", f"/rest/v1/user_state?select=data,version&user_id=eq.{uid}")
    have = (row[0]["data"] or {}) if row else {}
    add = {k: v for k, v in keys.items() if k not in have}
    kept = sorted(k for k in keys if k in have)
    old_water = {w["ref"] for w in s.req("GET", f"/rest/v1/watering_events?select=ref&user_id=eq.{uid}")}
    new_water = [w for w in water if w["ref"] not in old_water]

    print("Trackers import" + ("" if a.apply else " (dry run, nothing written)"))
    print(f"  trades: {len(trades)}  plans: {len(plans)}  gamble: {len(gamble)}  ledger settings: {'yes' if ledger else 'no'}")
    print(f"  user_state keys to add: {', '.join(sorted(add)) or 'none'}" + (f"  (kept existing: {', '.join(kept)})" if kept else ""))
    print(f"  watering events: {len(new_water)} new, {len(water) - len(new_water)} already there")
    if not a.apply:
        print("Looks right? Run again with --apply.")
        return

    up = {"Prefer": "resolution=merge-duplicates,return=minimal"}
    for t, rows in (("trades", trades), ("plans", plans), ("gamble", gamble)):
        if rows:
            s.req("POST", f"/rest/v1/{t}?on_conflict=user_id,id", rows, up)
    if ledger:
        s.req("POST", "/rest/v1/ledger_settings?on_conflict=user_id", ledger, up)
    if new_water:
        s.req("POST", "/rest/v1/watering_events?on_conflict=user_id,source,ref", new_water,
              {"Prefer": "resolution=ignore-duplicates,return=minimal"})
    if add:
        if row:
            s.req("PATCH", f"/rest/v1/user_state?user_id=eq.{uid}",
                  {"data": {**have, **add}, "version": (row[0]["version"] or 0) + 1}, {"Prefer": "return=minimal"})
        else:
            s.req("POST", "/rest/v1/user_state", {"user_id": uid, "data": add, "version": 1}, {"Prefer": "return=minimal"})
    print("Done.")


if __name__ == "__main__":
    main()
