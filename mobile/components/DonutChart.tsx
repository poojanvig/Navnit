import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { colors, tabular } from "../lib/theme";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
  trackColor?: string;
  gap?: number;
}

export function DonutChart({
  segments,
  size = 180,
  strokeWidth = 16,
  centerLabel,
  centerValue,
  trackColor = colors.surfaceElevated,
  gap = 2,
}: DonutChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const gapLen = (gap / 360) * circumference;

  const positive = segments.filter((s) => s.value > 0);
  const total = positive.reduce((sum, s) => sum + s.value, 0);
  const soloSegment = positive.length === 1;

  let accumulated = 0;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <G rotation={-90} origin={`${cx}, ${cy}`}>
          {total > 0 &&
            positive.map((seg, i) => {
              const fraction = seg.value / total;
              const arcLen = fraction * circumference;
              const dashLen = soloSegment
                ? circumference
                : Math.max(0, arcLen - gapLen);
              const offset = -accumulated;
              accumulated += arcLen;
              return (
                <G key={i}>
                  <Circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    stroke={seg.color}
                    strokeWidth={strokeWidth + 4}
                    strokeDasharray={`${dashLen} ${circumference}`}
                    strokeDashoffset={offset}
                    strokeLinecap="butt"
                    fill="none"
                    opacity={0.18}
                  />
                  <Circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    stroke={seg.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${dashLen} ${circumference}`}
                    strokeDashoffset={offset}
                    strokeLinecap="butt"
                    fill="none"
                  />
                </G>
              );
            })}
        </G>
      </Svg>
      {(centerLabel || centerValue) && (
        <View style={[styles.centerWrap, { width: size, height: size }]}>
          {centerLabel && <Text style={styles.label}>{centerLabel}</Text>}
          {centerValue && <Text style={styles.value}>{centerValue}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centerWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 1.8,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  value: {
    fontSize: 22,
    color: colors.text,
    fontWeight: "500",
    letterSpacing: -0.5,
    ...tabular,
  },
});
