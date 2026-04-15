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
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { requestOTP } from "../lib/api";
import { colors, spacing, fontSize, borderRadius } from "../lib/theme";

export default function AddPortfolio() {
  const [pan, setPan] = useState("");
  const [boId, setBoId] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!pan || !boId || !dob) {
      Alert.alert("", "Please fill in all fields");
      return;
    }
    if (pan.length !== 10) {
      Alert.alert("", "PAN must be 10 characters");
      return;
    }
    if (boId.length !== 16) {
      Alert.alert("", "BO ID must be 16 digits");
      return;
    }
    setLoading(true);
    try {
      const data = await requestOTP(pan.toUpperCase(), boId, dob);
      router.push({
        pathname: "/verify-otp",
        params: { session_id: data.session_id, pan: pan.toUpperCase() },
      });
    } catch (e: any) {
      Alert.alert("", e.message || "Failed to request OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.back}
          activeOpacity={0.7}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.heroSection}>
          <View style={styles.brandPill}>
            <View style={styles.brandDot} />
            <Text style={styles.brandPillText}>SECURE · CDSL VERIFIED</Text>
          </View>
          <Text style={styles.title}>
            Link your{"\n"}
            <Text style={styles.titleAccent}>portfolio</Text>
          </Text>
          <Text style={styles.subtitle}>
            We'll fetch your holdings directly from CDSL via a secure OTP verification
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>PAN</Text>
            <View
              style={[
                styles.inputWrap,
                focused === "pan" && styles.inputWrapFocused,
              ]}
            >
              <TextInput
                style={styles.input}
                value={pan}
                onChangeText={setPan}
                placeholder="ABCDE1234F"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                maxLength={10}
                onFocus={() => setFocused("pan")}
                onBlur={() => setFocused(null)}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CDSL BO ID</Text>
            <View
              style={[
                styles.inputWrap,
                focused === "boid" && styles.inputWrapFocused,
              ]}
            >
              <TextInput
                style={styles.input}
                value={boId}
                onChangeText={setBoId}
                placeholder="16-digit demat number"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={16}
                onFocus={() => setFocused("boid")}
                onBlur={() => setFocused(null)}
              />
            </View>
            <Text style={styles.hint}>
              Find this on your broker app under demat details
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>DATE OF BIRTH</Text>
            <View
              style={[
                styles.inputWrap,
                focused === "dob" && styles.inputWrapFocused,
              ]}
            >
              <TextInput
                style={styles.input}
                value={dob}
                onChangeText={setDob}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                onFocus={() => setFocused("dob")}
                onBlur={() => setFocused(null)}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.bg} size="small" />
                <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                  Solving captcha...
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.buttonText}>Request OTP</Text>
                <Text style={styles.buttonArrow}>→</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <View style={styles.infoAccent} />
          <View style={styles.infoHeader}>
            <Text style={styles.infoTitle}>HOW IT WORKS</Text>
          </View>
          <View style={styles.infoStep}>
            <View style={styles.stepNumWrap}>
              <Text style={styles.stepNum}>1</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Connect</Text>
              <Text style={styles.stepText}>
                We securely connect to CDSL using your details
              </Text>
            </View>
          </View>
          <View style={styles.infoStep}>
            <View style={styles.stepNumWrap}>
              <Text style={styles.stepNum}>2</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Verify</Text>
              <Text style={styles.stepText}>
                You verify with an OTP sent to your registered mobile
              </Text>
            </View>
          </View>
          <View style={styles.infoStep}>
            <View style={styles.stepNumWrap}>
              <Text style={styles.stepNum}>3</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>View</Text>
              <Text style={styles.stepText}>
                Your complete portfolio is fetched and displayed
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: {
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.xxxl,
  },
  back: { alignSelf: "flex-start", marginBottom: spacing.xl },
  backText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    letterSpacing: 0.3,
    fontWeight: "500",
  },

  heroSection: { marginBottom: spacing.xl },
  brandPill: {
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    marginBottom: spacing.md,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentBright,
  },
  brandPillText: {
    fontSize: 10,
    color: colors.accentBright,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "500",
    color: colors.text,
    letterSpacing: -0.8,
    lineHeight: 42,
  },
  titleAccent: {
    color: colors.accent,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.md,
    lineHeight: 22,
  },

  form: { gap: spacing.md },
  inputGroup: { gap: 6 },
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
    borderColor: colors.borderGlow,
    backgroundColor: colors.surfaceElevated,
  },
  input: {
    padding: spacing.md + 2,
    fontSize: fontSize.md,
    color: colors.text,
    letterSpacing: 0.8,
  },
  hint: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 4,
    marginLeft: 4,
  },
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md + 2,
    marginTop: spacing.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: colors.bg,
    fontSize: fontSize.md,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  buttonArrow: {
    color: colors.bg,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  loadingRow: { flexDirection: "row", alignItems: "center" },

  // Info card
  infoCard: {
    marginTop: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    overflow: "hidden",
  },
  infoAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.violet,
    opacity: 0.7,
  },
  infoHeader: {
    marginBottom: 4,
  },
  infoTitle: {
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1.8,
    fontWeight: "700",
  },
  infoStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  stepNumWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.violetDim,
    borderWidth: 1,
    borderColor: colors.borderViolet,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: {
    fontSize: fontSize.xs,
    color: colors.violetBright,
    fontWeight: "700",
  },
  stepTitle: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: "600",
  },
  stepText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
});
