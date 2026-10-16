// Shared SVG defs from dashboard-v52 (cloud shape and gradients used by the stage).
export function CourtDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false"><defs>
    <linearGradient id="cgrad" gradientUnits="userSpaceOnUse" x1="8" y1="-6" x2="192" y2="62"><stop offset="0" style={{ stopColor: "var(--cg1)" }} /><stop offset=".38" style={{ stopColor: "var(--cg2)" }} /><stop offset=".72" style={{ stopColor: "var(--cg3)" }} /><stop offset="1" style={{ stopColor: "var(--cg4)" }} /></linearGradient>
    <radialGradient id="cglow" cx=".5" cy=".5" r=".5"><stop offset="0" style={{ stopColor: "var(--cg2)", stopOpacity: ".95" }} /><stop offset="1" style={{ stopColor: "var(--cg2)", stopOpacity: "0" }} /></radialGradient>
    <g id="clshape"><rect x="14" y="26" width="172" height="20" rx="10" /><circle cx="26" cy="38" r="10" /><circle cx="40" cy="44" r="14" /><circle cx="74" cy="47" r="15" /><circle cx="110" cy="47" r="15" /><circle cx="146" cy="45" r="14" /><circle cx="172" cy="40" r="11" /><circle cx="52" cy="22" r="15" /><circle cx="92" cy="14" r="18" /><circle cx="132" cy="19" r="15" /><circle cx="162" cy="27" r="11" /></g>
    <g id="cl"><use href="#clshape" style={{ fill: "var(--cl-line)", stroke: "var(--cl-line)", strokeWidth: "3.4", strokeLinejoin: "round" }} /><use href="#clshape" style={{ fill: "url(#cgrad)" }} /><ellipse cx="100" cy="30" rx="62" ry="16" style={{ fill: "url(#cglow)" }} /><circle cx="64" cy="40" r="3.6" style={{ fill: "var(--cheek)", opacity: ".6" }} /><circle cx="136" cy="40" r="3.6" style={{ fill: "var(--cheek)", opacity: ".6" }} /><path transform="translate(40 24)" d="M0-4L1.2-1.2 4 0 1.2 1.2 0 4-1.2 1.2-4 0-1.2-1.2z" style={{ fill: "#fff", opacity: ".9" }} /><path transform="translate(152 22)" d="M0-3L.9-.9 3 0 .9.9 0 3-.9.9-3 0-.9-.9z" style={{ fill: "#fff", opacity: ".9" }} /><path transform="translate(104 5)" d="M0-3L.9-.9 3 0 .9.9 0 3-.9.9-3 0-.9-.9z" style={{ fill: "#fff", opacity: ".8" }} /></g>
    </defs></svg>
  );
}
