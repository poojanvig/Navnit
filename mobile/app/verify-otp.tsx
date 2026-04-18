import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { verifyOTP } from "../lib/api";
import { GradientButton } from "../components/GradientButton";
import {
  colors,
  spacing,
  fontSize,
  borderRadius,
  tabular,
} from "../lib/theme";

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
      const data = await verifyOTP(session_id!, code, pan!);
      setStatus("portfolio linked!");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
          <View style={styles.brandPill}>
            <View style={styles.brandDot} />
            <Text style={styles.brandPillText}>OTP SENT</Text>
          </View>
          <Text style={styles.title}>Enter OTP</Text>
          <Text style={styles.subtitle}>
            Sent to the mobile number registered{"\n"}with CDSL for{" "}
            <Text style={styles.panText}>{pan}</Text>
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
            accessibilityLabel="OTP code"
          />
        </View>

        {status ? (
          <View style={styles.statusRow}>
            <ActivityIndicator color={colors.text} size="small" />
            <Text style={styles.statusText}>{status}</Text>
          </View>
        ) : null}

        <GradientButton
          title="Verify"
          variant="primary"
          arrow
          loading={loading}
          onPress={handleVerify}
          accessibilityLabel="Verify OTP"
          style={{ marginTop: spacing.xl }}
        />

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.link}
          disabled={loading}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
          accessibilityRole="link"
        >
          <Text style={styles.linkText}>← Go back</Text>
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
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: colors.brandBorder,
    backgroundColor: colors.brandDim,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  iconText: { fontSize: 28, color: colors.brandBright },
  brandPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: colors.brandDim,
    borderWidth: 1,
    borderColor: colors.brandBorder,
    marginBottom: spacing.md,
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
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  panText: {
    color: colors.text,
    fontWeight: "600",
    ...tabular,
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
    fontWeight: "300",
    letterSpacing: 16,
    ...tabular,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  statusText: {
    color: colors.text,
    fontSize: fontSize.sm,
    letterSpacing: 0.5,
    fontWeight: "500",
  },
  link: { marginTop: spacing.lg, alignItems: "center" },
  linkText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    letterSpacing: 0.3,
  },
});
