import { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { getPortfolios, getPortfolio } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { colors, spacing, fontSize, borderRadius } from "../../lib/theme";

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [activeData, setActiveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const fmtINR = (v: number) => {
    if (v === undefined || v === null) return "₹0";
    const abs = Math.abs(v);
    const sign = v < 0 ? "-" : "";
    if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`;
    if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(2)}L`;
    return `${sign}₹${abs.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  };

  const fmtINRFull = (v: number) =>
    `₹${Math.abs(v).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.textSecondary} />
      </View>
    );
  }

  const summary = activeData?.summary;
  const accounts = summary?.accounts || {};
  const investor = activeData?.investor;
  const demat = activeData?.demat_accounts || [];
  const mf = activeData?.mutual_funds || [];

  // Calculate MF P&L
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

  // Top holdings (MF + demat securities combined)
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
        });
      }
    });
  });
  allHoldings.sort((a, b) => b.value - a.value);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          tintColor={colors.textSecondary}
        />
      }
    >
      {!activeData ? (
        <View style={styles.emptyWrap}>
          <View style={styles.header}>
            <Text style={styles.greeting}>Hello, {user?.name?.split(" ")[0]}</Text>
          </View>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>◎</Text>
            <Text style={styles.emptyTitle}>No portfolio linked</Text>
            <Text style={styles.emptySubtitle}>
              Connect your demat account to see all your investments in one place
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push("/add-portfolio")}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>Link Portfolio</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.greeting}>
              Hello, {user?.name?.split(" ")[0]}
            </Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </Text>
          </View>

          {/* Hero Card — Total Portfolio */}
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <Text style={styles.heroLabel}>Total Portfolio Value</Text>
              <View style={styles.liveDot} />
            </View>
            <Text style={styles.heroAmount}>{fmtINRFull(totalPortfolio)}</Text>
            <View style={styles.heroDivider} />
            <View style={styles.heroBottom}>
              <View style={styles.heroMeta}>
                <Text style={styles.heroMetaLabel}>Investor</Text>
                <Text style={styles.heroMetaValue}>
                  {investor?.name?.split(" ").map((w: string) => w[0]?.toUpperCase() + w.slice(1).toLowerCase()).join(" ")}
                </Text>
              </View>
              <View style={styles.heroMeta}>
                <Text style={styles.heroMetaLabel}>PAN</Text>
                <Text style={styles.heroMetaValue}>{investor?.pan}</Text>
              </View>
            </View>
          </View>

          {/* Allocation Cards */}
          <View style={styles.row}>
            <View style={styles.allocCard}>
              <View style={styles.allocDot}>
                <View style={[styles.dot, { backgroundColor: "#6366F1" }]} />
              </View>
              <Text style={styles.allocLabel}>Mutual Funds</Text>
              <Text style={styles.allocValue}>
                {fmtINR(accounts.mutual_funds?.total_value || 0)}
              </Text>
              <Text style={styles.allocSub}>
                {accounts.mutual_funds?.count || 0} folio(s) ·{" "}
                {totalPortfolio > 0
                  ? ((accounts.mutual_funds?.total_value || 0) / totalPortfolio * 100).toFixed(1)
                  : 0}%
              </Text>
            </View>
            <View style={styles.allocCard}>
              <View style={styles.allocDot}>
                <View style={[styles.dot, { backgroundColor: "#22D3EE" }]} />
              </View>
              <Text style={styles.allocLabel}>Demat</Text>
              <Text style={styles.allocValue}>
                {fmtINR(accounts.demat?.total_value || 0)}
              </Text>
              <Text style={styles.allocSub}>
                {accounts.demat?.count || 0} account(s) ·{" "}
                {totalPortfolio > 0
                  ? ((accounts.demat?.total_value || 0) / totalPortfolio * 100).toFixed(1)
                  : 0}%
              </Text>
            </View>
          </View>

          {/* P&L Card */}
          {totalCost > 0 && (
            <View style={styles.plCard}>
              <Text style={styles.plTitle}>Mutual Fund P&L</Text>
              <View style={styles.plGrid}>
                <View style={styles.plItem}>
                  <Text style={styles.plLabel}>Invested</Text>
                  <Text style={styles.plValue}>{fmtINR(totalCost)}</Text>
                </View>
                <View style={[styles.plItem, styles.plItemCenter]}>
                  <Text style={styles.plLabel}>Current</Text>
                  <Text style={styles.plValue}>{fmtINR(totalVal)}</Text>
                </View>
                <View style={[styles.plItem, { alignItems: "flex-end" }]}>
                  <Text style={styles.plLabel}>Returns</Text>
                  <Text
                    style={[
                      styles.plValue,
                      { color: totalGain >= 0 ? colors.success : colors.error },
                    ]}
                  >
                    {totalGain >= 0 ? "+" : ""}{fmtINR(totalGain)}
                  </Text>
                </View>
              </View>
              {/* P&L Bar */}
              <View style={styles.plBarWrap}>
                <View
                  style={[
                    styles.plBar,
                    {
                      width: `${Math.min(100, Math.max(5, (totalVal / totalCost) * 100))}%`,
                      backgroundColor: totalGain >= 0 ? colors.success : colors.error,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.plPct,
                  { color: totalGain >= 0 ? colors.success : colors.error },
                ]}
              >
                {totalGain >= 0 ? "▲" : "▼"} {Math.abs(gainPct).toFixed(1)}% overall
              </Text>
            </View>
          )}

          {/* Holdings */}
          {allHoldings.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Holdings</Text>
                <TouchableOpacity onPress={() => router.push("/(main)/holdings")}>
                  <Text style={styles.seeAll}>See all →</Text>
                </TouchableOpacity>
              </View>
              {allHoldings.slice(0, 5).map((h, i) => {
                const pct = totalPortfolio > 0 ? (h.value / totalPortfolio) * 100 : 0;
                return (
                  <View key={i} style={styles.holdingCard}>
                    <View style={styles.holdingTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.holdingName} numberOfLines={1}>
                          {h.name}
                        </Text>
                        <Text style={styles.holdingSub}>
                          {h.sub} · {h.type}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.holdingValue}>{fmtINR(h.value)}</Text>
                        {h.gain !== 0 && (
                          <Text
                            style={[
                              styles.holdingGain,
                              { color: h.gain >= 0 ? colors.success : colors.error },
                            ]}
                          >
                            {h.gain >= 0 ? "+" : ""}{fmtINR(h.gain)}
                          </Text>
                        )}
                      </View>
                    </View>
                    {/* Allocation bar */}
                    <View style={styles.holdingBarWrap}>
                      <View
                        style={[
                          styles.holdingBar,
                          { width: `${Math.max(2, pct)}%` },
                        ]}
                      />
                      <Text style={styles.holdingPct}>{pct.toFixed(1)}%</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Fetch button */}
          <TouchableOpacity
            style={styles.fetchBtn}
            onPress={() => router.push("/add-portfolio")}
            activeOpacity={0.8}
          >
            <Text style={styles.fetchBtnIcon}>↻</Text>
            <Text style={styles.fetchBtnText}>Fetch Latest Data</Text>
          </TouchableOpacity>
        </>
      )}
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
    paddingTop: 60,
    paddingBottom: 120,
  },

  // Header
  header: {
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: fontSize.xl,
    fontWeight: "300",
    color: colors.text,
    letterSpacing: 0.5,
  },
  date: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: 4,
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
    marginTop: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIcon: {
    fontSize: 48,
    color: colors.textTertiary,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: "300",
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: "center",
    lineHeight: 20,
  },
  primaryBtn: {
    backgroundColor: colors.text,
    borderRadius: borderRadius.full,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
  primaryBtnText: {
    color: colors.bg,
    fontSize: fontSize.sm,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  // Hero Card
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    opacity: 0.8,
  },
  heroAmount: {
    fontSize: 44,
    fontWeight: "200",
    color: colors.text,
    marginTop: spacing.sm,
    letterSpacing: -1,
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
    gap: 2,
  },
  heroMetaLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  heroMetaValue: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: "400",
  },

  // Allocation cards
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  allocCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  allocDot: {
    marginBottom: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  allocLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  allocValue: {
    fontSize: fontSize.lg,
    fontWeight: "300",
    color: colors.text,
    marginTop: 4,
  },
  allocSub: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 4,
  },

  // P&L Card
  plCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  plTitle: {
    fontSize: 11,
    color: colors.textTertiary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
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
    fontSize: 11,
    color: colors.textTertiary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  plValue: {
    fontSize: fontSize.md,
    fontWeight: "400",
    color: colors.text,
    marginTop: 4,
  },
  plBarWrap: {
    height: 4,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 2,
    marginTop: spacing.md,
    overflow: "hidden",
  },
  plBar: {
    height: 4,
    borderRadius: 2,
  },
  plPct: {
    fontSize: fontSize.xs,
    marginTop: spacing.sm,
    textAlign: "right",
    letterSpacing: 0.5,
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
  sectionTitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  seeAll: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    letterSpacing: 0.5,
  },
  holdingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
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
  holdingSub: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },
  holdingValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: "500",
  },
  holdingGain: {
    fontSize: 11,
    marginTop: 2,
  },
  holdingBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  holdingBar: {
    height: 3,
    backgroundColor: "#6366F1",
    borderRadius: 2,
  },
  holdingPct: {
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 0.5,
  },

  // Fetch button
  fetchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    paddingVertical: 14,
    marginTop: spacing.xl,
  },
  fetchBtnIcon: {
    fontSize: fontSize.md,
    color: colors.textTertiary,
  },
  fetchBtnText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    letterSpacing: 0.5,
  },
});
