const svgToDataUrl = (svg: string): string => {
  const encoded = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${encoded}`;
};

// ─── Inspector Avatar ────────────────────────────────────────────────────────
const INSPECTOR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
  <circle cx="22" cy="22" r="21" fill="#0070FF" stroke="white" stroke-width="2.5"/>
  <circle cx="22" cy="16" r="6" fill="white"/>
  <path d="M10 38 Q10 28 22 28 Q34 28 34 38" fill="white"/>
</svg>`;

// ─── Start point marker ──────────────────────────────────────────────────────
const START_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <circle cx="20" cy="20" r="18" fill="#00C853" stroke="white" stroke-width="2.5"/>
  <polygon points="16,13 30,20 16,27" fill="white"/>
</svg>`;

// ─── End point marker ────────────────────────────────────────────────────────
const END_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <circle cx="20" cy="20" r="18" fill="#D50000" stroke="white" stroke-width="2.5"/>
  <rect x="13" y="13" width="14" height="14" rx="2" fill="white"/>
</svg>`;

export const MAP_ICONS = {
  routine: "/images/icon_Routine.svg", // ← was inline SVG data URL
  warning: "/images/icon_Warning.svg", // ← was inline SVG data URL
  fine: "/images/icon_fine.svg", // ← was inline SVG data URL
  towing: "/images/icon_Towing.svg", // ← was inline SVG data URL
  obstacle: "/images/icon_Obstacle.svg", // ← was inline SVG data URL
  inspector: svgToDataUrl(INSPECTOR_SVG), // still inline (no file)
  start: svgToDataUrl(START_SVG), // still inline (no file)
  end: svgToDataUrl(END_SVG), // still inline (no file)
} as const;

export type MapIconKey = keyof typeof MAP_ICONS;
