import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { InventoryStackParamList } from '@/navigation/types';
import { useMobilePos } from '@/context/MobilePosContext';
import { useAuth } from '@/context/AuthContext';
import type { Product } from '@/types';
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
} from 'lucide-react-native';

export function InventoryCatalogScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<InventoryStackParamList>>();
  const { products, isLoadingProducts, refreshProducts, saveProduct, deleteProduct } = useMobilePos();
  const { business } = useAuth();

  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currency = business?.settings?.currency || 'NGN';

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refreshProducts();
    setIsRefreshing(false);
  };

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
      if (stockFilter === 'low') matchStock = stock > 0 && stock <= lowThresh;
      if (stockFilter === 'out') matchStock = stock <= 0;

      return matchSearch && matchStock;
    });
  }, [products, search, stockFilter]);

  const handleQuickAdjust = (product: Product, delta: number) => {
    const nextStock = Math.max(0, (product.stock || 0) + delta);
    saveProduct({
      ...product,
      stock: nextStock,
    });
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
            >
              <Edit2 size={16} color="#64748B" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => handleDeletePrompt(item)}
            >
              <Trash2 size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardMiddle}>
          <View>
            <Text style={styles.metricLabel}>Selling Price</Text>
            <Text style={styles.metricValue}>
              {currency} {item.price.toLocaleString()}
            </Text>
          </View>

          {cost > 0 ? (
            <View>
              <Text style={styles.metricLabel}>Cost / Margin</Text>
              <Text style={styles.metricSubvalue}>
                {currency} {cost.toLocaleString()} ({margin}%)
              </Text>
            </View>
          ) : null}

          <View style={styles.stockCol}>
            <Text style={styles.metricLabel}>Current Stock</Text>
            <View
              style={[
                styles.stockBadge,
                isOut ? styles.stockBadgeRed : isLow ? styles.stockBadgeAmber : styles.stockBadgeGreen,
              ]}
            >
              <Text
                style={[
                  styles.stockBadgeText,
                  isOut ? styles.stockTextRed : isLow ? styles.stockTextAmber : styles.stockTextGreen,
                ]}
              >
                {isOut ? '0 (Out)' : `${stock} ${item.unit || 'pcs'}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Stepper */}
        <View style={styles.cardBottom}>
          <Text style={styles.stepperLabel}>Quick Stock Adjust:</Text>
          <View style={styles.stepperControls}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => handleQuickAdjust(item, -1)}
            >
              <Text style={styles.stepperBtnText}>-1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => handleQuickAdjust(item, 1)}
            >
              <Text style={styles.stepperBtnText}>+1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.stepperBtn, styles.stepperBtnBig]}
              onPress={() => handleQuickAdjust(item, 10)}
            >
              <Text style={styles.stepperBtnText}>+10</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Search and StockTake */}
      <View style={styles.header}>
        <View style={styles.searchWrapper}>
          <Search size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search catalog, SKU, category..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.stockTakeBtn}
          onPress={() => navigation.navigate('StockTake')}
        >
          <ClipboardList size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.stockTakeBtnText}>Stock Take</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {(['all', 'low', 'out'] as const).map((mode) => {
          const isSelected = stockFilter === mode;
          const labels = {
            all: `All Items (${products.length})`,
            low: 'Low Stock Alert',
            out: 'Out of Stock',
          };
          return (
            <TouchableOpacity
              key={mode}
              style={[styles.filterChip, isSelected && styles.filterChipSelected]}
              onPress={() => setStockFilter(mode)}
            >
              <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                {labels[mode]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Product List */}
      {isLoadingProducts && products.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#F47125" />
          <Text style={styles.loadingText}>Syncing inventory catalog...</Text>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.centered}>
          <Package size={48} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptySubtitle}>
            {search ? 'Try clearing your search query.' : 'Tap "+" below to add your first product.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        />
      )}

      {/* Floating Action Button (FAB) for Add Item */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ItemEditor', {})}
        activeOpacity={0.8}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  stockTakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
  },
  stockTakeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipSelected: {
    backgroundColor: '#F47125',
    borderColor: '#F47125',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
    marginRight: 8,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  productMeta: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  cardMiddle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricSubvalue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  stockCol: {
    alignItems: 'flex-end',
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 2,
  },
  stockBadgeGreen: { backgroundColor: '#ECFDF5' },
  stockBadgeAmber: { backgroundColor: '#FFFBEB' },
  stockBadgeRed: { backgroundColor: '#FEF2F2' },
  stockBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stockTextGreen: { color: '#10B981' },
  stockTextAmber: { color: '#F59E0B' },
  stockTextRed: { color: '#EF4444' },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  stepperLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  stepperControls: {
    flexDirection: 'row',
    gap: 6,
  },
  stepperBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stepperBtnBig: {
    backgroundColor: '#E2E8F0',
  },
  stepperBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F47125',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F47125',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
});

