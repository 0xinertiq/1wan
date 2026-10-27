import { StageActors } from "./StageActors";
import { StagePrices } from "./Prices";
import { StageSky } from "./StageSky";
import type { BriefKind } from "@/lib/briefKinds";

// Court scene from dashboard-v52. Sky colour and moon from Luna's real sun and moon positions (StageSky);
// the crew stands at their desks only when their real work for today exists (StageActors).
export function Stage({ filed }: { filed: Partial<Record<BriefKind, string>> }) {
  return (
    <section className="stage" id="stage" aria-label="Court scene. Crew members stand at their desks when their work for today is done.">
      <div className="sky"></div>
      <div className="stars" aria-hidden="true">
        <i style={{ left: "8%", top: "12%" }}></i><i style={{ left: "18%", top: "30%", animationDelay: "-1s" }}></i><i style={{ left: "27%", top: "8%", animationDelay: "-2s" }}></i><i style={{ left: "36%", top: "22%", animationDelay: "-.5s" }}></i><i style={{ left: "46%", top: "10%", animationDelay: "-1.6s" }}></i><i style={{ left: "55%", top: "28%" }}></i><i style={{ left: "63%", top: "14%", animationDelay: "-2.4s" }}></i><i style={{ left: "71%", top: "34%", animationDelay: "-1.2s" }}></i><i style={{ left: "79%", top: "9%", animationDelay: "-.8s" }}></i><i style={{ left: "88%", top: "26%", animationDelay: "-2.1s" }}></i><i style={{ left: "94%", top: "16%" }}></i><i style={{ left: "12%", top: "44%", animationDelay: "-1.4s" }}></i>
      </div>
      <StageSky />
      <svg className="cloud sk" viewBox="0 -6 200 70" style={{ top: "12%", "--rm-left": "14%", animationDuration: "70s", animationDelay: "-12s" } as React.CSSProperties} aria-hidden="true"><use href="#cl" /></svg>
      <svg className="cloud sk" viewBox="0 -6 200 70" style={{ top: "26%", "--rm-left": "52%", animationDuration: "96s", animationDelay: "-58s", transformOrigin: "left", scale: ".8" } as React.CSSProperties} aria-hidden="true"><use href="#cl" /></svg>
      <svg className="cloud sk" viewBox="0 -6 200 70" style={{ top: "6%", "--rm-left": "70%", animationDuration: "84s", animationDelay: "-40s", scale: ".65" } as React.CSSProperties} aria-hidden="true"><use href="#cl" /></svg>
      <svg className="hills" viewBox="0 0 160 60" preserveAspectRatio="none" aria-hidden="true">
        <path className="hf" d="M0 38C14 14 30 14 46 32C60 46 72 22 92 20C112 18 128 40 160 24V60H0Z" />
        <path className="hm" d="M0 50C20 30 38 34 56 46C74 56 94 34 116 38C132 41 148 48 160 40V60H0Z" />
      </svg>
      <div className="ground" aria-hidden="true"></div>
      <i className="fl" style={{ left: "14%", bottom: "7%", background: "#FFC6DC", "--c2": "#FFE6EF" } as React.CSSProperties} aria-hidden="true"></i>
      <i className="fl" style={{ left: "30%", bottom: "3.5%", background: "#FFF0A6", "--c2": "#FFF9D4" } as React.CSSProperties} aria-hidden="true"></i>
      <i className="fl" style={{ left: "68%", bottom: "6%", background: "#FFC6DC", "--c2": "#FFE6EF" } as React.CSSProperties} aria-hidden="true"></i>
      <i className="fl" style={{ left: "84%", bottom: "3%", background: "#FFC4DB", "--c2": "#FFE6EF" } as React.CSSProperties} aria-hidden="true"></i>
      <i className="fl" style={{ left: "96%", bottom: "7%", background: "#FFF0A6", "--c2": "#FFF9D4" } as React.CSSProperties} aria-hidden="true"></i>
      <div className="tree" style={{ left: "2.5%", top: "61%" }} aria-hidden="true"></div>
      <div className="tree" style={{ left: "98%", top: "61%" }} aria-hidden="true"></div>
      <svg className="plat" viewBox="0 -6 200 70" style={{ left: "3%", width: "27%", top: "calc(62% - 3.6cqw)" }} aria-hidden="true"><use href="#cl" /></svg>
      <svg className="plat" viewBox="0 -6 200 70" style={{ left: "70%", width: "27%", top: "calc(62% - 3.6cqw)" }} aria-hidden="true"><use href="#cl" /></svg>
      <svg className="plat" viewBox="0 -6 200 70" style={{ left: "35%", width: "30%", top: "calc(40% - 4cqw)" }} aria-hidden="true"><use href="#cl" /></svg>
      <svg className="plat" viewBox="0 -6 200 70" style={{ left: "calc(50% - 12cqw)", width: "24cqw", top: "calc(22% - 3.2cqw)" }} aria-hidden="true"><use href="#cl" /></svg>
      <svg className="palace" id="palace" viewBox="0 0 120 100" style={{ left: "calc(50% - 8cqw)", width: "16cqw", top: "calc(22% - 12.6cqw)" }} aria-hidden="true">
        <rect x="24" y="90" width="72" height="8" rx="3" fill="var(--pal-trim)" stroke="var(--line)" strokeWidth="3" />
        <rect x="34" y="58" width="52" height="34" fill="var(--pal-wall)" stroke="var(--line)" strokeWidth="3" strokeLinejoin="round" />
        <path d="M52 92V76a8 8 0 0 1 16 0V92Z" fill="var(--pal-door)" stroke="var(--line)" strokeWidth="2.5" />
        <circle cx="42" cy="72" r="4" fill="var(--pal-trim)" stroke="var(--line)" strokeWidth="2" /><circle cx="78" cy="72" r="4" fill="var(--pal-trim)" stroke="var(--line)" strokeWidth="2" />
        <path d="M10 60Q26 58 32 46H88Q94 58 110 60Q60 68 10 60Z" fill="var(--pal-roof)" stroke="var(--line)" strokeWidth="3" strokeLinejoin="round" />
        <rect x="44" y="30" width="32" height="17" fill="var(--pal-wall)" stroke="var(--line)" strokeWidth="3" strokeLinejoin="round" />
        <path d="M28 33Q42 31 46 20H74Q78 31 92 33Q60 40 28 33Z" fill="var(--pal-roof)" stroke="var(--line)" strokeWidth="3" strokeLinejoin="round" />
        <line x1="60" y1="20" x2="60" y2="8" stroke="var(--line)" strokeWidth="3" strokeLinecap="round" /><circle cx="60" cy="6" r="4" fill="var(--pal-trim)" stroke="var(--line)" strokeWidth="2" />
      </svg>
      <i className="zz" id="zz" style={{ left: "calc(50% + 5cqw)", top: "calc(22% - 12cqw)" }} hidden aria-hidden="true"></i>
      <i className="spk" style={{ left: "12%", top: "55%" }} aria-hidden="true"></i><i className="spk" style={{ left: "88%", top: "57%", animationDelay: "-1.2s" }} aria-hidden="true"></i><i className="spk" style={{ left: "50%", top: "33%", animationDelay: "-.6s" }} aria-hidden="true"></i><i className="bf" style={{ top: "66%", animationDuration: "38s" }} aria-hidden="true"></i><i className="bf b2" style={{ top: "72%", animationDuration: "52s", animationDelay: "-20s" }} aria-hidden="true"></i><i className="bird" style={{ top: "20%", animationDuration: "46s", animationDelay: "-8s" }} aria-hidden="true"></i><i className="bird" style={{ top: "30%", animationDuration: "64s", animationDelay: "-35s" }} aria-hidden="true"></i>
      <svg className="banner" viewBox="0 0 60 100" aria-hidden="true"><path d="M6 0H54V90L30 76L6 90Z" fill="var(--banner)" stroke="var(--line)" strokeWidth="3" strokeLinejoin="round" /><polygon points="30,24 34,34 45,35 37,42 39,53 30,47 21,53 23,42 15,35 26,34" fill="#FFD95E" stroke="var(--line)" strokeWidth="2.4" strokeLinejoin="round" /></svg>
      <div className="dais" aria-hidden="true"></div>
      <div className="chip-map chip-l" aria-hidden="true">CLOUD COURT</div>
      <div className="chip-map chip-r" id="crewChip" aria-hidden="true">0 AT WORK</div>
      <StagePrices />
      <StageActors filed={filed} />
      <div className="fx" id="fx" aria-hidden="true"></div>
      <div className="lvl" id="lvlBanner" hidden><b id="lvlTxt">LEVEL UP</b><span id="lvlSub"></span></div>
    </section>
  );
}
