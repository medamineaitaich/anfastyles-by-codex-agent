const swatches: Record<string, string> = {
  red: "#c85d4b",
  green: "#6f8f62",
  blue: "#5f88ad",
  gray: "#9aa1a6",
  grey: "#9aa1a6",
  black: "#1c1d1f",
  white: "#f8f7f2",
  cream: "#f3e9d9",
  beige: "#d8c0a2",
  brown: "#8b6949",
  yellow: "#dbb45c",
  orange: "#cf874f",
};

export function resolveSwatch(name: string) {
  return swatches[name.trim().toLowerCase()] ?? "#d1d5cd";
}
