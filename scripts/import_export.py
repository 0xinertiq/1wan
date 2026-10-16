"""Import the old dashboard export (data-import/) into Supabase.

Dry run by default. Add --apply to write. Safe to re-run: existing rows are
skipped or updated in place. Prints counts only, never data contents.

  python -I scripts/import_export.py --email you@example.com [--apply]
"""
import argparse
import json
import pathlib
import sys
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
DB = ROOT / "data-import" / "db"
ENV = ROOT / "apps" / "web" / ".env.local"


def load_env():
    env = {}
    for line in ENV.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"')
    return env


class Supa:
    def __init__(self, url, key):
        self.url = url.rstrip("/")
        self.h = {"apikey": key, "Authorization": "Bearer " + key,
                  "Content-Type": "application/json"}

    def req(self, method, path, body=None, extra=None):
        r = urllib.request.Request(self.url + path, method=method,
                                   headers={**self.h, **(extra or {})},
                                   data=None if body is None else json.dumps(body).encode())
        try:
            with urllib.request.urlopen(r) as resp:
                txt = resp.read().decode()
                return json.loads(txt) if txt else None
        except urllib.error.HTTPError as e:
            sys.exit(f"Supabase {method} {path.split('?')[0]} failed: {e.code} {e.read().decode()[:300]}")


def read(p):
    return json.loads(p.read_text(encoding="utf-8"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--email", required=True)
    ap.add_argument("--apply", action="store_true")
    a = ap.parse_args()

    env = load_env()
    s = Supa(env["NEXT_PUBLIC_SUPABASE_URL"], env["SUPABASE_SERVICE_ROLE_KEY"])

    users = s.req("GET", "/auth/v1/admin/users?per_page=200")["users"]
    me = next((u for u in users if (u.get("email") or "").lower() == a.email.lower()), None)
    if not me:
        sys.exit(f"No Supabase login found for {a.email}. Invite yourself first (Authentication > Users).")
    uid = me["id"]

    for t in ("briefs", "agent_memory", "feedback", "user_state"):
        s.req("GET", f"/rest/v1/{t}?select=*&limit=0")  # exits if the table is missing

    # Briefs are shared (user_id NULL), written once for everyone.
    briefs = [read(p) for p in sorted((DB / "briefs").glob("*.json"))]
    existing = s.req("GET", "/rest/v1/briefs?select=kind,at&user_id=is.null")
    seen = {(b["kind"], b["at"][:19]) for b in existing}
    new_briefs = [{"user_id": None, "kind": b["kind"], "title": b.get("title", ""),
                   "body": b.get("body", ""), "at": b["at"]}
                  for b in briefs if (b["kind"], b["at"][:19]) not in seen]

    mem = [{"user_id": uid, "key": p.stem, "data": read(p)}
           for p in sorted((DB / "agentmem").glob("*.json"))]

    fb_dir = DB / "feedback"
    fb = [{"user_id": uid, "brief_kind": p.stem, "items": read(p)}
          for p in sorted(fb_dir.glob("*.json"))] if fb_dir.exists() else []

    state = read(DB / "data" / "users" / "me" / "state.json")
    exports = sorted((ROOT / "data-import").glob("kumo-export-*.json"))
    if exports:  # keep browser-only settings so nothing is lost
        local = read(exports[-1]).get("local", {})
        if "kumo.v4" in local:  # browser cache was one edit ahead of the db copy (16 Oct export)
            state = json.loads(local["kumo.v4"])
        state["_browser"] = {k: v for k, v in local.items() if k != "kumo.v4"}

    print(f"User: found ({a.email})")
    print(f"briefs:       {len(new_briefs)} new, {len(briefs) - len(new_briefs)} already there")
    print(f"agent_memory: {len(mem)} keys ({', '.join(m['key'] for m in mem)})")
    print(f"feedback:     {len(fb)}")
    print(f"user_state:   1 doc, {len(state)} top-level keys")

    if not a.apply:
        print("\nDry run only. Nothing written. Re-run with --apply to import.")
        return

    upsert = {"Prefer": "resolution=merge-duplicates,return=minimal"}
    if new_briefs:
        s.req("POST", "/rest/v1/briefs", new_briefs, {"Prefer": "return=minimal"})
    if mem:
        s.req("POST", "/rest/v1/agent_memory?on_conflict=user_id,key", mem, upsert)
    if fb:
        s.req("POST", "/rest/v1/feedback?on_conflict=user_id,brief_kind", fb, upsert)
    s.req("POST", "/rest/v1/user_state?on_conflict=user_id",
          {"user_id": uid, "data": state}, upsert)
    s.req("POST", "/rest/v1/profiles?on_conflict=user_id", {"user_id": uid}, upsert)

    n = lambda t, f="user_id": len(s.req("GET", f"/rest/v1/{t}?select={f}&{f}=eq.{uid}"))
    shared = len(s.req("GET", "/rest/v1/briefs?select=kind&user_id=is.null"))
    print(f"\nDone. In Supabase now: briefs {shared}, agent_memory {n('agent_memory')}, "
          f"feedback {n('feedback')}, user_state {n('user_state')}")


if __name__ == "__main__":
    main()
