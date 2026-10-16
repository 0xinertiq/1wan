import { BriefFeedback } from "./BriefFeedback";
import { SourcesLine, type BriefDoc } from "./BriefTabs";

// Watchlist scan window (v52 scanBox). v52 read TradingView live; here it shows the newest brief of kind
// "scan" from her 03:50 scheduled task.
export function ScanWin({ doc }: { doc: BriefDoc | null }) {
  return (
    <div id="mktWrap">
      <section className="win" id="scanBox" aria-labelledby="scT">
        <div className="win-title"><h2 id="scT">Watchlist scan</h2><span className="sub">Fenn</span></div>
        <div className="win-body">
          {doc ? (
            <>
              <p className="note brh"><b>{doc.title}</b>{doc.when && ` · ${doc.when}`}</p>
              <div className="brb open" dangerouslySetInnerHTML={{ __html: doc.html }} />
              <SourcesLine s={doc.sources} />
              <BriefFeedback kind="scan" at={doc.at} initial={doc.vote} />
            </>
          ) : (
            <p className="note">No scan yet. Your 03:50 Daily Crypto Watchlist Scan lands here after its next run.</p>
          )}
          <p className="note xd">Tracking only. The crew never places trades or tells you what to buy.</p>
        </div>
      </section>
    </div>
  );
}
