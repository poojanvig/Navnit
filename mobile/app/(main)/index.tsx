import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
  Image,
  Animated,
  Easing,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { getPortfolios, getPortfolio } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { fmtINR, fmtINRFull } from "../../lib/format";
import { DashboardSkeleton } from "../../components/Skeleton";
import { StatPill } from "../../components/StatPill";
import { DonutChart } from "../../components/DonutChart";
import { GradientButton } from "../../components/GradientButton";
import {
  HoldingDetailSheet,
  HoldingDetail,
} from "../../components/HoldingDetailSheet";
import {
  colors,
  spacing,
  fontSize,
  borderRadius,
  tabular,
  cardShadow,
  gradients,
  motion,
} from "../../lib/theme";

// Allocation chart colors — scoped to this section so each segment reads distinctly.
// Gold + copper is a classic warm-metal pairing; both stay in the premium theme family.
const ALLOC_MF = "#F5B849";
const ALLOC_MF_DIM = "rgba(245,184,73,0.14)";
const ALLOC_DEMAT = "#E08E5A";
const ALLOC_DEMAT_DIM = "rgba(224,142,90,0.14)";

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [, setPortfolios] = useState<any[]>([]);
  const [activeData, setActiveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailHolding, setDetailHolding] = useState<HoldingDetail | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  const countAnim = useRef(new Animated.Value(0)).current;
  const [countValue, setCountValue] = useState(0);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const sub = countAnim.addListener(({ value }) => setCountValue(value));
    return () => countAnim.removeListener(sub);
  }, [countAnim]);

  useEffect(() => {
    if (!loading && activeData && !hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
      const target = activeData?.summary?.total_value || 0;
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: motion.slow,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: motion.slow,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(countAnim, {
          toValue: target,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [loading, activeData, fadeAnim, slideAnim, countAnim]);

  const load = async () => {
    try {
      const list = await getPortfolios();
      setPortfolios(list);
      if (list.length > 0) {
        const data = await getPortfolio(list[0].id);
        setActiveData(data);
      }
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const onRefresh = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.content}>
          <View style={styles.topBar}>
            <Image
              source={require("../../assets/logo.png")}
              style={styles.brandLogo}
              resizeMode="contain"
            />
          </View>
          <DashboardSkeleton />
        </View>
      </View>
    );
  }

  const summary = activeData?.summary;
  const accounts = summary?.accounts || {};
  const investor = activeData?.investor;
  const demat = activeData?.demat_accounts || [];
  const mf = activeData?.mutual_funds || [];

  let totalCost = 0;
  let totalVal = 0;
  const schemes: any[] = [];
  mf.forEach((folio: any) => {
    folio.schemes?.forEach((s: any) => {
      schemes.push({ ...s, amc: folio.amc });
      totalCost += s.cost || 0;
      totalVal += s.value || 0;
    });
  });
  const totalGain = totalVal - totalCost;
  const gainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  const totalPortfolio = summary?.total_value || 0;

  const mfValue = accounts.mutual_funds?.total_value || 0;
  const dematValue = accounts.demat?.total_value || 0;
  const mfPct = totalPortfolio > 0 ? (mfValue / totalPortfolio) * 100 : 0;
  const dematPct = totalPortfolio > 0 ? (dematValue / totalPortfolio) * 100 : 0;

  const allHoldings: any[] = [];
  schemes.forEach((s) => {
    const name = s.name?.includes(" - ") ? s.name.split(" - ").pop() : s.name;
    allHoldings.push({
      name: name?.replace(/^.*?-\s*/, ""),
      sub: s.amc,
      value: s.value || 0,
      gain: s.gain?.absolute || 0,
      gainPct: s.gain?.percentage || 0,
      type: "MF",
      units: s.units,
      nav: s.nav,
      cost: s.cost,
      transactions: s.transactions,
    });
  });
  demat.forEach((acct: any) => {
    const holdings = acct.holdings || {};
    const allSec = [
      ...(holdings.equities || []),
      ...(holdings.demat_mutual_funds || []),
      ...(holdings.corporate_bonds || []),
    ];
    allSec.forEach((sec: any) => {
      if ((sec.value || 0) > 0) {
        const secName = sec.name?.includes("#") ? sec.name.split("#").pop() : sec.name;
        allHoldings.push({
          name: secName,
          sub: acct.dp_name?.replace(" PRIVATE LIMITED", ""),
          value: sec.value || 0,
          gain: 0,
          gainPct: 0,
          type: "EQ",
          units: sec.units,
          transactions: sec.transactions,
        });
      }
    });
  });
  allHoldings.sort((a, b) => b.value - a.value);

  const openHoldingDetail = (h: any) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setDetailHolding({
      name: h.name,
      sub: h.sub,
      type: h.type,
      value: h.value,
      units: h.units,
      nav: h.nav,
      cost: h.cost,
      gainAbs: h.type === "MF" ? h.gain : undefined,
      gainPct: h.type === "MF" ? h.gainPct : undefined,
      transactions: h.transactions,
    });
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.text}
          colors={["#FFFFFF"]}
          progressBackgroundColor="#111111"
        />
      }
    >
      {/* Top bar */}
      <View style={styles.topBar}>
        <Image
          source={require("../../assets/logo.png")}
          style={styles.brandLogo}
          resizeMode="contain"
        />
      </View>

      {!activeData ? (
        <View style={styles.emptyWrap}>
          <View style={styles.header}>
            <Text style={styles.greeting}>
              Hello, {user?.name?.split(" ")[0] || "there"}
            </Text>
            <Text style={styles.date}>
              {now.toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </Text>
          </View>
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Text style={styles.emptyIcon}>◎</Text>
            </View>
            <Text style={styles.emptyTitle}>No portfolio linked</Text>
            <Text style={styles.emptySubtitle}>
              Connect your investment accounts to see all your holdings in one place
            </Text>
            <GradientButton
              title="Link Portfolio"
              variant="primary"
              arrow
              hapticStyle="medium"
              onPress={() => router.push("/add-portfolio")}
              accessibilityLabel="Link your portfolio"
              style={{ marginTop: spacing.xl, alignSelf: "stretch" }}
            />
          </View>
        </View>
      ) : (
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.greeting}>
              Hello, {user?.name?.split(" ")[0]}
            </Text>
            <Text style={styles.date}>
              {now.toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </Text>
          </View>

          {/* Hero Card — Total Portfolio */}
          <LinearGradient
            colors={gradients.hero as unknown as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <LinearGradient
              colors={
                gradients.heroAccent as unknown as [string, string, ...string[]]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGlow}
              pointerEvents="none"
            />
            <View style={styles.heroInnerHighlight} />
            <View style={styles.heroTop}>
              <Text style={styles.heroLabel}>Total Portfolio Value</Text>
              <Text style={styles.heroTimestamp}>AS OF {timeStr}</Text>
            </View>
            <Text style={styles.heroAmount}>{fmtINRFull(countValue)}</Text>

            {totalCost > 0 && (
              <View style={styles.heroPillRow}>
                <StatPill pct={gainPct} size="md" />
                <Text
                  style={[
                    styles.heroGainAbs,
                    { color: totalGain >= 0 ? colors.successBright : colors.errorBright },
                  ]}
                >
                  {totalGain >= 0 ? "+" : ""}
                  {fmtINR(totalGain)}
                </Text>
                <Text style={styles.heroGainSub}>all-time</Text>
              </View>
            )}

            <View style={styles.heroDivider} />
            <View style={styles.heroBottom}>
              <View style={styles.heroMeta}>
                <Text style={styles.heroMetaLabel}>INVESTOR</Text>
                <Text style={styles.heroMetaValue}>
                  {investor?.name
                    ?.split(" ")
                    .map((w: string) => w[0]?.toUpperCase() + w.slice(1).toLowerCase())
                    .join(" ")}
                </Text>
              </View>
              <View style={[styles.heroMeta, { alignItems: "flex-end" }]}>
                <Text style={styles.heroMetaLabel}>PAN</Text>
                <Text style={styles.heroMetaValue}>{investor?.pan}</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Allocation — donut + legend */}
          <View style={styles.allocSection}>
            <View style={styles.allocHeader}>
              <Text style={styles.sectionLabel}>Asset Allocation</Text>
            </View>
            <View style={styles.donutWrap}>
              <DonutChart
                size={192}
                strokeWidth={18}
                segments={[
                  {
                    label: "Mutual Funds",
                    value: mfValue,
                    color: ALLOC_MF,
                  },
                  {
                    label: "Stock Investments",
                    value: dematValue,
                    color: ALLOC_DEMAT,
                  },
                ]}
                centerLabel="TOTAL"
                centerValue={fmtINR(totalPortfolio)}
              />
            </View>
            <View style={styles.row}>
              <View style={styles.allocCard}>
                <View style={styles.allocCardHeader}>
                  <View style={[styles.dot, { backgroundColor: ALLOC_MF }]} />
                  <Text style={styles.allocLabel}>Mutual Funds</Text>
                </View>
                <Text style={styles.allocValue}>{fmtINR(mfValue)}</Text>
                <View style={styles.allocMetaRow}>
                  <Text style={styles.allocSub}>
                    {accounts.mutual_funds?.count || 0}{" "}
                    {(accounts.mutual_funds?.count || 0) === 1 ? "folio" : "folios"}
                  </Text>
                  <View
                    style={[
                      styles.allocPctPill,
                      { backgroundColor: ALLOC_MF_DIM },
                    ]}
                  >
                    <Text style={[styles.allocPctText, { color: ALLOC_MF }]}>
                      {mfPct.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.allocCard}>
                <View style={styles.allocCardHeader}>
                  <View
                    style={[styles.dot, { backgroundColor: ALLOC_DEMAT }]}
                  />
                  <Text style={styles.allocLabel}>Stock Investments</Text>
                </View>
                <Text style={styles.allocValue}>{fmtINR(dematValue)}</Text>
                <View style={styles.allocMetaRow}>
                  <Text style={styles.allocSub}>
                    {accounts.demat?.count || 0}{" "}
                    {(accounts.demat?.count || 0) === 1 ? "account" : "accounts"}
                  </Text>
                  <View
                    style={[
                      styles.allocPctPill,
                      { backgroundColor: ALLOC_DEMAT_DIM },
                    ]}
                  >
                    <Text
                      style={[styles.allocPctText, { color: ALLOC_DEMAT }]}
                    >
                      {dematPct.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* P&L Card */}
          {totalCost > 0 && (
            <View style={styles.plCard}>
              <View style={styles.plCardHeader}>
                <Text style={styles.sectionLabel}>Mutual Fund P&L</Text>
                <StatPill pct={gainPct} size="md" />
              </View>
              <View style={styles.plGrid}>
                <View style={styles.plItem}>
                  <Text style={styles.plLabel}>INVESTED</Text>
                  <Text style={styles.plValue}>{fmtINR(totalCost)}</Text>
                </View>
                <View style={[styles.plItem, styles.plItemCenter]}>
                  <Text style={styles.plLabel}>CURRENT</Text>
                  <Text style={styles.plValue}>{fmtINR(totalVal)}</Text>
                </View>
                <View style={[styles.plItem, { alignItems: "flex-end" }]}>
                  <Text style={styles.plLabel}>RETURNS</Text>
                  <Text
                    style={[
                      styles.plValue,
                      { color: totalGain >= 0 ? colors.successBright : colors.errorBright },
                    ]}
                  >
                    {totalGain >= 0 ? "+" : ""}
                    {fmtINR(totalGain)}
                  </Text>
                </View>
              </View>
              <View style={styles.plBarWrap}>
                <View
                  style={[
                    styles.plBar,
                    {
                      width: `${Math.min(100, Math.max(5, (totalVal / totalCost) * 100))}%`,
                      backgroundColor:
                        totalGain >= 0 ? colors.success : colors.error,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Holdings */}
          {allHoldings.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>Top Holdings</Text>
                <TouchableOpacity
                  onPress={() => router.push("/(main)/holdings")}
                  activeOpacity={0.7}
                  accessibilityLabel="See all holdings"
                  accessibilityRole="button"
                >
                  <Text style={styles.seeAll}>See all →</Text>
                </TouchableOpacity>
              </View>
              {allHoldings.slice(0, 5).map((h, i) => {
                const pct =
                  totalPortfolio > 0 ? (h.value / totalPortfolio) * 100 : 0;
                const isMF = h.type === "MF";
                const accentColor = isMF ? colors.brand : colors.brandBright;
                return (
                  <TouchableOpacity
                    key={i}
                    style={styles.holdingCard}
                    activeOpacity={0.7}
                    onPress={() => openHoldingDetail(h)}
                    accessibilityLabel={`View ${h.name} details`}
                    accessibilityRole="button"
                  >
                    <View
                      style={[
                        styles.holdingAccent,
                        { backgroundColor: accentColor },
                      ]}
                    />
                    <View style={styles.holdingContent}>
                      <View style={styles.holdingTop}>
                        <View style={{ flex: 1, paddingRight: spacing.sm }}>
                          <Text style={styles.holdingName} numberOfLines={1}>
                            {h.name}
                          </Text>
                          <View style={styles.holdingSubRow}>
                            <View
                              style={[
                                styles.typeChip,
                                {
                                  backgroundColor: colors.brandDim,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.typeChipText,
                                  { color: colors.brandBright },
                                ]}
                              >
                                {h.type}
                              </Text>
                            </View>
                            <Text style={styles.holdingSub} numberOfLines={1}>
                              {h.sub}
                            </Text>
                          </View>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={styles.holdingValue}>{fmtINR(h.value)}</Text>
                          {h.gain !== 0 && (
                            <Text
                              style={[
                                styles.holdingGain,
                                {
                                  color:
                                    h.gain >= 0
                                      ? colors.successBright
                                      : colors.errorBright,
                                },
                              ]}
                            >
                              {h.gain >= 0 ? "+" : ""}
                              {fmtINR(h.gain)}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.holdingBarWrap}>
                        <View style={styles.holdingBarBg}>
                          <View
                            style={[
                              styles.holdingBar,
                              {
                                width: `${Math.max(2, pct)}%`,
                                backgroundColor: accentColor,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.holdingPct}>{pct.toFixed(1)}%</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Fetch button */}
          <GradientButton
            title="Fetch Latest Data"
            variant="secondary"
            icon="↻"
            arrow={false}
            hapticStyle="light"
            onPress={() => router.push("/add-portfolio")}
            accessibilityLabel="Fetch latest portfolio data"
            style={{ marginTop: spacing.xl }}
          />
        </Animated.View>
      )}
      <HoldingDetailSheet
        visible={!!detailHolding}
        onClose={() => setDetailHolding(null)}
        holding={detailHolding}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },

  // Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  brandLogo: {
    width: 180,
    height: 54,
  },

  // Header
  header: {
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: fontSize.xl,
    fontWeight: "400",
    color: colors.text,
    letterSpacing: 0.2,
  },
  date: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 4,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  // Empty state
  emptyWrap: {
    flex: 1,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: "center",
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emptyIcon: {
    fontSize: 34,
    color: colors.text,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: "500",
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: "center",
    lineHeight: 20,
  },
  // Hero Card
  heroCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.brandBorder,
    overflow: "hidden",
    ...cardShadow,
  },
  heroGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroInnerHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1.8,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  heroTimestamp: {
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 1.2,
    fontWeight: "500",
    ...tabular,
  },
  heroAmount: {
    fontSize: 44,
    fontWeight: "300",
    color: colors.text,
    marginTop: spacing.sm,
    letterSpacing: -1.2,
    ...tabular,
  },
  heroPillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  heroGainAbs: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    ...tabular,
  },
  heroGainSub: {
    fontSize: 11,
    color: colors.textTertiary,
    letterSpacing: 0.5,
  },
  heroDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  heroBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroMeta: {
    gap: 3,
  },
  heroMetaLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 1.2,
    fontWeight: "600",
  },
  heroMetaValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: "500",
    ...tabular,
  },

  // Section labels
  sectionLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    fontWeight: "600",
  },

  // Allocation
  allocSection: {
    marginTop: spacing.lg,
  },
  allocHeader: {
    marginBottom: spacing.md,
  },
  donutWrap: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  allocCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    // Inner highlight for card depth
    borderTopColor: "rgba(255,255,255,0.04)",
  },
  allocCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  allocLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  allocValue: {
    fontSize: fontSize.lg,
    fontWeight: "500",
    color: colors.text,
    marginTop: 2,
    letterSpacing: -0.3,
    ...tabular,
  },
  allocMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  allocSub: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  allocPctPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accentDim,
  },
  allocPctText: {
    fontSize: 10,
    color: colors.text,
    fontWeight: "700",
    ...tabular,
  },

  // P&L Card
  plCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopColor: "rgba(255,255,255,0.04)",
  },
  plCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  plGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  plItem: {},
  plItemCenter: {
    alignItems: "center",
  },
  plLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 1.2,
    fontWeight: "600",
  },
  plValue: {
    fontSize: fontSize.md,
    fontWeight: "500",
    color: colors.text,
    marginTop: 4,
    ...tabular,
  },
  plBarWrap: {
    height: 4,
    backgroundColor: colors.surfaceAccent,
    borderRadius: 2,
    marginTop: spacing.md,
    overflow: "hidden",
  },
  plBar: {
    height: 4,
    borderRadius: 2,
  },

  // Holdings Section
  section: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  seeAll: {
    fontSize: 11,
    color: colors.text,
    letterSpacing: 0.8,
    fontWeight: "600",
  },
  holdingCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  holdingAccent: {
    width: 3,
  },
  holdingContent: {
    flex: 1,
    padding: spacing.md,
  },
  holdingTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  holdingName: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: "500",
  },
  holdingSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  typeChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeChipText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  holdingSub: {
    fontSize: 11,
    color: colors.textTertiary,
    flex: 1,
  },
  holdingValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: "600",
    ...tabular,
  },
  holdingGain: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: "600",
    ...tabular,
  },
  holdingBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  holdingBarBg: {
    flex: 1,
    height: 3,
    backgroundColor: colors.surfaceAccent,
    borderRadius: 2,
    overflow: "hidden",
  },
  holdingBar: {
    height: 3,
    borderRadius: 2,
  },
  holdingPct: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: "600",
    width: 38,
    textAlign: "right",
    ...tabular,
  },

});
