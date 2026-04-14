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
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← back</Text>
        </TouchableOpacity>

        <View style={styles.heroSection}>
          <Text style={styles.title}>link your{"\n"}portfolio</Text>
          <Text style={styles.subtitle}>
            we'll fetch your holdings directly from CDSL via a secure OTP verification
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>PAN</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={pan}
                onChangeText={setPan}
                placeholder="ABCDE1234F"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                maxLength={10}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CDSL BO ID</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={boId}
                onChangeText={setBoId}
                placeholder="16-digit demat number"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={16}
              />
            </View>
            <Text style={styles.hint}>
              find this on your broker app under demat details
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>DATE OF BIRTH</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={dob}
                onChangeText={setDob}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
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
                  solving captcha...
                </Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>request otp</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>how it works</Text>
          <View style={styles.infoStep}>
            <Text style={styles.stepNum}>1</Text>
            <Text style={styles.stepText}>we securely connect to CDSL using your details</Text>
          </View>
          <View style={styles.infoStep}>
            <Text style={styles.stepNum}>2</Text>
            <Text style={styles.stepText}>you verify with an OTP sent to your registered mobile</Text>
          </View>
          <View style={styles.infoStep}>
            <Text style={styles.stepNum}>3</Text>
            <Text style={styles.stepText}>your complete portfolio is fetched and displayed</Text>
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
  backText: { color: colors.textTertiary, fontSize: fontSize.sm, letterSpacing: 1 },

  heroSection: { marginBottom: spacing.xl },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "200",
    color: colors.text,
    letterSpacing: 1,
    lineHeight: 44,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.md,
    lineHeight: 22,
    letterSpacing: 0.3,
  },

  form: { gap: spacing.md },
  inputGroup: { gap: spacing.xs },
  label: {
    fontSize: fontSize.xxs,
    color: colors.textTertiary,
    letterSpacing: 3,
    fontWeight: "500",
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
    letterSpacing: 1,
  },
  hint: {
    fontSize: fontSize.xxs,
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  button: {
    backgroundColor: colors.text,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md + 2,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: colors.bg,
    fontSize: fontSize.md,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "lowercase",
  },
  loadingRow: { flexDirection: "row", alignItems: "center" },

  infoCard: {
    marginTop: spacing.xxl,
    backgroundColor: colors.surfaceGlass,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  infoTitle: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    letterSpacing: 3,
    textTransform: "lowercase",
    marginBottom: spacing.xs,
  },
  infoStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  stepNum: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: "200",
    width: 16,
  },
  stepText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    letterSpacing: 0.3,
  },
});
