import { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, ViewStyle } from "react-native";
import { colors, borderRadius } from "../lib/theme";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

function SkeletonBlock({
  width = "100%",
  height = 16,
  radius = borderRadius.sm,
  style,
}: SkeletonProps) {
  const shimmer = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: radius,
          backgroundColor: colors.surfaceAccent,
          opacity: shimmer,
        },
        style,
      ]}
    />
  );
}

/** Dashboard-shaped skeleton loader */
export function DashboardSkeleton() {
  return (
    <View style={styles.container}>
      {/* Hero card */}
      <View style={styles.heroCard}>
        <SkeletonBlock width={120} height={12} />
        <SkeletonBlock width="70%" height={40} style={{ marginTop: 12 }} />
        <SkeletonBlock width={100} height={20} radius={10} style={{ marginTop: 16 }} />
        <View style={styles.divider} />
        <View style={styles.row}>
          <SkeletonBlock width={80} height={12} />
          <SkeletonBlock width={80} height={12} />
        </View>
      </View>

      {/* Allocation */}
      <SkeletonBlock width={120} height={12} style={{ marginTop: 24 }} />
      <SkeletonBlock height={8} radius={4} style={{ marginTop: 8 }} />
      <View style={[styles.row, { marginTop: 8, gap: 8 }]}>
        <View style={styles.allocCard}>
          <SkeletonBlock width={60} height={10} />
          <SkeletonBlock width="80%" height={20} style={{ marginTop: 8 }} />
        </View>
        <View style={styles.allocCard}>
          <SkeletonBlock width={60} height={10} />
          <SkeletonBlock width="80%" height={20} style={{ marginTop: 8 }} />
        </View>
      </View>

      {/* Holdings */}
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.holdingCard}>
          <View style={{ flex: 1 }}>
            <SkeletonBlock width="70%" height={14} />
            <SkeletonBlock width={40} height={10} style={{ marginTop: 6 }} />
          </View>
          <SkeletonBlock width={80} height={16} />
        </View>
      ))}
    </View>
  );
}

/** Holdings-shaped skeleton loader */
export function HoldingsSkeleton() {
  return (
    <View style={styles.container}>
      <SkeletonBlock width={100} height={28} />
      <SkeletonBlock width={180} height={12} style={{ marginTop: 6 }} />
      <View style={[styles.row, { marginTop: 24, gap: 8 }]}>
        <SkeletonBlock height={44} radius={22} style={{ flex: 1 }} />
        <SkeletonBlock height={44} radius={22} style={{ flex: 1 }} />
      </View>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={[styles.holdingCard, { height: 120 }]}>
          <View style={{ flex: 1, gap: 8 }}>
            <SkeletonBlock width="80%" height={14} />
            <SkeletonBlock width={40} height={10} />
            <View style={[styles.row, { marginTop: 8 }]}>
              <SkeletonBlock width={60} height={10} />
              <SkeletonBlock width={60} height={10} />
              <SkeletonBlock width={60} height={10} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  allocCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  holdingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
