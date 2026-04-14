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
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../lib/auth";
import { colors, spacing, fontSize, borderRadius } from "../../lib/theme";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
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
        {/* Top section */}
        <View style={styles.topSection}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoLetter}>N</Text>
          </View>
          <Text style={styles.title}>welcome back</Text>
          <Text style={styles.subtitle}>sign in to continue</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="email address"
              placeholderTextColor={colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="password"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              onSubmitEditing={handleLogin}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.bg} size="small" />
            ) : (
              <Text style={styles.buttonText}>continue</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <TouchableOpacity
          onPress={() => router.push("/(auth)/signup")}
          style={styles.link}
        >
          <Text style={styles.linkText}>
            new here?{"  "}
            <Text style={styles.linkBold}>create account</Text>
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
  logoWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceGlass,
    marginBottom: spacing.lg,
  },
  logoLetter: {
    fontSize: 28,
    fontWeight: "100",
    color: colors.text,
    letterSpacing: 2,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "200",
    color: colors.text,
    letterSpacing: 2,
    textTransform: "lowercase",
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.sm,
    letterSpacing: 2,
  },
  form: {
    gap: spacing.sm,
  },
  inputWrap: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  input: {
    padding: spacing.md + 2,
    fontSize: fontSize.md,
    color: colors.text,
    letterSpacing: 0.5,
  },
  button: {
    backgroundColor: colors.text,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md + 2,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: colors.bg,
    fontSize: fontSize.md,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "lowercase",
  },
  link: {
    marginTop: spacing.xxl,
    alignItems: "center",
  },
  linkText: {
    color: colors.textTertiary,
    fontSize: fontSize.sm,
    letterSpacing: 1,
  },
  linkBold: {
    color: colors.text,
    fontWeight: "500",
  },
});
