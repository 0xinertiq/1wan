"""Set a new password for an existing Supabase login (no delete, no recreate).

The password is typed with hidden input. It is never printed, logged or saved.
Uses the service role key from apps/web/.env.local.

  python -I scripts/set_password.py --email you@example.com
"""
import argparse
import getpass
import json
import pathlib
import sys
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
ENV = ROOT / "apps" / "web" / ".env.local"


def load_env():
    env = {}
    for line in ENV.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"')
    return env


def call(method, url, key, body=None):
    r = urllib.request.Request(url, method=method,
                               headers={"apikey": key, "Authorization": "Bearer " + key,
                                        "Content-Type": "application/json"},
                               data=None if body is None else json.dumps(body).encode())
    try:
        with urllib.request.urlopen(r) as resp:
            return json.loads(resp.read().decode() or "null")
    except urllib.error.HTTPError as e:
        try:
            msg = json.loads(e.read().decode()).get("msg") or ""
        except Exception:
            msg = ""
        sys.exit(f"Supabase said no ({e.code}). {msg}".strip())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--email", required=True)
    email = ap.parse_args().email.lower()

    env = load_env()
    base = env["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
    key = env["SUPABASE_SERVICE_ROLE_KEY"]

    users = call("GET", base + "/auth/v1/admin/users?per_page=200", key)["users"]
    user = next((u for u in users if (u.get("email") or "").lower() == email), None)
    if not user:
        sys.exit(f"No login found for {email}. Nothing changed.")

    pw = getpass.getpass("New password (hidden): ")
    if len(pw) < 8:
        sys.exit("Too short: use at least 8 characters. Nothing changed.")
    if getpass.getpass("Type it again (hidden): ") != pw:
        sys.exit("The two didn't match. Nothing changed.")

    call("PUT", f"{base}/auth/v1/admin/users/{user['id']}", key, {"password": pw})
    del pw
    print(f"Password updated for {email}. You can sign in now.")


if __name__ == "__main__":
    main()
