import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { InventoryStackParamList } from '@/navigation/types';
import { useMobilePos } from '@/context/MobilePosContext';
import { useAuth } from '@/context/AuthContext';
import type { Product } from '@/types';
import { GlowInput } from '@/components/ui/GlowInput';
import { GlowButton } from '@/components/ui/GlowButton';
import { fonts } from '@/theme/typography';
import {
  Search,
  Plus,
  Package,
  AlertTriangle,
  QrCode,
  Edit2,
  Trash2,
  X,
  ClipboardList,
  Activity,
  BarChart3,
  TrendingUp,
  ImageOff,
  DollarSign,
  PlusCircle,
  Minus,
} from 'lucide-react-native';

export function InventoryCatalogScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<InventoryStackParamList>>();
  const { products, isLoadingProducts, refreshProducts, saveProduct, deleteProduct } = useMobilePos();
  const { business } = useAuth();

  const [activeTab, setActiveTab] = useState<'catalog' | 'health' | 'analytics'>('catalog');
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in' | 'low' | 'out'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Quick Restock Modal state
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState('10');

  const currency = business?.settings?.currency || 'NGN';

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refreshProducts();
    setIsRefreshing(false);
  };

  // Health Metrics (matching web src/app/(app)/inventory/page.tsx)
  const healthMetrics = useMemo(() => {
    if (!products || products.length === 0) {
      return { missingImages: 0, outOfStock: 0, lowStock: 0, missingCostPrice: 0, score: 100 };
    }
    let missingImages = 0;
    let outOfStock = 0;
    let lowStock = 0;
    let missingCostPrice = 0;

    products.forEach((p) => {
      if (!p.imageUrl) missingImages++;
      if (p.costPrice === undefined || p.costPrice === null || p.costPrice === 0) missingCostPrice++;
      const stock = p.stock || 0;
      if (stock <= 0) outOfStock++;
      else if (stock <= (p.lowStockThreshold || 5)) lowStock++;
    });

    const total = products.length;
    const availScore = Math.max(0, Math.round(((total - outOfStock) / total) * 100));
    const compScore = Math.max(0, Math.round(((total - missingImages) / total) * 100));
    const costScore = Math.max(0, Math.round(((total - missingCostPrice) / total) * 100));
    const score = Math.round((availScore + compScore + costScore) / 3);

    return { missingImages, outOfStock, lowStock, missingCostPrice, score };
  }, [products]);

  // Analytics & Valuation
  const analytics = useMemo(() => {
    let totalUnits = 0;
    let totalRetailValue = 0;
    let totalCostValue = 0;

    products.forEach((p) => {
      const stock = Math.max(0, p.stock || 0);
      const price = p.price || 0;
      const cost = p.costPrice || 0;
      totalUnits += stock;
      totalRetailValue += stock * price;
      totalCostValue += stock * cost;
    });

    const potentialProfit = Math.max(0, totalRetailValue - totalCostValue);
    const marginPercent = totalRetailValue > 0 ? Math.round((potentialProfit / totalRetailValue) * 100) : 0;

    return { totalUnits, totalRetailValue, totalCostValue, potentialProfit, marginPercent };
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q));

      const stock = p.stock || 0;
      const lowThresh = p.lowStockThreshold || 5;

      let matchStock = true;
      if (stockFilter === 'in') matchStock = stock > lowThresh;
      if (stockFilter === 'low') matchStock = stock > 0 && stock <= lowThresh;
      if (stockFilter === 'out') matchStock = stock <= 0;

      return matchSearch && matchStock;
    });
  }, [products, search, stockFilter]);

  const handleQuickRestockSubmit = async () => {
    if (!restockProduct) return;
    const qtyToAdd = parseInt(restockQty, 10);
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid positive number to restock.');
      return;
    }

    const currentStock = restockProduct.stock || 0;
    await saveProduct({
      ...restockProduct,
      stock: currentStock + qtyToAdd,
    });
    setRestockProduct(null);
    Alert.alert('Restocked', `${restockProduct.name} stock updated to ${currentStock + qtyToAdd} units.`);
  };

  const handleDeletePrompt = (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteProduct(product.id),
        },
      ]
    );
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const stock = item.stock || 0;
    const isOut = stock <= 0;
    const isLow = stock > 0 && stock <= (item.lowStockThreshold || 5);
    const cost = item.costPrice || 0;
    const margin = item.price > 0 && cost > 0 ? Math.round(((item.price - cost) / item.price) * 100) : 0;

    return (
      <View style={styles.card}>
        <View style={styles.cornerTopRight} />
        <View style={styles.cornerBottomLeft} />

        <View style={styles.cardTop}>
          <View style={styles.cardInfo}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productMeta}>
              {item.category || 'General'} {item.sku ? `• SKU: ${item.sku}` : ''}
            </Text>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('ItemEditor', { productId: item.id })}
              activeOpacity={0.7}
            >
              <Edit2 size={16} color="#64748B" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => handleDeletePrompt(item)}
              activeOpacity={0.7}
            >
              <Trash2 size={16} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardMid}>
          <View>
            <Text style={styles.metaLabel}>RETAIL PRICE</Text>
            <Text style={styles.priceText}>
              {currency} {item.price.toLocaleString()}
            </Text>
          </View>

          <View>
            <Text style={styles.metaLabel}>COST / MARGIN</Text>
            <Text style={styles.costText}>
              {cost > 0 ? `${currency} ${cost.toLocaleString()} (${margin}%)` : 'Not set'}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.metaLabel}>ON HAND</Text>
            <View
              style={[
                styles.stockBadge,
                isOut ? styles.stockOut : isLow ? styles.stockLow : styles.stockGood,
              ]}
            >
              <Text
                style={[
                  styles.stockBadgeText,
                  isOut ? styles.textOut : isLow ? styles.textLow : styles.textGood,
                ]}
              >
                {stock} in stock
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Restock Action Bar */}
        <View style={styles.cardBottom}>
          <TouchableOpacity
            style={styles.quickRestockButton}
            onPress={() => {
              setRestockProduct(item);
              setRestockQty('10');
            }}
            activeOpacity={0.7}
          >
            <PlusCircle size={14} color="#F47125" />
            <Text style={styles.quickRestockText}>Quick Restock</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header Actions */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Inventory & Catalog</Text>
          <Text style={styles.headerSubtitle}>
            {products.length} registered {products.length === 1 ? 'item' : 'items'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <GlowButton
            title="Stock Take"
            icon={<ClipboardList size={16} color="#0F172A" />}
            onPress={() => navigation.navigate('StockTake')}
            variant="outline"
            size="sm"
          />
          <GlowButton
            title="Add Item"
            icon={<Plus size={16} color="#FFFFFF" />}
            onPress={() => navigation.navigate('ItemEditor', { productId: undefined })}
            variant="primary"
            size="sm"
          />
        </View>
      </View>

      {/* Tabs Row: Catalog | Health | Analytics */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'catalog' && styles.tabButtonActive]}
          onPress={() => setActiveTab('catalog')}
          activeOpacity={0.7}
        >
          <Package size={16} color={activeTab === 'catalog' ? '#F47125' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'catalog' && styles.tabTextActive]}>
            Products
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'health' && styles.tabButtonActive]}
          onPress={() => setActiveTab('health')}
          activeOpacity={0.7}
        >
          <Activity size={16} color={activeTab === 'health' ? '#F47125' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'health' && styles.tabTextActive]}>
            Health ({healthMetrics.score}%)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'analytics' && styles.tabButtonActive]}
          onPress={() => setActiveTab('analytics')}
          activeOpacity={0.7}
        >
          <BarChart3 size={16} color={activeTab === 'analytics' ? '#F47125' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.tabTextActive]}>
            Valuation
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'catalog' && (
        <>
          {/* Search Bar with GlowInput */}
          <View style={styles.searchBar}>
            <GlowInput
              placeholder="Search by name, SKU or category..."
              value={search}
              onChangeText={setSearch}
              leftIcon={<Search size={18} color="#94A3B8" />}
              rightIcon={
                search ? (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <X size={16} color="#94A3B8" />
                  </TouchableOpacity>
                ) : undefined
              }
              containerStyle={{ marginVertical: 0 }}
            />
          </View>

          {/* Stock Filter Chips */}
          <View style={styles.filtersRow}>
            {(['all', 'in', 'low', 'out'] as const).map((filter) => {
              const isSelected = stockFilter === filter;
              const labels = {
                all: 'All Items',
                in: 'In Stock',
                low: 'Low Stock',
                out: 'Out of Stock',
              };
              return (
                <TouchableOpacity
                  key={filter}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => setStockFilter(filter)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {labels[filter]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Product Cards List */}
          {isLoadingProducts && products.length === 0 ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#F47125" />
              <Text style={styles.loadingText}>Loading catalog items...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id}
              renderItem={renderProduct}
              contentContainerStyle={styles.listContent}
              refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
              ListEmptyComponent={
                <View style={styles.centered}>
                  <Package size={48} color="#CBD5E1" />
                  <Text style={styles.emptyTitle}>No products found</Text>
                  <Text style={styles.emptySubtitle}>Try adjusting your search query or filter.</Text>
                </View>
              }
            />
          )}
        </>
      )}

      {activeTab === 'health' && (
        <ScrollView contentContainerStyle={styles.tabContentScroll}>
          {/* Health Score Summary Card */}
          <View style={styles.healthScoreCard}>
            <View>
              <Text style={styles.healthScoreLabel}>OVERALL CATALOG HEALTH</Text>
              <Text style={styles.healthScoreValue}>{healthMetrics.score}%</Text>
              <Text style={styles.healthScoreDesc}>
                Higher score ensures accurate stock audits & cashier velocity.
              </Text>
            </View>
            <View style={styles.scoreCircle}>
              <Activity size={32} color="#F47125" />
            </View>
          </View>

          {/* Anomaly Breakdown Cards */}
          <Text style={styles.sectionHeading}>Data Completeness & Audits</Text>

          <TouchableOpacity
            style={styles.anomalyCard}
            onPress={() => {
              setActiveTab('catalog');
              setStockFilter('out');
            }}
          >
            <View style={[styles.anomalyIcon, { backgroundColor: '#FEE2E2' }]}>
              <AlertTriangle size={20} color="#DC2626" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.anomalyTitle}>Out of Stock Items</Text>
              <Text style={styles.anomalyDesc}>Items with 0 or negative on-hand units</Text>
            </View>
            <Text style={[styles.anomalyCount, { color: '#DC2626' }]}>
              {healthMetrics.outOfStock}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.anomalyCard}
            onPress={() => {
              setActiveTab('catalog');
              setStockFilter('low');
            }}
          >
            <View style={[styles.anomalyIcon, { backgroundColor: '#FEF3C7' }]}>
              <AlertTriangle size={20} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.anomalyTitle}>Low Stock Items</Text>
              <Text style={styles.anomalyDesc}>Items nearing threshold reorder point</Text>
            </View>
            <Text style={[styles.anomalyCount, { color: '#D97706' }]}>
              {healthMetrics.lowStock}
            </Text>
          </TouchableOpacity>

          <View style={styles.anomalyCard}>
            <View style={[styles.anomalyIcon, { backgroundColor: '#F1F5F9' }]}>
              <ImageOff size={20} color="#64748B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.anomalyTitle}>Missing Product Images</Text>
              <Text style={styles.anomalyDesc}>Items with no visual photo or thumbnail</Text>
            </View>
            <Text style={[styles.anomalyCount, { color: '#64748B' }]}>
              {healthMetrics.missingImages}
            </Text>
          </View>

          <View style={styles.anomalyCard}>
            <View style={[styles.anomalyIcon, { backgroundColor: '#E0E7FF' }]}>
              <DollarSign size={20} color="#4F46E5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.anomalyTitle}>Missing Cost Price</Text>
              <Text style={styles.anomalyDesc}>Items missing purchase cost for profit margins</Text>
            </View>
            <Text style={[styles.anomalyCount, { color: '#4F46E5' }]}>
              {healthMetrics.missingCostPrice}
            </Text>
          </View>
        </ScrollView>
      )}

      {activeTab === 'analytics' && (
        <ScrollView contentContainerStyle={styles.tabContentScroll}>
          {/* Valuation Metrics Grid */}
          <View style={styles.analyticsGrid}>
            <View style={styles.metricBox}>
              <Text style={styles.metricBoxLabel}>TOTAL RETAIL VALUE</Text>
              <Text style={styles.metricBoxValue}>
                {currency} {analytics.totalRetailValue.toLocaleString()}
              </Text>
              <Text style={styles.metricBoxSub}>Across all branch stock</Text>
            </View>

            <View style={styles.metricBox}>
              <Text style={styles.metricBoxLabel}>TOTAL COST VALUE</Text>
              <Text style={styles.metricBoxValue}>
                {currency} {analytics.totalCostValue.toLocaleString()}
              </Text>
              <Text style={styles.metricBoxSub}>Inventory acquisition capital</Text>
            </View>

            <View style={styles.metricBox}>
              <Text style={styles.metricBoxLabel}>POTENTIAL PROFIT</Text>
              <Text style={[styles.metricBoxValue, { color: '#10B981' }]}>
                {currency} {analytics.potentialProfit.toLocaleString()}
              </Text>
              <Text style={styles.metricBoxSub}>{analytics.marginPercent}% aggregate margin</Text>
            </View>

            <View style={styles.metricBox}>
              <Text style={styles.metricBoxLabel}>ON-HAND UNITS</Text>
              <Text style={styles.metricBoxValue}>
                {analytics.totalUnits.toLocaleString()}
              </Text>
              <Text style={styles.metricBoxSub}>Physical count</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Quick Restock Modal */}
      <Modal visible={!!restockProduct} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.restockModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quick Restock</Text>
              <TouchableOpacity onPress={() => setRestockProduct(null)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.restockProductName}>{restockProduct?.name}</Text>
            <Text style={styles.restockProductStock}>
              Current stock: {restockProduct?.stock || 0} units
            </Text>

            <GlowInput
              label="Quantity to Add"
              keyboardType="numeric"
              value={restockQty}
              onChangeText={setRestockQty}
              containerStyle={{ marginVertical: 12 }}
            />

            <View style={styles.quickQtyRow}>
              {[5, 10, 25, 50, 100].map((q) => (
                <TouchableOpacity
                  key={q}
                  style={styles.quickQtyChip}
                  onPress={() => setRestockQty(q.toString())}
                >
                  <Text style={styles.quickQtyChipText}>+{q}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <GlowButton
                title="Cancel"
                onPress={() => setRestockProduct(null)}
                variant="outline"
                size="default"
                style={{ flex: 1 }}
              />
              <GlowButton
                title="Confirm Restock"
                onPress={handleQuickRestockSubmit}
                variant="primary"
                size="default"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F8F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#F47125',
  },
  tabText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#64748B',
  },
  tabTextActive: {
    color: '#F47125',
    fontFamily: fonts.bold,
  },
  searchBar: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  chipText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: fonts.medium,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    position: 'relative',
  },
  cornerTopRight: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 6,
    height: 6,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: '#CBD5E1',
    zIndex: 10,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    width: 6,
    height: 6,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
    borderColor: '#CBD5E1',
    zIndex: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 14,
    fontFamily: fonts.medium,
    fontWeight: '600',
    color: '#0F172A',
  },
  productMeta: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardMid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metaLabel: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  priceText: {
    fontSize: 14,
    fontFamily: fonts.headingBold,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  costText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#64748B',
    marginTop: 2,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 2,
  },
  stockGood: {
    backgroundColor: '#ECFDF5',
  },
  stockLow: {
    backgroundColor: '#FEF3C7',
  },
  stockOut: {
    backgroundColor: '#FEE2E2',
  },
  stockBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  textGood: {
    color: '#10B981',
  },
  textLow: {
    color: '#D97706',
  },
  textOut: {
    color: '#DC2626',
  },
  cardBottom: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  quickRestockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#FFF7ED',
  },
  quickRestockText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#F47125',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontFamily: fonts.regular,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    fontFamily: fonts.regular,
    marginTop: 4,
  },
  tabContentScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  healthScoreCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  healthScoreLabel: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  healthScoreValue: {
    fontSize: 28,
    fontFamily: fonts.headingBold,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  healthScoreDesc: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: fonts.regular,
    marginTop: 4,
    maxWidth: 220,
  },
  scoreCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeading: {
    fontSize: 14,
    fontFamily: fonts.headingBold,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  anomalyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  anomalyIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anomalyTitle: {
    fontSize: 13,
    fontFamily: fonts.medium,
    fontWeight: '600',
    color: '#0F172A',
  },
  anomalyDesc: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  anomalyCount: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    fontWeight: '700',
  },
  analyticsGrid: {
    gap: 10,
  },
  metricBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
  },
  metricBoxLabel: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  metricBoxValue: {
    fontSize: 22,
    fontFamily: fonts.headingBold,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  metricBoxSub: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  restockModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    fontWeight: '700',
    color: '#0F172A',
  },
  restockProductName: {
    fontSize: 15,
    fontFamily: fonts.medium,
    fontWeight: '600',
    color: '#0F172A',
  },
  restockProductStock: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  quickQtyRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  quickQtyChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  quickQtyChipText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#0F172A',
  },
});
