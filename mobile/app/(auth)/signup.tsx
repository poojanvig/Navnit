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

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert("", "Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      Alert.alert("", "Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await signup(name.trim(), email.trim().toLowerCase(), password);
      router.replace("/(main)");
    } catch (e: any) {
      Alert.alert("", e.message || "Something went wrong");
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
          <Text style={styles.title}>create account</Text>
          <Text style={styles.subtitle}>start tracking your investments</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="full name"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="words"
            />
          </View>

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
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.bg} size="small" />
            ) : (
              <Text style={styles.buttonText}>get started</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.back()} style={styles.link}>
          <Text style={styles.linkText}>
            already have an account?{"  "}
            <Text style={styles.linkBold}>sign in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: spacing.xl },
  topSection: { alignItems: "center", marginBottom: spacing.xxl },
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
  form: { gap: spacing.sm },
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
  buttonDisabled: { opacity: 0.4 },
  buttonText: {
    color: colors.bg,
    fontSize: fontSize.md,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "lowercase",
  },
  link: { marginTop: spacing.xxl, alignItems: "center" },
  linkText: { color: colors.textTertiary, fontSize: fontSize.sm, letterSpacing: 1 },
  linkBold: { color: colors.text, fontWeight: "500" },
});
