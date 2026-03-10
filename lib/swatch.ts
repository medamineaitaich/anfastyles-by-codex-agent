const swatches: Record<string, string> = {
  red: "#c7483b",
  green: "#4f8a57",
  blue: "#4a73b8",
  yellow: "#e0ba3f",
  orange: "#db8a3f",
  pink: "#d985b8",
  purple: "#8a66c9",
  black: "#1c1d1f",
  white: "#f8f7f2",
  gray: "#9aa1a6",
  grey: "#9aa1a6",
  brown: "#7a5a3c",
  beige: "#d8c0a2",
  cream: "#f3e9d9",
  ivory: "#f4f0df",
  tan: "#c8a57a",
  navy: "#223a6b",
  "light-blue": "#84add8",
  "dark-blue": "#2f4f7f",
  "light-green": "#89b78a",
  "dark-green": "#3f6a48",
  "off-white": "#f2efe4",
};

const COLOR_TOKENS = Object.keys(swatches).sort((left, right) => right.length - left.length);
const NEUTRAL_SWATCH = "#d1d5cd";

function normalizeSwatchLabel(value: string) {
  return value.trim().toLowerCase().replace(/[_\s]+/g, "-");
}

export function resolveSwatch(name: string) {
  const normalized = normalizeSwatchLabel(name);

  if (swatches[normalized]) {
    return swatches[normalized];
  }

  const tokens = normalized.split(/[-/]/).filter(Boolean);
  const exactToken = tokens.find((token) => swatches[token]);
  if (exactToken) {
    return swatches[exactToken];
  }

  const fuzzy = COLOR_TOKENS.find((token) => normalized.includes(token));
  return fuzzy ? swatches[fuzzy] : NEUTRAL_SWATCH;
}
