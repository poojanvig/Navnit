export const colors = {
  // Backgrounds — layered near-black with slight cool tint
  bg: "#07080A",
  bgElevated: "#0B0D11",
  surface: "#0F1114",
  surfaceElevated: "#16181D",
  surfaceAccent: "#1C1F26",
  surfaceGlass: "rgba(255,255,255,0.03)",

  // Borders — subtle, with accent glow variants
  border: "rgba(255,255,255,0.06)",
  borderLight: "rgba(255,255,255,0.10)",
  borderStrong: "rgba(255,255,255,0.16)",
  borderGlow: "rgba(0,224,164,0.28)",
  borderViolet: "rgba(124,92,255,0.28)",

  // Text
  text: "#F5F7FA",
  textSecondary: "#9BA1AD",
  textTertiary: "#5A6070",
  textMuted: "#2F333C",

  // Primary accent — electric mint (analytical / signal color)
  accent: "#00E0A4",
  accentBright: "#26F0B8",
  accentDim: "rgba(0,224,164,0.12)",
  accentDimStrong: "rgba(0,224,164,0.22)",

  // Secondary accent — soft violet (categorical)
  violet: "#7C5CFF",
  violetBright: "#9B82FF",
  violetDim: "rgba(124,92,255,0.14)",
  violetDimStrong: "rgba(124,92,255,0.24)",

  // Semantic — market colors
  success: "#22D39A",
  successBright: "#3BE8AE",
  successDim: "rgba(34,211,154,0.14)",
  error: "#FF5A6E",
  errorBright: "#FF7A8B",
  errorDim: "rgba(255,90,110,0.14)",
  warning: "#FFB547",
  warningDim: "rgba(255,181,71,0.14)",
  gold: "#FFC857",

  // Categorical palette — for charts / allocation
  cat1: "#00E0A4", // mint
  cat2: "#7C5CFF", // violet
  cat3: "#22D3EE", // cyan
  cat4: "#FFB547", // amber
  cat5: "#FF6B9D", // pink
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const fontSize = {
  xxs: 10,
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 36,
  hero: 52,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
};

// Tabular numbers — financial data should always be monospaced-figure aligned
export const tabular = {
  fontVariant: ["tabular-nums" as const],
};

// Standard card shadow for elevated surfaces
export const cardShadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.5,
  shadowRadius: 16,
  elevation: 8,
};

export const glowShadow = (color: string) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.5,
  shadowRadius: 12,
  elevation: 6,
});
