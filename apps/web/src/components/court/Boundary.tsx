"use client";

import { Component, type ReactNode } from "react";

// One bad piece of data can never blank the whole app: every Court card and every tab sits in one of these. If it
// throws, only that card shows a small "This card could not load" with Retry, and the rest keeps working.
export class Boundary extends Component<{ name: string; children: ReactNode }, { error: Error | null; tries: number }> {
  state = { error: null as Error | null, tries: 0 };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.warn(`[${this.props.name}] could not load:`, error?.message ?? error); }
  render() {
    if (!this.state.error) return <Fragmentless key={this.state.tries}>{this.props.children}</Fragmentless>;
    return (
      <section className="win kerr" role="alert" aria-label={`${this.props.name} could not load`}>
        <div className="win-body">
          <p><b>This card could not load.</b> <span className="note">{this.props.name}</span></p>
          <button className="btn sm ghost" type="button" onClick={() => this.setState((s) => ({ error: null, tries: s.tries + 1 }))}>Retry</button>
        </div>
      </section>
    );
  }
}
// Remounts the children on Retry (a new key), without adding a wrapper element.
function Fragmentless({ children }: { children: ReactNode }) { return <>{children}</>; }
