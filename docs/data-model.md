# Dashboard data to migrate (read 16 Oct 2026)

Artifact database (4 collections, 1 private doc):
- briefs/{intel,movers,pulse,scan}      latest brief per task: title, body, at, kind
- agentmem/{intel,protocol,pulse,scan}  agent memory / learning loop notes
- agentmem/review                       Chief Kumo weekly review (not present yet)
- feedback/{key}                        thumbs ratings (empty today)
- data/users/<me>/state                 one 70 KB doc: habits, XP, level, streak, journal-ish lists,
                                        knowledge base (kb), life admin, notes, risk, themes

Browser storage (not in the database): kumo.wl, kumo.brseen, kumo.v4 (state cache),
kumo.risk, kumo.theme, kumo.win, kumo.fold, kumo.fx, kumo.seed12.

Target tables (all with user_id + RLS): briefs, agent_memory, feedback, user_state (jsonb at first,
split later), usage.
