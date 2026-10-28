"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useCourt } from "../CourtState";
import { useEcon } from "../live/EconLive";
import { isAutoPaid } from "../live/TodayLive";
import { useReview } from "@/components/kumo/reviewRead";
import { useUi } from "@/components/kumo/useUi";
import { dueList, type CourtState } from "@/lib/court/state";
import { liquidityList } from "@/lib/liquidity";
import { buildInbox, groupOf, type Group, type Note, type Src } from "@/lib/court/inbox";
import { dueSoon } from "@/lib/court/vaultDue";
import { isStringList, readSaved, writeSaved } from "@/lib/court/store";
import { stamp, wdOf } from "@/lib/court/time";
import { useVault } from "@/lib/vault";
import { notifOn } from "./SettingsPage";
import { Btn, Card, EmptyState, PageHead, TabPills } from "../ui";

// Notifications (round 6): the bell in the header (New look) and the full inbox, grouped High priority, Today,
// Earlier, with filters, a detail view and deep links. Read state is kept on this device. No fake push.

type Brief = { key: string; label: string; at: string };
const InboxCtx = createContext<{ briefs: Brief[]; review: string | null }>({ briefs: [], review: null });
export const InboxProvider = ({ briefs, review, children }: { briefs: Brief[]; review: string | null; children: React.ReactNode }) => <InboxCtx.Provider value={{ briefs, review }}>{children}</InboxCtx.Provider>;

const SRC: Record<Src, string> = { needs: "Life admin", brief: "Briefs", review: "Review", liquidity: "Releases", routine: "Tasks and routines", habit: "Habits", kingdom: "Kingdom" };

export function habitsToday(st: CourtState, k: string) {
  const wd = wdOf(k), done = st.hab.log[k] ?? [];
  return st.hab.list.filter((h) => !h.paused && h.days.includes(wd) && !done.includes(h.id)).map((h) => ({ id: h.id, name: h.name }));
}

export function useInbox() {
  const { st, k, events } = useCourt();
  const { briefs, review } = useContext(InboxCtx);
  const rv = useReview(review);
  const econ = useEcon();
  const tasks = useVault("tasks"), routines = useVault("routines");
  const [read, setRead] = useState<string[]>([]);
  useEffect(() => {
    const load = () => setRead(readSaved("inbox.read", isStringList, []));
    load();
    window.addEventListener("1wan:inbox-read", load);
    return () => window.removeEventListener("1wan:inbox-read", load);
  }, []);
  const list = useMemo(() => buildInbox({
    k, nowIso: new Date().toISOString(),
    due: dueList(st, k, events).filter((x) => !isAutoPaid(x.it) && (x.dd <= 3 || x.it.important === true)).map((x) => ({ id: x.it.id, name: x.it.name, d: x.d, dd: x.dd, important: x.it.important })),
    vdue: dueSoon(tasks.rows as never, routines.rows as never, k, 3).map((x) => ({ ...x, kind: x.kind })),
    briefs: briefs.filter((b) => Date.parse(b.at) > Date.now() - 86400e3),
    review: review ? { at: review, unread: rv.unread } : null,
    releases: liquidityList(econ?.items ?? [], Date.now(), Date.now() + 2 * 86400e3).map((r) => ({ at: r.at, name: r.name })),
    habits: habitsToday(st, k), streak: st.streak, notif: (id) => notifOn(st.prefs.notif, id),
  }), [st, k, events, briefs, review, rv.unread, econ, tasks.rows, routines.rows]);
  const mark = (ids: string[]) => { const next = [...new Set([...read, ...ids])].slice(-400); setRead(next); writeSaved("inbox.read", next); window.dispatchEvent(new Event("1wan:inbox-read")); };
  return { list, read, mark, unread: list.filter((n) => !read.includes(n.id)) };
}

function Item({ n, unread, onOpen }: { n: Note; unread: boolean; onOpen: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={"krow kinbox-item" + (unread ? " unread" : "")}>
      <span className="krow-main">
        <button type="button" className="klink-row" aria-expanded={open} onClick={() => { setOpen(!open); onOpen(); }}><b>{n.title}</b>{unread && <span className="sr"> (unread)</span>}<br /><span className="note">{SRC[n.src]} · <time className="ts">{stamp(n.at)}</time></span></button>
        {open && <><p className="note">{n.detail ?? "Open it where it lives."}</p><a href={n.go === "court" ? "#" : "#" + n.go}>Open in {n.go === "court" ? "the Court" : n.go === "life" ? "the Life Hub" : n.go[0].toUpperCase() + n.go.slice(1)} →</a></>}
      </span>
    </div>
  );
}

/** The bell (New look): count of unread, a short dropdown, and the way to the full inbox. */
export function Bell() {
  const ui = useUi();
  const { unread, mark, read } = useInbox();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", close); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", esc); };
  }, [open]);
  if (ui !== "new") return null;
  return (
    <div className="kbell" ref={wrap}>
      <button className="icon-btn" type="button" aria-expanded={open} aria-label={`Notifications, ${unread.length} unread`} onClick={() => setOpen(!open)}>
        {/* pixel-art bell */}
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path className="ic-o" d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15z" strokeWidth="2" strokeLinejoin="round" /><path className="ic-X" d="M10 21a2 2 0 0 0 4 0" fill="none" strokeWidth="2" strokeLinecap="round" /></svg>
        {unread.length > 0 && <span className="kbell-n">{unread.length > 9 ? "9+" : unread.length}</span>}
      </button>
      {open && (
        <div className="kbell-pop" role="dialog" aria-label="Notifications">
          {!unread.length ? <EmptyState>All caught up.</EmptyState> : unread.slice(0, 5).map((n) => <Item key={n.id} n={n} unread={!read.includes(n.id)} onOpen={() => mark([n.id])} />)}
          <div className="kform-row"><a className="btn sm" href="#inbox" onClick={() => setOpen(false)}>Open the inbox</a>{unread.length > 0 && <Btn kind="sm ghost" onClick={() => mark(unread.map((n) => n.id))}>Mark all read</Btn>}</div>
        </div>
      )}
    </div>
  );
}

export function InboxPage() {
  const { list, read, mark } = useInbox();
  const [f, setF] = useState<"all" | "unread" | Src>("all");
  const shown = list.filter((n) => f === "all" || (f === "unread" ? !read.includes(n.id) : n.src === f));
  const { k } = useCourt();
  const groups: Group[] = ["High priority", "Today", "Earlier"];
  const srcs = [...new Set(list.map((n) => n.src))];
  return (
    <div className="kpage">
      <PageHead scene="castle" title="Notifications" sub="Everything that wants a moment of your time, in one calm list." actions={<Btn kind="sm ghost" onClick={() => mark(list.map((n) => n.id))}>Mark all read</Btn>} />
      <TabPills label="Filter" value={f} options={[["all", "All"], ["unread", "Unread"], ...srcs.map((s) => [s, SRC[s]] as const)] as readonly (readonly [typeof f, string])[]} onChange={setF} />
      {!shown.length ? <EmptyState>Nothing here. The fox is napping; so can you.</EmptyState> : (
        <div className="kpg three">
          {groups.map((g) => (
            <div className="kcol" key={g}>
              <Card title={g} sub={`${shown.filter((n) => groupOf(n, k) === g).length}`}>
                {shown.filter((n) => groupOf(n, k) === g).map((n) => <Item key={n.id} n={n} unread={!read.includes(n.id)} onOpen={() => mark([n.id])} />)}
                {!shown.some((n) => groupOf(n, k) === g) && <p className="note">Nothing.</p>}
              </Card>
            </div>
          ))}
        </div>
      )}
      <p className="note">Choose what appears here in Settings, under Notifications. Quiet by default: one calm morning summary.</p>
    </div>
  );
}
