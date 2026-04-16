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

  // Secondary accent — mid grey
  violet: "#888888",
  violetBright: "#AAAAAA",
  violetDim: "rgba(255,255,255,0.06)",
  violetDimStrong: "rgba(255,255,255,0.12)",

  // Semantic — gain = bright white, loss = muted grey
  success: "#FFFFFF",
  successBright: "#FFFFFF",
  successDim: "rgba(255,255,255,0.10)",
  error: "#999999",
  errorBright: "#777777",
  errorDim: "rgba(255,255,255,0.06)",
  warning: "#CCCCCC",
  warningDim: "rgba(255,255,255,0.08)",
  gold: "#DDDDDD",

  // Categorical palette — greyscale steps for charts
  cat1: "#FFFFFF",
  cat2: "#AAAAAA",
  cat3: "#888888",
  cat4: "#666666",
  cat5: "#444444",
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
