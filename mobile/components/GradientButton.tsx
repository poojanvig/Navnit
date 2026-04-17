import { useRef } from "react";
import {
  Animated,
  Pressable,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
  Platform,
  ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import {
  colors,
  spacing,
  fontSize,
  borderRadius,
  gradients,
  motion,
} from "../lib/theme";

export interface GradientButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  icon?: string;
  arrow?: boolean;
  loading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  hapticStyle?: "light" | "medium";
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function GradientButton({
  title,
  onPress,
  variant = "primary",
  icon,
  arrow,
  loading = false,
  loadingText,
  disabled = false,
  hapticStyle,
  style,
  accessibilityLabel,
}: GradientButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const isPrimary = variant === "primary";
  const showArrow = arrow ?? isPrimary;
  const resolvedHaptic =
    hapticStyle ?? (isPrimary ? "medium" : "light");

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: motion.pressScale,
      duration: motion.fast,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 120,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (loading || disabled) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(
        resolvedHaptic === "medium"
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light
      );
    }
    onPress();
  };

  const textColor = isPrimary ? colors.bg : colors.text;
  const effectiveOpacity = disabled ? 0.5 : 1;

  const innerContent = (
    <View style={styles.inner}>
      {icon && !loading && (
        <Text style={[styles.icon, { color: textColor }]}>{icon}</Text>
      )}
      {loading ? (
        <>
          <ActivityIndicator size="small" color={textColor} />
          {loadingText && (
            <Text style={[styles.title, { color: textColor }]}>
              {loadingText}
            </Text>
          )}
        </>
      ) : (
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      )}
      {showArrow && !loading && (
        <Text style={[styles.arrow, { color: textColor }]}>→</Text>
      )}
    </View>
  );

  return (
    <Animated.View
      style={[{ transform: [{ scale }], opacity: effectiveOpacity }, style]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={loading || disabled}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityRole="button"
        style={styles.pressable}
      >
        {isPrimary ? (
          <LinearGradient
            colors={gradients.brand as unknown as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.surface}
          >
            {innerContent}
          </LinearGradient>
        ) : (
          <View style={[styles.surface, styles.secondarySurface]}>
            {innerContent}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: borderRadius.full,
    overflow: "hidden",
  },
  surface: {
    borderRadius: borderRadius.full,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  secondarySurface: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  icon: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  arrow: {
    fontSize: fontSize.md,
    fontWeight: "700",
  },
});
