import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Image } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../lib/auth";
import { colors, fontSize, spacing } from "../lib/theme";

export default function Splash() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      if (user) {
        router.replace("/(main)");
      } else {
        router.replace("/(auth)/login");
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [user, loading]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Image
          source={require("../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.taglineRow}>
          <View style={styles.taglineDot} />
          <Text style={styles.tagline}>PORTFOLIO INTELLIGENCE</Text>
          <View style={styles.taglineDot} />
        </View>
      </Animated.View>
      <Text style={styles.footer}>NAVNIT · BUILT FOR CLARITY</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
  },
  logo: {
    width: 260,
    height: 80,
    marginBottom: spacing.md,
  },
  taglineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  taglineDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.text,
  },
  tagline: {
    fontSize: fontSize.xxs,
    color: colors.textSecondary,
    letterSpacing: 2.5,
    fontWeight: "700",
  },
  footer: {
    position: "absolute",
    bottom: 50,
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 2,
    fontWeight: "600",
  },
});
