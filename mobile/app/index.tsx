import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
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
        <View style={styles.logoWrap}>
          <Text style={styles.logoLetter}>N</Text>
        </View>
        <Text style={styles.name}>navnit</Text>
        <Text style={styles.tagline}>your wealth, unified</Text>
      </Animated.View>
      <Text style={styles.footer}>built for clarity</Text>
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
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceGlass,
  },
  logoLetter: {
    fontSize: 40,
    fontWeight: "100",
    color: colors.text,
    letterSpacing: 4,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: "200",
    color: colors.text,
    letterSpacing: 10,
    marginTop: spacing.lg,
    textTransform: "lowercase",
  },
  tagline: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.sm,
    letterSpacing: 4,
    textTransform: "lowercase",
  },
  footer: {
    position: "absolute",
    bottom: 50,
    fontSize: fontSize.xxs,
    color: colors.textMuted,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
});

