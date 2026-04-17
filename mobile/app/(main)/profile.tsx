import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../lib/auth";
import {
  colors,
  spacing,
  fontSize,
  borderRadius,
  cardShadow,
} from "../../lib/theme";

export default function Profile() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const initial = user?.name?.[0]?.toUpperCase() || "?";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>Profile</Text>

      {/* Avatar card */}
      <View style={styles.avatarCard}>
        <View style={styles.avatarAccentStrip} />
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedTick}>✓</Text>
          </View>
        </View>
        <Text style={styles.name}>{user?.name || "Unknown"}</Text>
        <Text style={styles.email}>{user?.email || ""}</Text>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>VERIFIED ACCOUNT</Text>
        </View>
      </View>

      {/* Menu */}
      <Text style={styles.sectionLabel}>Account</Text>
      <View style={styles.menu}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.selectionAsync();
            router.push("/add-portfolio");
          }}
          activeOpacity={0.7}
          accessibilityLabel="Link new portfolio"
          accessibilityRole="button"
        >
          <View style={styles.menuLeft}>
            <View style={[styles.menuIcon, { backgroundColor: colors.brandDim }]}>
              <Text style={[styles.menuIconText, { color: colors.brandBright }]}>+</Text>
            </View>
            <View>
              <Text style={styles.menuText}>Link New Portfolio</Text>
              <Text style={styles.menuSub}>Connect another demat account</Text>
            </View>
          </View>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          accessibilityLabel="Security settings"
          accessibilityRole="button"
        >
          <View style={styles.menuLeft}>
            <View style={[styles.menuIcon, { backgroundColor: colors.accentDim }]}>
              <Text style={[styles.menuIconText, { color: colors.text }]}>◈</Text>
            </View>
            <View>
              <Text style={styles.menuText}>Security</Text>
              <Text style={styles.menuSub}>Password, 2FA, sessions</Text>
            </View>
          </View>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          accessibilityLabel="Help and support"
          accessibilityRole="button"
        >
          <View style={styles.menuLeft}>
            <View
              style={[styles.menuIcon, { backgroundColor: colors.warningDim }]}
            >
              <Text style={[styles.menuIconText, { color: colors.warning }]}>?</Text>
            </View>
            <View>
              <Text style={styles.menuText}>Help & Support</Text>
              <Text style={styles.menuSub}>FAQs, contact us</Text>
            </View>
          </View>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
        activeOpacity={0.7}
        accessibilityLabel="Logout"
        accessibilityRole="button"
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <Image
          source={require("../../assets/logo.png")}
          style={styles.footerLogo}
          resizeMode="contain"
        />
        <Text style={styles.footerVersion}>NAVNIT INSURANCE BROKING PVT. LTD.</Text>
        <Text style={styles.footerVersionSub}>v1.0.0 · MVP BUILD</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },
  pageTitle: {
    fontSize: fontSize.xl,
    fontWeight: "500",
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: spacing.lg,
  },

  // Avatar card
  avatarCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: "hidden",
    ...cardShadow,
  },
  avatarAccentStrip: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.brand,
    opacity: 0.6,
  },
  avatarRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 1.5,
    borderColor: colors.brandBorder,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brandDim,
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "300",
    color: colors.text,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.brand,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedTick: {
    color: colors.bg,
    fontSize: 11,
    fontWeight: "800",
  },
  name: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.text,
    marginTop: spacing.md,
    letterSpacing: -0.3,
  },
  email: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: colors.brandDim,
    borderWidth: 1,
    borderColor: colors.brandBorder,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand,
  },
  statusText: {
    fontSize: 10,
    color: colors.brandBright,
    fontWeight: "700",
    letterSpacing: 1.2,
  },

  // Section label
  sectionLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    fontWeight: "600",
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },

  // Menu
  menu: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    minHeight: 48,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuIconText: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  menuText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: "600",
  },
  menuSub: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },
  menuArrow: {
    fontSize: fontSize.md,
    color: colors.textTertiary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.md + 40 + spacing.md,
  },

  // Logout
  logoutBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  logoutText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  // Footer
  footer: {
    alignItems: "center",
    marginTop: spacing.xxl,
    gap: 6,
  },
  footerLogo: {
    width: 160,
    height: 48,
    opacity: 0.5,
    marginBottom: spacing.sm,
  },
  footerVersion: {
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 1.5,
    fontWeight: "600",
  },
  footerVersionSub: {
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 1.5,
    fontWeight: "600",
  },
});
