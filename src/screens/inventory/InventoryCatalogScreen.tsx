import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
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
import { GlowInput } from '@/components/ui/GlowInput';
import { GlowButton } from '@/components/ui/GlowButton';
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
              activeOpacity={0.7}
            >
              <Edit2 size={16} color="#64748B" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => handleDeletePrompt(item)}
              activeOpacity={0.7}
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
        <View style={{ flex: 1 }}>
          <GlowInput
            placeholder="Search catalog, SKU, category..."
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

        <GlowButton
          title="Stock Take"
          icon={<ClipboardList size={16} color="#0F172A" />}
          onPress={() => navigation.navigate('StockTake')}
          variant="outline"
          size="default"
        />
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
              activeOpacity={0.7}
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
          <Text style={styles.emptySubtitle}>Try adjusting your search query or stock filter.</Text>
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

      {/* Floating Add Product FAB with button-glow */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => navigation.navigate('ItemEditor', { productId: undefined })}
        activeOpacity={0.85}
      >
        <Plus size={22} color="#FFFFFF" />
        <Text style={styles.fabText}>Add Product</Text>
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipSelected: {
    borderColor: '#F47125',
    backgroundColor: '#FFF7ED',
  },
  filterChipText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  filterChipTextSelected: {
    color: '#F47125',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardInfo: {
    flex: 1,
    marginRight: 8,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  productMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMiddle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  metricSubvalue: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  stockCol: {
    alignItems: 'flex-end',
  },
  stockBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 2,
  },
  stockBadgeGreen: {
    backgroundColor: '#ECFDF5',
  },
  stockBadgeAmber: {
    backgroundColor: '#FFFBEB',
  },
  stockBadgeRed: {
    backgroundColor: '#FEF2F2',
  },
  stockBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  stockTextGreen: {
    color: '#10B981',
  },
  stockTextAmber: {
    color: '#D97706',
  },
  stockTextRed: {
    color: '#EF4444',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  stepperLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  stepperControls: {
    flexDirection: 'row',
    gap: 6,
  },
  stepperBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stepperBtnBig: {
    backgroundColor: '#E2E8F0',
  },
  stepperBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
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
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  fabButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#F47125',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#F47125',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
