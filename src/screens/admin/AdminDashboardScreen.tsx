import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '@/navigation/types';
import { useMobilePos } from '@/context/MobilePosContext';
import { useAuth } from '@/context/AuthContext';
import {
  TrendingUp,
  ShoppingBag,
  CreditCard,
  Percent,
  Activity,
  ArrowRight,
  ShieldCheck,
  Package,
} from 'lucide-react-native';

export function AdminDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const { receipts, products, offlineQueueCount, isSyncingQueue } = useMobilePos();
  const { business } = useAuth();

  const currency = business?.settings?.currency || 'NGN';

  // Compute live GMV and Metrics
  const metrics = useMemo(() => {
    let totalGMV = 0;
    let totalCost = 0;
    const count = receipts.length;

    const productSalesMap = new Map<string, { name: string; qty: number; revenue: number }>();

    receipts.forEach((r) => {
      totalGMV += r.total || 0;
      r.items.forEach((item) => {
        const pId = item.productId;
        const current = productSalesMap.get(pId) || { name: item.name, qty: 0, revenue: 0 };
        current.qty += item.quantity;
        current.revenue += item.quantity * (item.price || 0);
        productSalesMap.set(pId, current);

        const cost = item.costPrice || 0;
        totalCost += cost * item.quantity;
      });
    });

    const averageBasket = count > 0 ? Math.round(totalGMV / count) : 0;
    const grossProfit = totalGMV - totalCost;
    const grossMarginPercent = totalGMV > 0 ? Math.round((grossProfit / totalGMV) * 100) : 0;

    const topSelling = Array.from(productSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalGMV,
      count,
      averageBasket,
      grossMarginPercent,
      topSelling,
    };
  }, [receipts]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Operational Overview</Text>
          <Text style={styles.headerSubtitle}>
            Real-time multi-lane sales velocity & telemetry
          </Text>
        </View>

        {/* Offline Queue Sync Indicator */}
        <TouchableOpacity
          style={styles.syncCard}
          onPress={() => navigation.navigate('AdminTelemetry')}
          activeOpacity={0.8}
        >
          <View style={styles.syncLeft}>
            <View
              style={[
                styles.syncIcon,
                offlineQueueCount > 0 ? styles.syncIconPending : styles.syncIconClean,
              ]}
            >
              <Activity size={20} color={offlineQueueCount > 0 ? '#F47125' : '#10B981'} />
            </View>
            <View>
              <Text style={styles.syncTitle}>
                {offlineQueueCount > 0
                  ? `${offlineQueueCount} Mutations Pending Cloud Sync`
                  : 'All Systems Synchronized'}
              </Text>
              <Text style={styles.syncSubtitle}>
                {offlineQueueCount > 0 ? 'Queued in local storage' : 'Firestore delta listener active'}
              </Text>
            </View>
          </View>
          <ArrowRight size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* 4 KPIs Grid */}
        <View style={styles.kpiGrid}>
          {/* GMV */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>TOTAL REVENUE</Text>
              <TrendingUp size={16} color="#F47125" />
            </View>
            <Text style={styles.kpiValue}>
              {currency} {metrics.totalGMV.toLocaleString()}
            </Text>
            <Text style={styles.kpiMeta}>Gross merchandise volume</Text>
          </View>

          {/* Orders Count */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>TRANSACTIONS</Text>
              <ShoppingBag size={16} color="#3B82F6" />
            </View>
            <Text style={styles.kpiValue}>{metrics.count}</Text>
            <Text style={styles.kpiMeta}>Completed cashier checkouts</Text>
          </View>

          {/* Avg Basket */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>AVG BASKET</Text>
              <CreditCard size={16} color="#10B981" />
            </View>
            <Text style={styles.kpiValue}>
              {currency} {metrics.averageBasket.toLocaleString()}
            </Text>
            <Text style={styles.kpiMeta}>Average ticket value</Text>
          </View>

          {/* Margin */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>GROSS MARGIN</Text>
              <Percent size={16} color="#8B5CF6" />
            </View>
            <Text style={styles.kpiValue}>{metrics.grossMarginPercent}%</Text>
            <Text style={styles.kpiMeta}>Cost vs Selling spread</Text>
          </View>
        </View>

        {/* Top Velocity Products */}
        <Text style={styles.sectionTitle}>Top Velocity Products</Text>
        {metrics.topSelling.length === 0 ? (
          <View style={styles.emptyCard}>
            <Package size={32} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No product sales yet</Text>
            <Text style={styles.emptySubtitle}>Completed sales will calculate velocity automatically.</Text>
          </View>
        ) : (
          metrics.topSelling.map((prod, idx) => (
            <View key={idx} style={styles.prodRow}>
              <View style={styles.prodRankBadge}>
                <Text style={styles.prodRankText}>#{idx + 1}</Text>
              </View>
              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <Text style={styles.prodName}>{prod.name}</Text>
                <Text style={styles.prodUnits}>{prod.qty} units sold</Text>
              </View>
              <Text style={styles.prodRev}>
                {currency} {prod.revenue.toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F8F6',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  syncCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  syncLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  syncIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  syncIconClean: {
    backgroundColor: '#ECFDF5',
  },
  syncIconPending: {
    backgroundColor: '#FFF7ED',
  },
  syncTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  syncSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  kpiMeta: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  prodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  prodRankBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prodRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  prodName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  prodUnits: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  prodRev: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});
