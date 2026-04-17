import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../lib/auth";
import { GradientButton } from "../../components/GradientButton";
import { colors, spacing, fontSize, borderRadius } from "../../lib/theme";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("", "Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace("/(main)");
    } catch (e: any) {
      Alert.alert("", e.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        <View style={styles.topSection}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.brandPill}>
            <View style={styles.brandDot} />
            <Text style={styles.brandPillText}>PORTFOLIO INTELLIGENCE</Text>
          </View>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to access your portfolio</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <View
              style={[
                styles.inputWrap,
                focused === "email" && styles.inputWrapFocused,
              ]}
            >
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                accessibilityLabel="Email address"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <View
              style={[
                styles.inputWrap,
                focused === "password" && styles.inputWrapFocused,
              ]}
            >
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                onSubmitEditing={handleLogin}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
                accessibilityLabel="Password"
              />
            </View>
          </View>

          <GradientButton
            title="Continue"
            variant="primary"
            arrow
            loading={loading}
            onPress={handleLogin}
            accessibilityLabel="Continue to sign in"
            style={{ marginTop: spacing.sm }}
          />
        </View>

        <TouchableOpacity
          onPress={() => router.push("/(auth)/signup")}
          style={styles.link}
          activeOpacity={0.7}
          accessibilityLabel="Create a new account"
          accessibilityRole="link"
        >
          <Text style={styles.linkText}>
            New here?{"  "}
            <Text style={styles.linkBold}>Create account →</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  topSection: {
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  logo: {
    width: 220,
    height: 70,
    marginBottom: spacing.lg,
  },
  brandPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: colors.brandDim,
    borderWidth: 1,
    borderColor: colors.brandBorder,
    marginBottom: spacing.lg,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand,
  },
  brandPillText: {
    fontSize: 10,
    color: colors.brandBright,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "500",
    color: colors.text,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    letterSpacing: 0.2,
  },
  form: {
    gap: spacing.md,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  inputWrap: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  inputWrapFocused: {
    borderColor: colors.brandBorder,
    backgroundColor: colors.surfaceElevated,
  },
  input: {
    padding: spacing.md + 2,
    fontSize: fontSize.md,
    color: colors.text,
    letterSpacing: 0.3,
  },
  link: {
    marginTop: spacing.xxl,
    alignItems: "center",
  },
  linkText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    letterSpacing: 0.3,
  },
  linkBold: {
    color: colors.text,
    fontWeight: "600",
  },
});
