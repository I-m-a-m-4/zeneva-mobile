import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PosStackParamList } from '@/navigation/types';
import { useMobilePos } from '@/context/MobilePosContext';
import { useAuth } from '@/context/AuthContext';
import type { Product } from '@/types';
import {
  Search,
  Camera,
  ShoppingCart,
  Plus,
  Minus,
  PauseCircle,
  X,
  Package,
  Check,
  RefreshCw,
} from 'lucide-react-native';

export function SelectProductsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<PosStackParamList>>();
  const {
    products,
    isLoadingProducts,
    refreshProducts,
    cart,
    addToCart,
    removeFromCart,
    cartItemCount,
    cartTotal,
    categories,
    selectedCategory,
    setSelectedCategory,
    heldSales,
    holdCurrentSale,
    resumeHeldSale,
  } = useMobilePos();
  const { business } = useAuth();

  const [search, setSearch] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showHeldSalesModal, setShowHeldSalesModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currency = business?.settings?.currency || 'NGN';

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refreshProducts();
    setIsRefreshing(false);
  };

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.includes(search)) ||
        (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, search]);

  const handleBarcodeScanned = (code: string) => {
    setShowScanner(false);
    const found = products.find((p) => p.barcode === code || p.sku === code);
    if (found) {
      addToCart(found);
      Alert.alert('Item Added', `${found.name} added to cart.`);
    } else {
      Alert.alert('Not Found', `No product found matching barcode "${code}".`);
    }
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const itemInCart = cart.find((c) => c.product.id === item.id);
    const currentQty = itemInCart ? itemInCart.quantity : 0;
    const isOutOfStock = (item.stock || 0) <= 0;

    return (
      <View style={styles.productCard}>
        <View style={styles.productHeader}>
          <View style={styles.productBadge}>
            <Package size={16} color="#F47125" />
          </View>
          <View style={styles.stockStatus}>
            <View
              style={[
                styles.stockDot,
                isOutOfStock
                  ? styles.stockDotRed
                  : (item.stock || 0) <= (item.lowStockThreshold || 5)
                  ? styles.stockDotAmber
                  : styles.stockDotGreen,
              ]}
            />
            <Text style={styles.stockText}>
              {isOutOfStock ? 'Out of stock' : `${item.stock || 0} in stock`}
            </Text>
          </View>
        </View>

        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        {item.sku ? <Text style={styles.productSku}>SKU: {item.sku}</Text> : null}

        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>
            {currency} {item.price.toLocaleString()}
          </Text>

          {currentQty > 0 ? (
            <View style={styles.qtyControls}>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => removeFromCart(item.id)}
              >
                <Minus size={14} color="#0F172A" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{currentQty}</Text>
              <TouchableOpacity
                style={[styles.qtyButton, styles.qtyButtonAdd]}
                onPress={() => addToCart(item)}
              >
                <Plus size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.addButton, isOutOfStock && styles.addButtonDisabled]}
              onPress={() => addToCart(item)}
              disabled={isOutOfStock}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Search & Actions Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchInputWrapper}>
          <Search size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items, SKU, barcode..."
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

        {/* Barcode Camera Scanner Button */}
        <TouchableOpacity style={styles.iconActionButton} onPress={() => setShowScanner(true)}>
          <Camera size={20} color="#0F172A" />
        </TouchableOpacity>

        {/* Held Sales Button */}
        {heldSales.length > 0 ? (
          <TouchableOpacity
            style={[styles.iconActionButton, styles.heldBadgeActive]}
            onPress={() => setShowHeldSalesModal(true)}
          >
            <PauseCircle size={20} color="#F47125" />
            <View style={styles.heldCountBadge}>
              <Text style={styles.heldCountText}>{heldSales.length}</Text>
            </View>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category Horizontal Filter */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item;
            return (
              <TouchableOpacity
                style={[styles.categoryPill, isSelected && styles.categoryPillSelected]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected && styles.categoryPillTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Products Grid */}
      {isLoadingProducts && products.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#F47125" />
          <Text style={styles.loadingText}>Loading inventory catalog...</Text>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.centered}>
          <Package size={48} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptySubtitle}>Try adjusting your search query or category filter.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          numColumns={2}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          contentContainerStyle={styles.productList}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        />
      )}

      {/* Bottom Cart Action Bar */}
      {cart.length > 0 ? (
        <View style={styles.cartFooter}>
          <View style={styles.cartSummary}>
            <View style={styles.cartIconWrapper}>
              <ShoppingCart size={22} color="#F47125" />
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
              </View>
            </View>
            <View>
              <Text style={styles.cartItemsCountText}>
                {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
              </Text>
              <Text style={styles.cartTotalText}>
                {currency} {cartTotal.toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.cartActions}>
            <TouchableOpacity
              style={styles.holdButton}
              onPress={() => {
                holdCurrentSale();
                Alert.alert('Sale Held', 'Cart preserved in held sales.');
              }}
            >
              <PauseCircle size={18} color="#64748B" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={() => navigation.navigate('CustomerSelect')}
            >
              <Text style={styles.checkoutButtonText}>Select Customer</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* Held Sales Modal */}
      <Modal visible={showHeldSalesModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Held Sales ({heldSales.length})</Text>
              <TouchableOpacity onPress={() => setShowHeldSalesModal(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={heldSales}
              keyExtractor={(h) => h.id}
              renderItem={({ item }) => (
                <View style={styles.heldItemCard}>
                  <View>
                    <Text style={styles.heldItemTitle}>{item.notes || 'Held Sale'}</Text>
                    <Text style={styles.heldItemSubtitle}>
                      {currency} {item.total.toLocaleString()} • {item.items.length} items
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.resumeButton}
                    onPress={() => {
                      resumeHeldSale(item.id);
                      setShowHeldSalesModal(false);
                    }}
                  >
                    <Text style={styles.resumeButtonText}>Resume</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Barcode Camera Modal Mock / Prompt */}
      <Modal visible={showScanner} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Scan Product Barcode</Text>
              <TouchableOpacity onPress={() => setShowScanner(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.scannerPrompt}>
              Aim camera at 1D/2D barcode or enter SKU manually:
            </Text>
            <TextInput
              style={styles.manualBarcodeInput}
              placeholder="Enter barcode or SKU..."
              placeholderTextColor="#94A3B8"
              onSubmitEditing={(e) => handleBarcodeScanned(e.nativeEvent.text)}
              autoFocus
            />
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
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  iconActionButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heldBadgeActive: {
    borderColor: '#FED7AA',
    backgroundColor: '#FFF7ED',
  },
  heldCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F47125',
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heldCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  categoryPillSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryPillTextSelected: {
    color: '#FFFFFF',
  },
  productList: {
    padding: 12,
    paddingBottom: 100,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    margin: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: 'space-between',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  stockDotGreen: { backgroundColor: '#10B981' },
  stockDotAmber: { backgroundColor: '#F59E0B' },
  stockDotRed: { backgroundColor: '#EF4444' },
  stockText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  productSku: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F47125',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2,
  },
  qtyButton: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  qtyButtonAdd: {
    backgroundColor: '#F47125',
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    paddingHorizontal: 8,
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
  cartFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 8,
  },
  cartSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F47125',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  cartItemsCountText: {
    fontSize: 12,
    color: '#64748B',
  },
  cartTotalText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  cartActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  holdButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutButton: {
    backgroundColor: '#F47125',
    borderRadius: 12,
    paddingHorizontal: 20,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  heldItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  heldItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  heldItemSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  resumeButton: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  resumeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  scannerPrompt: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  manualBarcodeInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: '#0F172A',
  },
});
