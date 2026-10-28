// The Today to-do list (round 10, on the Court's Today card). Rows live in the tasks table (todo: true) or preview
// storage. Unfinished items carry over by themselves (shown "from yesterday" or "from <day>"); done items show only
// on the day they were done and stay in the table as history. Nothing is deleted unless she deletes it.
export type Todo = { id: string; title: string; todo?: boolean; done?: boolean; day?: string; doneOn?: string; at?: string };

export function todayTodos(rows: Todo[], k: string) {
  const mine = rows.filter((r) => r && r.todo === true && typeof r.title === "string");
  const open = mine.filter((r) => !r.done).map((r) => ({ ...r, from: r.day && r.day < k ? r.day : null })).sort((a, b) => (a.day ?? k).localeCompare(b.day ?? k) || (a.at ?? "").localeCompare(b.at ?? ""));
  const done = mine.filter((r) => r.done && r.doneOn === k);
  const history = mine.filter((r) => r.done && r.doneOn !== k).length;
  return { open, done, history };
}
