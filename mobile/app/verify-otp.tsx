import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { verifyOTP } from "../lib/api";
import { colors, spacing, fontSize, borderRadius } from "../lib/theme";

export default function VerifyOTP() {
  const { session_id, pan } = useLocalSearchParams<{
    session_id: string;
    pan: string;
  }>();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const router = useRouter();

  const handleVerify = async () => {
    const code = otp.trim();
    if (code.length < 4) {
      Alert.alert("", "Please enter the OTP");
      return;
    }

    setLoading(true);
    setStatus("verifying otp...");
    try {
      setStatus("downloading statements...");
      const data = await verifyOTP(session_id!, code);
      setStatus("portfolio linked!");
      Alert.alert(
        "Portfolio Linked",
        `${data.investor_name}\n${data.total_value?.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}`,
        [{ text: "View Dashboard", onPress: () => router.replace("/(main)") }]
      );
    } catch (e: any) {
      Alert.alert("", e.message || "Verification failed");
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.topSection}>
          <View style={styles.iconWrap}>
            <Text style={styles.iconText}>◈</Text>
          </View>
          <Text style={styles.title}>enter otp</Text>
          <Text style={styles.subtitle}>
            sent to the mobile number{"\n"}registered with CDSL for {pan}
          </Text>
        </View>

        <View style={styles.inputWrap}>
          <TextInput
            style={styles.otpInput}
            value={otp}
            onChangeText={setOtp}
            placeholder="· · · ·"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            textAlign="center"
            onSubmitEditing={handleVerify}
          />
        </View>

        {status ? (
          <View style={styles.statusRow}>
            <ActivityIndicator color={colors.textTertiary} size="small" />
            <Text style={styles.statusText}>{status}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={colors.bg} size="small" />
          ) : (
            <Text style={styles.buttonText}>verify</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.link}
          disabled={loading}
        >
          <Text style={styles.linkText}>← go back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: spacing.xl },
  topSection: { alignItems: "center", marginBottom: spacing.xxl },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    backgroundColor: colors.surfaceGlass,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  iconText: { fontSize: 24, color: colors.textSecondary },
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
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 22,
    letterSpacing: 0.5,
  },
  inputWrap: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  otpInput: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    fontSize: fontSize.hero,
    color: colors.text,
    fontWeight: "100",
    letterSpacing: 16,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  statusText: {
    color: colors.textTertiary,
    fontSize: fontSize.sm,
    letterSpacing: 1,
  },
  button: {
    backgroundColor: colors.text,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md + 2,
    alignItems: "center",
    marginTop: spacing.xl,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: {
    color: colors.bg,
    fontSize: fontSize.md,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "lowercase",
  },
  link: { marginTop: spacing.lg, alignItems: "center" },
  linkText: {
    color: colors.textTertiary,
    fontSize: fontSize.sm,
    letterSpacing: 1,
  },
});
