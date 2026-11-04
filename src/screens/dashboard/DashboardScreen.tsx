import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useMobilePos } from '@/context/MobilePosContext';
import { useAuth } from '@/context/AuthContext';
import { fonts } from '@/theme/typography';
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
  PlusCircle,
  ClipboardList,
  ArrowRight,
  TrendingUp,
  Receipt as ReceiptIcon,
  Clock,
  Sparkles,
} from 'lucide-react-native';

export function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    products,
    customers,
    heldSales,
    cartTotal,
    refreshProducts,
    refreshCustomers,
  } = useMobilePos();
  const { business, userProfile } = useAuth();

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const currency = business?.settings?.currency || 'NGN';

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refreshProducts(), refreshCustomers()]);
    setIsRefreshing(false);
  };

  // Derive inventory and customer metrics
  const stats = useMemo(() => {
    let outOfStock = 0;
    let lowStock = 0;
    let totalStockValue = 0;

    products.forEach((p) => {
      const stock = p.stock || 0;
      if (stock <= 0) outOfStock++;
      else if (stock <= (p.lowStockThreshold || 5)) lowStock++;
      totalStockValue += Math.max(0, stock) * (p.price || 0);
    });

    let totalCustomerDebt = 0;
    customers.forEach((c) => {
      totalCustomerDebt += Math.max(0, c.debtBalance || 0);
    });

    return {
      productCount: products.length,
      outOfStock,
      lowStock,
      totalStockValue,
      customerCount: customers.length,
      totalCustomerDebt,
    };
  }, [products, customers]);

  const todayDateString = useMemo(() => {
    return new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
    >
      {/* Top Welcome Section */}
      <View style={styles.welcomeSection}>
        <View>
          <Text style={styles.greetingText}>
            Welcome back, {userProfile?.name?.split(' ')[0] || 'Cashier'}
          </Text>
          <Text style={styles.dateText}>{todayDateString}</Text>
        </View>

        <View style={styles.storePill}>
          <Sparkles size={12} color="#F47125" />
          <Text style={styles.storePillText}>{business?.name || 'Zeneva Store'}</Text>
        </View>
      </View>

      {/* Primary KPI Cards Grid */}
      <View style={styles.kpiGrid}>
        {/* Total Stock Value Card */}
        <View style={[styles.kpiCard, styles.kpiCardPrimary]}>
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiLabelPrimary}>INVENTORY VALUATION</Text>
            <DollarSign size={18} color="#FED7AA" />
          </View>
          <Text style={styles.kpiValuePrimary}>
            {currency} {stats.totalStockValue.toLocaleString()}
          </Text>
          <Text style={styles.kpiSubPrimary}>
            {stats.productCount} active catalog items
          </Text>
        </View>

        {/* Customer Debt Outstanding */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiLabel}>CUSTOMER DEBT LEDGER</Text>
            <Users size={16} color="#DC2626" />
          </View>
          <Text style={[styles.kpiValue, { color: '#DC2626' }]}>
            {currency} {stats.totalCustomerDebt.toLocaleString()}
          </Text>
          <Text style={styles.kpiSub}>{stats.customerCount} registered accounts</Text>
        </View>
      </View>

      {/* Stock Health Quick Alert Card */}
      {stats.outOfStock > 0 || stats.lowStock > 0 ? (
        <TouchableOpacity
          style={styles.stockWarningCard}
          onPress={() => (navigation as any).navigate('InventoryTab')}
          activeOpacity={0.8}
        >
          <View style={styles.warningIconWrapper}>
            <AlertTriangle size={20} color="#D97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.warningTitle}>Stock Attention Required</Text>
            <Text style={styles.warningSubtitle}>
              {stats.outOfStock} out-of-stock items • {stats.lowStock} items nearing threshold
            </Text>
          </View>
          <ArrowRight size={16} color="#D97706" />
        </TouchableOpacity>
      ) : null}

      {/* Quick Launchpad Shortcuts */}
      <Text style={styles.sectionHeading}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => (navigation as any).navigate('PosTab')}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIconBox, { backgroundColor: '#FFF7ED' }]}>
            <ShoppingCart size={22} color="#F47125" />
          </View>
          <Text style={styles.actionTitle}>New POS Sale</Text>
          <Text style={styles.actionDesc}>Open cashier register</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => (navigation as any).navigate('InventoryTab', { screen: 'ItemEditor' })}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIconBox, { backgroundColor: '#F0FDF4' }]}>
            <Package size={22} color="#16A34A" />
          </View>
          <Text style={styles.actionTitle}>Add Product</Text>
          <Text style={styles.actionDesc}>New SKU or variant</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => (navigation as any).navigate('InventoryTab', { screen: 'StockTake' })}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIconBox, { backgroundColor: '#EFF6FF' }]}>
            <ClipboardList size={22} color="#2563EB" />
          </View>
          <Text style={styles.actionTitle}>Stock Take</Text>
          <Text style={styles.actionDesc}>Physical count audit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => (navigation as any).navigate('CustomersTab')}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIconBox, { backgroundColor: '#FAF5FF' }]}>
            <Users size={22} color="#9333EA" />
          </View>
          <Text style={styles.actionTitle}>Customers</Text>
          <Text style={styles.actionDesc}>Debts & directories</Text>
        </TouchableOpacity>
      </View>

      {/* Parked Sales Banner */}
      {heldSales.length > 0 ? (
        <View style={styles.parkedCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Clock size={18} color="#F47125" />
            <Text style={styles.parkedTitle}>{heldSales.length} Parked Sales in Queue</Text>
          </View>
          <TouchableOpacity
            style={styles.resumeParkedBtn}
            onPress={() => (navigation as any).navigate('PosTab')}
          >
            <Text style={styles.resumeParkedText}>Open Register</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
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
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 18,
    fontFamily: fonts.headingBold,
    fontWeight: '700',
    color: '#0F172A',
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  storePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  storePillText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#F47125',
  },
  kpiGrid: {
    gap: 10,
    marginBottom: 14,
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
  },
  kpiCardPrimary: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  kpiLabel: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#64748B',
    letterSpacing: 0.8,
  },
  kpiLabelPrimary: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  kpiValue: {
    fontSize: 24,
    fontFamily: fonts.headingBold,
    fontWeight: '800',
    color: '#0F172A',
  },
  kpiValuePrimary: {
    fontSize: 26,
    fontFamily: fonts.headingBold,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  kpiSub: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: fonts.regular,
    marginTop: 4,
  },
  kpiSubPrimary: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: fonts.regular,
    marginTop: 4,
  },
  stockWarningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  warningIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#92400E',
  },
  warningSubtitle: {
    fontSize: 11,
    color: '#B45309',
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 14,
    fontFamily: fonts.headingBold,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '600',
    color: '#0F172A',
  },
  actionDesc: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  parkedCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
  },
  parkedTitle: {
    fontSize: 13,
    fontFamily: fonts.medium,
    fontWeight: '600',
    color: '#0F172A',
  },
  resumeParkedBtn: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  resumeParkedText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#F47125',
  },
});
