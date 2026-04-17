import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Animated,
  Easing,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { getPortfolios, getPortfolio } from "../../lib/api";
import { fmtCurrency, fmtINR } from "../../lib/format";
import { HoldingsSkeleton } from "../../components/Skeleton";
import { StatPill } from "../../components/StatPill";
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

export default function Holdings() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<"mf" | "demat">("mf");
  const [detailHolding, setDetailHolding] = useState<HoldingDetail | null>(null);

  const openDetail = (h: HoldingDetail) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setDetailHolding(h);
  };

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (!loading && data && !hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
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
      ]).start();
    }
  }, [loading, data, fadeAnim, slideAnim]);

  const load = async () => {
    try {
      const list = await getPortfolios();
      if (list.length > 0) {
        const d = await getPortfolio(list[0].id);
        setData(d);
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
        <View style={{ paddingHorizontal: spacing.lg }}>
          <HoldingsSkeleton />
        </View>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.emptyText}>No holdings data</Text>
      </View>
    );
  }

  const mf = data.mutual_funds || [];
  const demat = data.demat_accounts || [];

  const schemes: any[] = [];
  mf.forEach((folio: any) => {
    folio.schemes?.forEach((s: any) => {
      schemes.push({ ...s, amc: folio.amc, folio: folio.folio_number });
    });
  });

  const accentColor = tab === "mf" ? colors.brand : colors.brandBright;

  const mfValue = schemes.reduce((sum, s) => sum + (s.value || 0), 0);
  const dematValue = demat.reduce(
    (sum: number, d: any) => sum + (d.value || 0),
    0
  );
  const totalValue = mfValue + dematValue;

  let gainers = 0;
  let losers = 0;
  schemes.forEach((s) => {
    const g = s.gain?.absolute || 0;
    if (g > 0) gainers += 1;
    else if (g < 0) losers += 1;
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
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
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Holdings</Text>
          <Text style={styles.subtitle}>
            {schemes.length + demat.length} instruments across{" "}
            {mf.length + demat.length} accounts
          </Text>
        </View>

        {/* Summary card */}
        <LinearGradient
          colors={
            gradients.brandSoft as unknown as [string, string, ...string[]]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.summaryLabel}>Total Holdings Value</Text>
              <Text style={styles.summaryValue}>{fmtINR(totalValue)}</Text>
            </View>
            {(gainers > 0 || losers > 0) && (
              <View style={styles.moverRow}>
                {gainers > 0 && (
                  <View
                    style={[
                      styles.moverPill,
                      { backgroundColor: colors.successDim },
                    ]}
                  >
                    <Text
                      style={[
                        styles.moverText,
                        { color: colors.successBright },
                      ]}
                    >
                      ▲ {gainers}
                    </Text>
                  </View>
                )}
                {losers > 0 && (
                  <View
                    style={[
                      styles.moverPill,
                      { backgroundColor: colors.errorDim },
                    ]}
                  >
                    <Text
                      style={[
                        styles.moverText,
                        { color: colors.errorBright },
                      ]}
                    >
                      ▼ {losers}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
          <View style={styles.summarySplit}>
            <View style={styles.summarySplitItem}>
              <View
                style={[styles.splitDot, { backgroundColor: colors.brand }]}
              />
              <Text style={styles.splitLabel}>MF</Text>
              <Text style={styles.splitValue}>{fmtINR(mfValue)}</Text>
            </View>
            <View style={styles.splitDivider} />
            <View style={styles.summarySplitItem}>
              <View
                style={[
                  styles.splitDot,
                  { backgroundColor: colors.brandBright },
                ]}
              />
              <Text style={styles.splitLabel}>Demat</Text>
              <Text style={styles.splitValue}>{fmtINR(dematValue)}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Tab switcher */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[
              styles.tab,
              tab === "mf" && {
                borderColor: colors.brandBorder,
                backgroundColor: colors.brandDim,
              },
            ]}
            onPress={() => {
              setTab("mf");
              if (Platform.OS !== "web") Haptics.selectionAsync();
            }}
            activeOpacity={0.8}
            accessibilityLabel="Mutual funds tab"
            accessibilityRole="tab"
          >
            <View
              style={[
                styles.tabDot,
                {
                  backgroundColor:
                    tab === "mf" ? colors.brand : colors.textTertiary,
                },
              ]}
            />
            <Text
              style={[
                styles.tabText,
                tab === "mf" && { color: colors.text, fontWeight: "600" },
              ]}
            >
              Mutual Funds
            </Text>
            <Text
              style={[
                styles.tabCount,
                tab === "mf" && { color: colors.brandBright },
              ]}
            >
              {schemes.length}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              tab === "demat" && {
                borderColor: colors.brandBorder,
                backgroundColor: colors.brandDim,
              },
            ]}
            onPress={() => {
              setTab("demat");
              if (Platform.OS !== "web") Haptics.selectionAsync();
            }}
            activeOpacity={0.8}
            accessibilityLabel="Demat tab"
            accessibilityRole="tab"
          >
            <View
              style={[
                styles.tabDot,
                {
                  backgroundColor:
                    tab === "demat" ? colors.brandBright : colors.textTertiary,
                },
              ]}
            />
            <Text
              style={[
                styles.tabText,
                tab === "demat" && { color: colors.text, fontWeight: "600" },
              ]}
            >
              Demat
            </Text>
            <Text
              style={[
                styles.tabCount,
                tab === "demat" && { color: colors.brandBright },
              ]}
            >
              {demat.length}
            </Text>
          </TouchableOpacity>
        </View>

        {tab === "mf" &&
          schemes
            .sort((a, b) => (b.value || 0) - (a.value || 0))
            .map((s, i) => {
              const gain = s.gain?.absolute || 0;
              const gainPct = s.gain?.percentage || 0;
              const name = s.name?.includes(" - ")
                ? s.name.split(" - ").pop()
                : s.name;
              return (
                <TouchableOpacity
                  key={i}
                  style={styles.card}
                  activeOpacity={0.75}
                  onPress={() =>
                    openDetail({
                      name,
                      sub: s.amc,
                      type: s.type || "MF",
                      value: s.value || 0,
                      units: s.units,
                      nav: s.nav,
                      cost: s.cost,
                      gainAbs: gain,
                      gainPct,
                      transactions: s.transactions,
                    })
                  }
                  accessibilityLabel={`View ${name} details`}
                  accessibilityRole="button"
                >
                  <View
                    style={[styles.cardAccent, { backgroundColor: accentColor }]}
                  />
                  <View style={styles.cardBody}>
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1, paddingRight: spacing.sm }}>
                        <Text style={styles.cardName} numberOfLines={2}>
                          {name}
                        </Text>
                        <View style={styles.cardSubRow}>
                          <View
                            style={[
                              styles.typeChip,
                              { backgroundColor: colors.brandDim },
                            ]}
                          >
                            <Text
                              style={[
                                styles.typeChipText,
                                { color: colors.brandBright },
                              ]}
                            >
                              {s.type}
                            </Text>
                          </View>
                          <Text style={styles.cardSub} numberOfLines={1}>
                            {s.amc}
                          </Text>
                        </View>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.cardValue}>
                          {fmtCurrency(s.value || 0)}
                        </Text>
                        <StatPill
                          pct={gainPct}
                          size="sm"
                          style={{ marginTop: 4 }}
                        />
                      </View>
                    </View>
                  <View style={styles.cardDetails}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>UNITS</Text>
                      <Text style={styles.detailValue}>
                        {s.units?.toFixed(3)}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>NAV</Text>
                      <Text style={styles.detailValue}>
                        ₹{s.nav?.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>INVESTED</Text>
                      <Text style={styles.detailValue}>{fmtCurrency(s.cost || 0)}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>P&L</Text>
                      <Text
                        style={[
                          styles.detailValue,
                          {
                            color:
                              gain >= 0 ? colors.successBright : colors.errorBright,
                          },
                        ]}
                      >
                        {gain >= 0 ? "+" : ""}
                        {fmtCurrency(gain)}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

        {tab === "demat" &&
          demat.map((acct: any, i: number) => {
            const dp = acct.dp_name || "Unknown";
            const holdings = acct.holdings || {};
            const allSec = [
              ...(holdings.equities || []),
              ...(holdings.demat_mutual_funds || []),
              ...(holdings.corporate_bonds || []),
              ...(holdings.government_securities || []),
              ...(holdings.aifs || []),
            ];
            const acctValue = acct.value || 0;
            const topSecValue = allSec.reduce(
              (m: number, s: any) => Math.max(m, s.value || 0),
              0
            );
            return (
              <View key={i} style={styles.card}>
                <View
                  style={[
                    styles.cardAccent,
                    { backgroundColor: colors.brandBright },
                  ]}
                />
                <View style={styles.cardBody}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1, paddingRight: spacing.sm }}>
                      <Text style={styles.cardName}>{dp}</Text>
                      <Text style={styles.cardSub}>BO · {acct.bo_id}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.cardValue}>
                        {fmtCurrency(acctValue)}
                      </Text>
                      <View
                        style={[
                          styles.statusChip,
                          { backgroundColor: colors.brandDim },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusChipText,
                            { color: colors.brandBright },
                          ]}
                        >
                          {(acct.additional_info?.status || "ACTIVE").toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {allSec.length > 0 ? (
                    <View style={styles.secList}>
                      {allSec.map((sec: any, j: number) => {
                        const secName = sec.name?.includes("#")
                          ? sec.name.split("#").pop()
                          : sec.name;
                        const secVal = sec.value || 0;
                        const barPct =
                          topSecValue > 0
                            ? Math.max(3, (secVal / topSecValue) * 100)
                            : 0;
                        return (
                          <TouchableOpacity
                            key={j}
                            style={styles.secRow}
                            activeOpacity={0.7}
                            onPress={() =>
                              openDetail({
                                name: secName,
                                sub: dp.replace(" PRIVATE LIMITED", ""),
                                type: sec.isin?.startsWith("IN") ? "EQ" : "SEC",
                                value: secVal,
                                units: sec.units,
                                transactions: sec.transactions,
                              })
                            }
                            accessibilityLabel={`View ${secName} details`}
                            accessibilityRole="button"
                          >
                            <View style={styles.secLeft}>
                              <View style={styles.secBullet} />
                              <View style={{ flex: 1 }}>
                                <Text style={styles.secName} numberOfLines={1}>
                                  {secName}
                                </Text>
                                <View style={styles.secBarBg}>
                                  <View
                                    style={[
                                      styles.secBar,
                                      {
                                        width: `${barPct}%`,
                                        backgroundColor: colors.brandBright,
                                      },
                                    ]}
                                  />
                                </View>
                              </View>
                            </View>
                            <View style={styles.secRight}>
                              <Text style={styles.secValue}>
                                {fmtCurrency(secVal)}
                              </Text>
                              <Text style={styles.secUnits}>
                                {sec.units} units
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={styles.emptySec}>
                      No holdings in this account
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
      </Animated.View>
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
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "500",
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },

  // Summary card
  summaryCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.brandBorder,
    marginBottom: spacing.lg,
    overflow: "hidden",
    ...cardShadow,
  },
  summaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1.8,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  summaryValue: {
    fontSize: fontSize.xl,
    color: colors.text,
    fontWeight: "500",
    letterSpacing: -0.5,
    marginTop: 6,
    ...tabular,
  },
  moverRow: {
    flexDirection: "row",
    gap: 6,
  },
  moverPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  moverText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
    ...tabular,
  },
  summarySplit: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.brandBorder,
  },
  summarySplitItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  splitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  splitLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 0.8,
    fontWeight: "600",
  },
  splitValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: "600",
    marginLeft: "auto",
    ...tabular,
  },
  splitDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: colors.brandBorder,
    marginHorizontal: spacing.md,
  },

  // Tabs
  tabs: {
    flexDirection: "row",
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 48,
  },
  tabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    letterSpacing: 0.3,
  },
  tabCount: {
    color: colors.textTertiary,
    fontSize: fontSize.xs,
    fontWeight: "700",
    ...tabular,
  },

  // Card
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...cardShadow,
  },
  cardAccent: {
    width: 3,
  },
  cardBody: {
    flex: 1,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardName: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: "600",
    lineHeight: 20,
  },
  cardSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
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
  cardSub: {
    fontSize: 11,
    color: colors.textTertiary,
    flex: 1,
  },
  cardValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: "600",
    ...tabular,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 4,
  },
  statusChipText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Details grid
  cardDetails: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailItem: {
    gap: 3,
  },
  detailLabel: {
    fontSize: 9,
    color: colors.textTertiary,
    letterSpacing: 1,
    fontWeight: "600",
  },
  detailValue: {
    fontSize: fontSize.xs,
    color: colors.text,
    fontWeight: "600",
    ...tabular,
  },

  // Demat securities list
  secList: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  secRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  secLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  secBullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.brandBright,
    marginTop: 6,
  },
  secName: {
    fontSize: fontSize.xs,
    color: colors.text,
    fontWeight: "500",
  },
  secBarBg: {
    height: 3,
    backgroundColor: colors.surfaceAccent,
    borderRadius: 2,
    marginTop: 6,
    overflow: "hidden",
  },
  secBar: {
    height: 3,
    borderRadius: 2,
  },
  secRight: {
    alignItems: "flex-end",
    marginLeft: spacing.md,
  },
  secUnits: {
    fontSize: 10,
    color: colors.textTertiary,
    marginTop: 2,
    ...tabular,
  },
  secValue: {
    fontSize: fontSize.xs,
    color: colors.text,
    fontWeight: "600",
    ...tabular,
  },
  emptySec: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.sm,
    fontStyle: "italic",
  },
});
