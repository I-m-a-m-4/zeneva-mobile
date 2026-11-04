import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
  RefreshControl,
  Image,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PosStackParamList } from '@/navigation/types';
import { useMobilePos } from '@/context/MobilePosContext';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/i18n-context';
import type { Product } from '@/types';
import { smartSearchMatch } from '@/lib/utils';
import { GlowInput } from '@/components/ui/GlowInput';
import { GlowButton } from '@/components/ui/GlowButton';
import { fonts } from '@/theme/typography';
import {
  Search,
  Camera,
  ShoppingCart,
  Plus,
  Minus,
  PauseCircle,
  X,
  Package,
  Shirt,
  Smartphone,
  Pill,
  Coffee,
  ArrowRight,
  ChevronUp,
  Trash2,
} from 'lucide-react-native';

function renderCategoryIcon(category?: string, size = 16) {
  const cat = category?.toLowerCase() || '';
  if (cat.includes('cloth') || cat.includes('fashion') || cat.includes('apparel') || cat.includes('wear')) {
    return <Shirt size={size} color="#F47125" />;
  }
  if (cat.includes('phone') || cat.includes('elect') || cat.includes('gadget') || cat.includes('tech')) {
    return <Smartphone size={size} color="#F47125" />;
  }
  if (cat.includes('health') || cat.includes('med') || cat.includes('pharm') || cat.includes('pill')) {
    return <Pill size={size} color="#F47125" />;
  }
  if (cat.includes('bev') || cat.includes('food') || cat.includes('cafe') || cat.includes('coffee')) {
    return <Coffee size={size} color="#F47125" />;
  }
  return <Package size={size} color="#F47125" />;
}

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
  const { t } = useI18n();

  const [search, setSearch] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showHeldSalesModal, setShowHeldSalesModal] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [manualCode, setManualCode] = useState('');

  const currency = business?.settings?.currency || 'NGN';

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refreshProducts();
    setIsRefreshing(false);
  };

  // Filter products using smartSearchMatch
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      if (!matchCat) return false;
      if (!search.trim()) return true;

      return (
        smartSearchMatch(p.name, search) ||
        smartSearchMatch(p.sku, search) ||
        smartSearchMatch(p.barcode, search) ||
        smartSearchMatch(p.category, search)
      );
    });
  }, [products, selectedCategory, search]);

  const handleBarcodeScanned = (code: string) => {
    setShowScanner(false);
    setManualCode('');
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
    const isService =
      item.categoryType === 'service' ||
      item.category?.toLowerCase() === 'service' ||
      item.category?.toLowerCase() === 'services';

    return (
      <View style={styles.productCard}>
        {/* Corner Accent Brackets for Signature Zeneva Card styling */}
        <View style={styles.cornerTopRight} />
        <View style={styles.cornerBottomLeft} />

        {/* Product Media Header */}
        <View style={styles.imageContainer}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              {renderCategoryIcon(item.category, 28)}
            </View>
          )}

          {/* Out of Stock / Service Badge */}
          {isService ? (
            <View style={styles.serviceBadge}>
              <Text style={styles.serviceBadgeText}>{t('pos.serviceBadge')}</Text>
            </View>
          ) : isOutOfStock ? (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockBadgeText}>{t('pos.outOfStock')}</Text>
            </View>
          ) : null}
        </View>

        {/* Product Details */}
        <View style={styles.cardContent}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          {item.sku ? <Text style={styles.productSku}>SKU: {item.sku}</Text> : null}

          <View style={styles.productFooter}>
            <View>
              <Text style={styles.productPrice}>
                {currency} {item.price.toLocaleString()}
              </Text>
              {item.baseUnit ? (
                <Text style={styles.productUnit}>per {item.baseUnit}</Text>
              ) : null}
            </View>

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
                activeOpacity={0.8}
              >
                <Plus size={15} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Search & Actions Bar */}
      <View style={styles.searchBarContainer}>
        <View style={{ flex: 1 }}>
          <GlowInput
            placeholder="Search items, SKU, barcode..."
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

        {/* Barcode Camera Scanner Button */}
        <TouchableOpacity
          style={styles.iconActionButton}
          onPress={() => setShowScanner(true)}
          activeOpacity={0.7}
        >
          <Camera size={20} color="#0F172A" />
        </TouchableOpacity>

        {/* Held Sales Button */}
        {heldSales.length > 0 ? (
          <TouchableOpacity
            style={[styles.iconActionButton, styles.heldBadgeActive]}
            onPress={() => setShowHeldSalesModal(true)}
            activeOpacity={0.7}
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
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item;
            return (
              <TouchableOpacity
                style={[styles.categoryPill, isSelected && styles.categoryPillSelected]}
                onPress={() => setSelectedCategory(item)}
                activeOpacity={0.7}
              >
                <View style={styles.categoryPillIcon}>
                  {renderCategoryIcon(item, 14)}
                </View>
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
          <TouchableOpacity
            style={styles.cartSummary}
            onPress={() => setShowCartDrawer(true)}
            activeOpacity={0.8}
          >
            <View style={styles.cartIconWrapper}>
              <ShoppingCart size={22} color="#F47125" />
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
              </View>
            </View>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.cartItemsCountText}>
                  {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
                </Text>
                <ChevronUp size={14} color="#64748B" />
              </View>
              <Text style={styles.cartTotalText}>
                {currency} {cartTotal.toLocaleString()}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.cartActions}>
            <TouchableOpacity
              style={styles.holdButton}
              onPress={() => {
                holdCurrentSale();
                Alert.alert('Sale Held', 'Cart preserved in held sales.');
              }}
              activeOpacity={0.7}
            >
              <PauseCircle size={18} color="#64748B" />
            </TouchableOpacity>

            <GlowButton
              title="Select Customer"
              icon={<ArrowRight size={16} color="#FFFFFF" />}
              onPress={() => navigation.navigate('CustomerSelect')}
              variant="primary"
              size="sm"
            />
          </View>
        </View>
      ) : null}

      {/* Cart Quick Review Drawer */}
      <Modal visible={showCartDrawer} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.cartDrawerCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ShoppingCart size={20} color="#F47125" />
                <Text style={styles.modalTitle}>Cart Items ({cartItemCount})</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCartDrawer(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320, paddingHorizontal: 16 }}>
              {cart.map((c) => (
                <View key={c.product.id} style={styles.cartDrawerItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cartDrawerItemName}>{c.product.name}</Text>
                    <Text style={styles.cartDrawerItemSub}>
                      {currency} {c.product.price.toLocaleString()} × {c.quantity} = {currency} {(c.product.price * c.quantity).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.qtyControls}>
                    <TouchableOpacity
                      style={styles.qtyButton}
                      onPress={() => removeFromCart(c.product.id)}
                    >
                      {c.quantity === 1 ? (
                        <Trash2 size={13} color="#DC2626" />
                      ) : (
                        <Minus size={13} color="#0F172A" />
                      )}
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{c.quantity}</Text>
                    <TouchableOpacity
                      style={[styles.qtyButton, styles.qtyButtonAdd]}
                      onPress={() => addToCart(c.product)}
                    >
                      <Plus size={13} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.cartDrawerFooter}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={styles.drawerTotalLabel}>Total Amount:</Text>
                <Text style={styles.drawerTotalVal}>
                  {currency} {cartTotal.toLocaleString()}
                </Text>
              </View>
              <GlowButton
                title="Proceed to Customer"
                icon={<ArrowRight size={16} color="#FFFFFF" />}
                onPress={() => {
                  setShowCartDrawer(false);
                  navigation.navigate('CustomerSelect');
                }}
                variant="primary"
                size="default"
              />
            </View>
          </View>
        </View>
      </Modal>

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

      {/* Barcode Manual Entry Modal */}
      <Modal visible={showScanner} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.scannerModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Barcode / SKU</Text>
              <TouchableOpacity onPress={() => setShowScanner(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            <GlowInput
              placeholder="e.g. 893127810"
              value={manualCode}
              onChangeText={setManualCode}
              onSubmitEditing={() => handleBarcodeScanned(manualCode)}
              autoFocus
            />
            <GlowButton
              title="Search Barcode"
              onPress={() => handleBarcodeScanned(manualCode)}
              variant="primary"
              size="default"
              style={{ marginTop: 12 }}
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
  iconActionButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
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
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  categoriesContainer: {
    paddingVertical: 6,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
    gap: 6,
  },
  categoryPillSelected: {
    backgroundColor: '#FFF7ED',
    borderColor: '#F47125',
  },
  categoryPillIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryPillText: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: fonts.medium,
    fontWeight: '500',
  },
  categoryPillTextSelected: {
    color: '#F47125',
    fontFamily: fonts.bold,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
  productList: {
    padding: 10,
    paddingBottom: 95,
  },
  productCard: {
    flex: 1,
    margin: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
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
  imageContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#F8FAFC',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  serviceBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  serviceBadgeText: {
    fontSize: 10,
    color: '#3B82F6',
    fontFamily: fonts.bold,
    fontWeight: '600',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  outOfStockBadgeText: {
    fontSize: 10,
    color: '#EF4444',
    fontFamily: fonts.bold,
    fontWeight: '600',
  },
  cardContent: {
    padding: 10,
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 13,
    fontFamily: fonts.medium,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 18,
    minHeight: 36,
  },
  productSku: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  productPrice: {
    fontSize: 13,
    fontFamily: fonts.headingBold,
    fontWeight: '700',
    color: '#0F172A',
  },
  productUnit: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: fonts.regular,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F47125',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  addButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: fonts.bold,
    fontWeight: '600',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    padding: 2,
  },
  qtyButton: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  qtyButtonAdd: {
    backgroundColor: '#F47125',
  },
  qtyText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '600',
    color: '#0F172A',
    paddingHorizontal: 8,
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
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 8,
  },
  cartSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartIconWrapper: {
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F47125',
    borderRadius: 9,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  cartItemsCountText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: fonts.medium,
    fontWeight: '500',
  },
  cartTotalText: {
    fontSize: 15,
    color: '#0F172A',
    fontFamily: fonts.headingBold,
    fontWeight: '700',
  },
  cartActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  holdButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  cartDrawerCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cartDrawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cartDrawerItemName: {
    fontSize: 13,
    fontFamily: fonts.medium,
    fontWeight: '600',
    color: '#0F172A',
  },
  cartDrawerItemSub: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  cartDrawerFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FAFAF9',
  },
  drawerTotalLabel: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: fonts.medium,
  },
  drawerTotalVal: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    color: '#0F172A',
    fontWeight: '700',
  },
  scannerModalCard: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    fontWeight: '700',
    color: '#0F172A',
  },
  heldItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  heldItemTitle: {
    fontSize: 14,
    fontFamily: fonts.medium,
    fontWeight: '600',
    color: '#0F172A',
  },
  heldItemSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  resumeButton: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  resumeButtonText: {
    color: '#F47125',
    fontSize: 12,
    fontFamily: fonts.bold,
    fontWeight: '600',
  },
});
