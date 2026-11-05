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
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PosStackParamList } from '@/navigation/types';
import { useMobilePos } from '@/context/MobilePosContext';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/i18n-context';
import type { Product } from '@/types';
import { smartSearchMatch } from '@/lib/utils';
import { GlowButton } from '@/components/ui/GlowButton';
import { fonts } from '@/theme/typography';
import {
  Search,
  QrCode,
  ListFilter,
  PlusCircle,
  ChevronsUp,
  X,
  Package,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Check,
  Camera,
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
  } = useMobilePos();
  const { business } = useAuth();
  const { t } = useI18n();

  const [search, setSearch] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [manualCode, setManualCode] = useState('');

  const currencySymbol = business?.settings?.currency === 'USD' ? '$' : '₦';

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refreshProducts();
    setIsRefreshing(false);
  };

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
      Alert.alert('Not Found', `No product found matching code "${code}".`);
    }
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const itemInCart = cart.find((c) => c.product.id === item.id);
    const isOutOfStock = (item.stock || 0) <= 0;
    const isService =
      item.categoryType === 'service' ||
      item.category?.toLowerCase() === 'service' ||
      item.category?.toLowerCase() === 'services';

    return (
      <View style={styles.productCard}>
        {/* Media container: 4:3 aspect ratio, clean white bg */}
        <View style={styles.imageContainer}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.productImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Package size={34} color="#CBD5E1" />
            </View>
          )}
        </View>

        {/* Product Details */}
        <View style={styles.cardContent}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>

          {/* Stock Badge directly underneath the title */}
          {isOutOfStock ? (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockBadgeText}>Out of stock</Text>
            </View>
          ) : isService ? (
            <View style={styles.serviceBadge}>
              <Text style={styles.serviceBadgeText}>Service</Text>
            </View>
          ) : (
            <View style={styles.inStockBadge}>
              <Text style={styles.inStockBadgeText}>{item.stock} in stock</Text>
            </View>
          )}

          {/* Footer: Price on left, PlusCircle button on right */}
          <View style={styles.productFooter}>
            <View style={styles.priceColumn}>
              <Text style={styles.productPrice}>
                {currencySymbol} {item.price.toLocaleString()}
              </Text>
              <Text style={styles.productUnit}>
                per {item.baseUnit || 'Piece'}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.actionIconButton,
                itemInCart && styles.actionIconButtonInCart,
                isOutOfStock && styles.actionIconButtonDisabled,
              ]}
              onPress={() => addToCart(item)}
              disabled={isOutOfStock}
              activeOpacity={0.7}
            >
              <PlusCircle
                size={20}
                color={
                  isOutOfStock ? '#CBD5E1' : itemInCart ? '#F47125' : '#0F172A'
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Search & Actions Row */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputContainer}>
          <Search size={16} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name or SKU..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} style={{ padding: 4 }}>
              <X size={15} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Secondary Search Button */}
        <TouchableOpacity
          style={styles.squareSearchBtn}
          onPress={() => {}}
          activeOpacity={0.7}
        >
          <Search size={17} color="#0F172A" />
        </TouchableOpacity>

        {/* Barcode/QR Scanner Button */}
        <TouchableOpacity
          style={styles.squareQrBtn}
          onPress={() => setShowScanner(true)}
          activeOpacity={0.7}
        >
          <QrCode size={19} color="#F47125" />
        </TouchableOpacity>

        {/* Filter Button */}
        <TouchableOpacity
          style={[
            styles.squareFilterBtn,
            selectedCategory !== 'All' && styles.squareFilterBtnActive,
          ]}
          onPress={() => setShowCategoryModal(true)}
          activeOpacity={0.7}
        >
          <ListFilter
            size={18}
            color={selectedCategory !== 'All' ? '#F47125' : '#0F172A'}
          />
        </TouchableOpacity>
      </View>

      {/* Active Category Indicator Banner (if filtered) */}
      {selectedCategory !== 'All' ? (
        <View style={styles.filterBanner}>
          <Text style={styles.filterBannerText}>
            Category: <Text style={{ fontFamily: fonts.bold }}>{selectedCategory}</Text>
          </Text>
          <TouchableOpacity onPress={() => setSelectedCategory('All')}>
            <X size={14} color="#F47125" />
          </TouchableOpacity>
        </View>
      ) : null}

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
          <Text style={styles.emptySubtitle}>
            Try adjusting your search query or category filter.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          numColumns={2}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          contentContainerStyle={styles.productList}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Floating Orange Cart Bar */}
      <TouchableOpacity
        style={styles.floatingCartBar}
        onPress={() => setShowCartDrawer(true)}
        activeOpacity={0.9}
      >
        <View style={styles.floatingCartLeft}>
          <ChevronsUp size={20} color="#FFFFFF" />
          <Text style={styles.floatingCartText}>
            View Cart ({cartItemCount})
          </Text>
        </View>
        <Text style={styles.floatingCartTotal}>
          {currencySymbol}
          {cartTotal.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
      </TouchableOpacity>

      {/* Category Dropdown Filter Modal */}
      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.categoryModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }}>
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryOption,
                      isSelected && styles.categoryOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedCategory(cat);
                      setShowCategoryModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        isSelected && styles.categoryOptionTextSelected,
                      ]}
                    >
                      {cat}
                    </Text>
                    {isSelected && <Check size={18} color="#F47125" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Cart Quick Review Drawer */}
      <Modal visible={showCartDrawer} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.cartDrawerCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Cart ({cartItemCount})</Text>
              <TouchableOpacity onPress={() => setShowCartDrawer(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {cart.length === 0 ? (
              <View style={{ padding: 32, alignItems: 'center' }}>
                <Package size={40} color="#CBD5E1" />
                <Text
                  style={{
                    marginTop: 8,
                    color: '#64748B',
                    fontFamily: fonts.medium,
                  }}
                >
                  Your cart is currently empty.
                </Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 320, paddingHorizontal: 16 }}>
                {cart.map((c) => (
                  <View key={c.product.id} style={styles.cartDrawerItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cartDrawerItemName}>
                        {c.product.name}
                      </Text>
                      <Text style={styles.cartDrawerItemSub}>
                        {currencySymbol} {c.product.price.toLocaleString()} ×{' '}
                        {c.quantity} = {currencySymbol}{' '}
                        {(c.product.price * c.quantity).toLocaleString()}
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
            )}

            <View style={styles.cartDrawerFooter}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 14,
                }}
              >
                <Text style={styles.drawerTotalLabel}>Total Amount:</Text>
                <Text style={styles.drawerTotalVal}>
                  {currencySymbol}{' '}
                  {cartTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
              <GlowButton
                title="Next: Customer Selection"
                icon={<ArrowRight size={16} color="#FFFFFF" />}
                onPress={() => {
                  setShowCartDrawer(false);
                  navigation.navigate('CustomerSelect');
                }}
                disabled={cart.length === 0}
                variant="primary"
                size="default"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Barcode Scanner Modal */}
      <Modal visible={showScanner} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.scannerModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Scan Barcode or Enter SKU</Text>
              <TouchableOpacity onPress={() => setShowScanner(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.scannerPrompt}>
              <Camera size={44} color="#F47125" />
              <Text style={styles.scannerPromptTitle}>Enter SKU or Barcode</Text>
              <Text style={styles.scannerPromptSub}>
                Type the barcode number or SKU below to add immediately:
              </Text>
            </View>

            <View style={styles.manualCodeRow}>
              <TextInput
                style={styles.manualCodeInput}
                placeholder="e.g. 13amps, 590123..."
                placeholderTextColor="#94A3B8"
                value={manualCode}
                onChangeText={setManualCode}
                onSubmitEditing={() => handleBarcodeScanned(manualCode)}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.manualCodeSubmitBtn}
                onPress={() => handleBarcodeScanned(manualCode)}
              >
                <Text style={styles.manualCodeSubmitText}>Add</Text>
              </TouchableOpacity>
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#0F172A',
  },
  squareSearchBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  squareQrBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  squareFilterBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  squareFilterBtnActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  filterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#FFF7ED',
    borderBottomWidth: 1,
    borderBottomColor: '#FED7AA',
  },
  filterBannerText: {
    fontSize: 12,
    color: '#C2410C',
    fontFamily: fonts.medium,
  },
  productList: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 90,
  },
  productCard: {
    flex: 1,
    maxWidth: '48.5%',
    margin: '1%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
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
  outOfStockBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    marginBottom: 8,
  },
  outOfStockBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#EF4444',
  },
  serviceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    marginBottom: 8,
  },
  serviceBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#3B82F6',
  },
  inStockBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    marginBottom: 8,
  },
  inStockBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    fontWeight: '600',
    color: '#16A34A',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 6,
  },
  priceColumn: {
    flex: 1,
  },
  productPrice: {
    fontSize: 15,
    fontFamily: fonts.headingBold,
    fontWeight: '800',
    color: '#0F172A',
  },
  productUnit: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: fonts.regular,
    marginTop: 1,
  },
  actionIconButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconButtonInCart: {
    borderColor: '#F47125',
    backgroundColor: '#FFF7ED',
  },
  actionIconButtonDisabled: {
    opacity: 0.4,
    borderColor: '#F1F5F9',
  },
  floatingCartBar: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    height: 52,
    backgroundColor: '#F47125',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    shadowColor: '#F47125',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 30,
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  floatingCartText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  floatingCartTotal: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fonts.headingBold,
    fontWeight: '800',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
    fontFamily: fonts.medium,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: fonts.regular,
    textAlign: 'center',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  categoryModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 32,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  categoryOptionSelected: {
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
  },
  categoryOptionText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#0F172A',
  },
  categoryOptionTextSelected: {
    color: '#F47125',
    fontFamily: fonts.bold,
  },
  cartDrawerCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 16,
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    fontWeight: '700',
    color: '#0F172A',
  },
  cartDrawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginTop: 2,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonAdd: {
    backgroundColor: '#F47125',
  },
  qtyText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
    minWidth: 16,
    textAlign: 'center',
  },
  cartDrawerFooter: {
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  drawerTotalLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#64748B',
  },
  drawerTotalVal: {
    fontSize: 18,
    fontFamily: fonts.headingBold,
    fontWeight: '800',
    color: '#0F172A',
  },
  scannerModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    paddingBottom: 32,
  },
  scannerPrompt: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  scannerPromptTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8,
  },
  scannerPromptSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  manualCodeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  manualCodeInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#0F172A',
  },
  manualCodeSubmitBtn: {
    paddingHorizontal: 18,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F47125',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualCodeSubmitText: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    fontWeight: '700',
    fontSize: 14,
  },
});
