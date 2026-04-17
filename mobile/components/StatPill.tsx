import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { colors, borderRadius, tabular } from "../lib/theme";

export interface StatPillProps {
  pct: number;
  trend?: "up" | "down" | "auto";
  size?: "sm" | "md";
  showIcon?: boolean;
  style?: ViewStyle;
}

export function StatPill({
  pct,
  trend = "auto",
  size = "md",
  showIcon = true,
  style,
}: StatPillProps) {
  const isUp =
    trend === "up" || (trend === "auto" && pct >= 0);
  const bg = isUp ? colors.successDim : colors.errorDim;
  const fg = isUp ? colors.successBright : colors.errorBright;
  const icon = isUp ? "▲" : "▼";
  const textStyle = size === "sm" ? styles.textSm : styles.textMd;

  return (
    <View style={[styles.pill, { backgroundColor: bg }, style]}>
      <Text style={[textStyle, { color: fg }]}>
        {showIcon ? `${icon} ` : ""}
        {Math.abs(pct).toFixed(2)}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    alignSelf: "flex-start",
  },
  textSm: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
    ...tabular,
  },
  textMd: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
    ...tabular,
  },
});
