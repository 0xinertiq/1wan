"use client";

import { useState } from "react";

// The astro calendar's own description, quoted as written: line breaks kept, http(s) links clickable,
// long ones folded to a few lines with "Read more". Plain text only (no HTML is ever injected).
const URL_RE = /(https?:\/\/[^\s<>]*[^\s<>().,;:!?'"\]])/g;

function linkify(text: string) {
  return text.split(URL_RE).map((part, i) =>
    i % 2 ? <a key={i} href={part} target="_blank" rel="noopener noreferrer">{part}</a> : part);
}

export function AstroText({ text }: { text?: string }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  const long = text.length > 280 || text.split("\n").length > 4;
  return (
    <div className="adescw">
      <blockquote className={"adesc" + (long && !open ? " clamp" : "")}>{linkify(text)}</blockquote>
      {long && <button type="button" className="nhide" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Show less" : "Read more"}</button>}
    </div>
  );
}
