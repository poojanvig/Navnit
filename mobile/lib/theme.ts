import { TextStyle } from "react-native";

export const colors = {
  // Backgrounds — pure black for OLED, layered greys
  bg: "#000000",
  bgElevated: "#0A0A0A",
  surface: "#111111",
  surfaceElevated: "#1A1A1A",
  surfaceAccent: "#222222",
  surfaceGlass: "rgba(255,255,255,0.03)",

  // Borders — white alphas
  border: "rgba(255,255,255,0.06)",
  borderLight: "rgba(255,255,255,0.10)",
  borderStrong: "rgba(255,255,255,0.16)",
  borderGlow: "rgba(255,255,255,0.22)",
  borderViolet: "rgba(255,255,255,0.14)",

  // Text
  text: "#FFFFFF",
  textSecondary: "#A0A0A0",
  textTertiary: "#606060",
  textMuted: "#303030",

  // Primary accent — pure white
  accent: "#FFFFFF",
  accentBright: "#FFFFFF",
  accentDim: "rgba(255,255,255,0.08)",
  accentDimStrong: "rgba(255,255,255,0.16)",

  // Brand — premium amber/gold (primary CTA + data accents)
  brand: "#F5B849",
  brandBright: "#FFD074",
  brandDim: "rgba(245,184,73,0.14)",
  brandDimStrong: "rgba(245,184,73,0.24)",
  brandBorder: "rgba(245,184,73,0.34)",

  // Secondary accent — mid grey (kept for legacy call-sites)
  violet: "#888888",
  violetBright: "#AAAAAA",
  violetDim: "rgba(255,255,255,0.06)",
  violetDimStrong: "rgba(255,255,255,0.12)",

  // Semantic — muted green/red for OLED dark mode
  success: "#4ADE80",
  successBright: "#86EFAC",
  successDim: "rgba(74,222,128,0.14)",
  error: "#F87171",
  errorBright: "#FCA5A5",
  errorDim: "rgba(248,113,113,0.14)",
  warning: "#FBBF24",
  warningDim: "rgba(251,191,36,0.14)",
  gold: "#F5C76E",

  // Categorical palette — vivid colors for holdings / charts
  cat1: "#60A5FA", // blue
  cat2: "#A78BFA", // violet
  cat3: "#F472B6", // pink
  cat4: "#FBBF24", // amber
  cat5: "#34D399", // teal
};

// Gradient stop arrays — pass directly to LinearGradient `colors` prop
export const gradients = {
  hero: ["#1A140A", "#120C04", "#050302"] as const,
  heroAccent: ["rgba(245,184,73,0.22)", "rgba(245,184,73,0.00)"] as const,
  brand: ["#FFD074", "#C8881F"] as const,
  brandSoft: ["rgba(245,184,73,0.20)", "rgba(245,184,73,0.04)"] as const,
  gain: ["#4ADE80", "#22C55E"] as const,
  loss: ["#F87171", "#DC2626"] as const,
};

// Motion tokens — animation durations + press-scale target
export const motion = {
  fast: 150,
  base: 220,
  slow: 320,
  pressScale: 0.97,
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

// Typography scale — use these for consistent text styles
export const typography = {
  displayLg: {
    fontSize: fontSize.hero,
    fontWeight: "300",
    letterSpacing: -1.5,
    color: colors.text,
  } as TextStyle,
  h1: {
    fontSize: fontSize.xxl,
    fontWeight: "500",
    letterSpacing: -0.8,
    color: colors.text,
  } as TextStyle,
  h2: {
    fontSize: fontSize.xl,
    fontWeight: "400",
    letterSpacing: -0.5,
    color: colors.text,
  } as TextStyle,
  body: {
    fontSize: fontSize.sm,
    fontWeight: "400",
    letterSpacing: 0.2,
    lineHeight: 20,
    color: colors.textSecondary,
  } as TextStyle,
  caption: {
    fontSize: fontSize.xs,
    fontWeight: "500",
    letterSpacing: 0.3,
    color: colors.textTertiary,
  } as TextStyle,
  label: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: colors.textSecondary,
  } as TextStyle,
};

// Standard card shadow for elevated surfaces (with inner highlight)
export const cardShadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.6,
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
