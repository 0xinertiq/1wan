// Painted banner backdrops: prototype crops from the original concept images (public/kumo/*.webp, listed in
// docs/kumo-redesign/MISSING_ART.md). The concept art has mock UI painted in; every such spot has a box here,
// in crop pixels, and the page puts a real live overlay (greeting, chips, date, Luna's line) exactly on it.
// The art is drawn "cover", anchored to the top so the skyline stays, with a horizontal focus point.

export type Box = [x: number, y: number, w: number, h: number];
export type Crop = { file: string; w: number; h: number; fx: number; boxes: Record<string, Box> };

export const OBS_BANNER: { desktop: Crop; mobile: Crop } = {
  // Concept image 24, x 124-1250, y 0-216: night library, telescope, moon, floating castle, pixel fox.
  desktop: { file: "/kumo/obs-banner-desktop.webp", w: 1126, h: 216, fx: 0, boxes: { title: [9, 69, 307, 82], bubble: [491, 132, 115, 59] } },
  mobile: { file: "/kumo/obs-banner-mobile.webp", w: 530, h: 216, fx: 0.4, boxes: { bubble: [135, 132, 115, 59] } },
};

function Art({ crop, cls, fill, extra }: { crop: Crop; cls: string; fill: Record<string, React.ReactNode>; extra?: React.ReactNode }) {
  const style = { "--r": crop.w / crop.h, "--fx": crop.fx } as React.CSSProperties;
  return (
    <div className={"pb " + cls}>
      <div className="pb-art" style={style}>
        <img src={crop.file} alt="" width={crop.w} height={crop.h} decoding="async" />
        {extra}
        {Object.entries(crop.boxes).map(([id, [x, y, w, h]]) => (
          <div key={id} className={"pb-box pb-" + id} style={{ left: (x / crop.w) * 100 + "%", top: (y / crop.h) * 100 + "%", width: (w / crop.w) * 100 + "%", height: (h / crop.h) * 100 + "%" }}>
            {fill[id] ?? null}
          </div>
        ))}
      </div>
    </div>
  );
}

// Desktop and phone crops both render; CSS shows one. Petals and a slow cloud drift sit on top (they stop
// under reduced motion). The "Prototype art" label stays until final art replaces the crop.
// extra(which) draws more layers in crop coordinates (code-drawn additions, night stars), under the boxes.
export function PaintedBanner({ set, fill, fillMobile, label, className, extra, children }: {
  set: { desktop: Crop; mobile: Crop }; fill: Record<string, React.ReactNode>; fillMobile?: Record<string, React.ReactNode>; label: string; className?: string;
  extra?: (which: "d" | "m") => React.ReactNode; children?: React.ReactNode;
}) {
  return (
    <section className={"pbanner " + (className ?? "")} aria-label={label}>
      <Art crop={set.desktop} cls="pb-d" fill={fill} extra={extra?.("d")} />
      <Art crop={set.mobile} cls="pb-m" fill={fillMobile ?? fill} extra={extra?.("m")} />
      <div className="pb-fx" aria-hidden="true">
        <i className="pb-cloud" /><i className="pb-cloud c2" />
        {Array.from({ length: 7 }, (_, i) => <i key={i} className={"pb-petal p" + i} />)}
      </div>
      <span className="pb-tag">Prototype art</span>
      {children}
    </section>
  );
}
