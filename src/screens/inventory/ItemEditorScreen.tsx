import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { InventoryStackParamList } from '@/navigation/types';
import { useMobilePos } from '@/context/MobilePosContext';
import { useAuth } from '@/context/AuthContext';
import { GlowInput } from '@/components/ui/GlowInput';
import { GlowButton } from '@/components/ui/GlowButton';
import {
  Save,
  Trash2,
  Package,
  Barcode,
  Layers,
  DollarSign,
  Hash,
} from 'lucide-react-native';

export function ItemEditorScreen() {
  const route = useRoute<RouteProp<InventoryStackParamList, 'ItemEditor'>>();
  const navigation = useNavigation<NativeStackNavigationProp<InventoryStackParamList>>();
  const { products, saveProduct, deleteProduct } = useMobilePos();
  const { business } = useAuth();

  const productId = route.params?.productId;
  const existingProduct = productId ? products.find((p) => p.id === productId) : null;

  const currency = business?.settings?.currency || 'NGN';

  const [name, setName] = useState(existingProduct?.name || '');
  const [price, setPrice] = useState(existingProduct ? existingProduct.price.toString() : '');
  const [costPrice, setCostPrice] = useState(
    existingProduct?.costPrice ? existingProduct.costPrice.toString() : ''
  );
  const [stock, setStock] = useState(
    existingProduct ? (existingProduct.stock || 0).toString() : '0'
  );
  const [lowStockThreshold, setLowStockThreshold] = useState(
    existingProduct?.lowStockThreshold ? existingProduct.lowStockThreshold.toString() : '5'
  );
  const [category, setCategory] = useState(existingProduct?.category || 'General');
  const [sku, setSku] = useState(existingProduct?.sku || '');
  const [barcode, setBarcode] = useState(existingProduct?.barcode || '');
  const [unit, setUnit] = useState(existingProduct?.unit || 'pcs');

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a product name.');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      Alert.alert('Invalid Price', 'Please enter a valid selling price.');
      return;
    }

    setIsSaving(true);
    try {
      await saveProduct({
        id: existingProduct?.id,
        name: name.trim(),
        price: numPrice,
        costPrice: parseFloat(costPrice) || 0,
        stock: parseInt(stock, 10) || 0,
        lowStockThreshold: parseInt(lowStockThreshold, 10) || 5,
        category: category.trim() || 'General',
        sku: sku.trim(),
        barcode: barcode.trim(),
        unit: unit.trim() || 'pcs',
      });

      Alert.alert(
        'Product Saved',
        `"${name}" was successfully ${existingProduct ? 'updated' : 'added'} to inventory.`
      );
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Save Error', e?.message || 'Could not save product.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!existingProduct) return;
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${existingProduct.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(existingProduct.id);
              navigation.goBack();
            } catch (err: any) {
              Alert.alert('Delete Failed', err?.message || 'Could not delete item.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Basic Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Basic Information</Text>

          <GlowInput
            label="Product Name *"
            placeholder="e.g. Fresh Milk 1L"
            value={name}
            onChangeText={setName}
            leftIcon={<Package size={18} color="#94A3B8" />}
          />

          <GlowInput
            label="Category"
            placeholder="e.g. Dairy, Groceries, Apparel"
            value={category}
            onChangeText={setCategory}
            leftIcon={<Layers size={18} color="#94A3B8" />}
          />

          <GlowInput
            label="Unit of Measurement"
            placeholder="e.g. pcs, kg, packs"
            value={unit}
            onChangeText={setUnit}
          />
        </View>

        {/* Pricing Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pricing & Profitability</Text>

          <GlowInput
            label={`Selling Price (${currency}) *`}
            placeholder="0.00"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
            leftIcon={<DollarSign size={18} color="#94A3B8" />}
          />

          <GlowInput
            label={`Cost Price (${currency})`}
            placeholder="0.00"
            keyboardType="numeric"
            value={costPrice}
            onChangeText={setCostPrice}
            leftIcon={<DollarSign size={18} color="#94A3B8" />}
          />
        </View>

        {/* Inventory Stock Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Inventory & Stock</Text>

          <GlowInput
            label="Current Available Stock"
            placeholder="0"
            keyboardType="numeric"
            value={stock}
            onChangeText={setStock}
            leftIcon={<Hash size={18} color="#94A3B8" />}
          />

          <GlowInput
            label="Low Stock Alert Threshold"
            placeholder="5"
            keyboardType="numeric"
            value={lowStockThreshold}
            onChangeText={setLowStockThreshold}
          />
        </View>

        {/* Identification Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Barcodes & SKU</Text>

          <GlowInput
            label="Barcode (1D / 2D EAN/UPC)"
            placeholder="Scan or enter barcode number"
            value={barcode}
            onChangeText={setBarcode}
            leftIcon={<Barcode size={18} color="#94A3B8" />}
          />

          <GlowInput
            label="SKU (Stock Keeping Unit)"
            placeholder="e.g. MLK-1001-L"
            value={sku}
            onChangeText={setSku}
          />
        </View>

        {/* Action Buttons */}
        <GlowButton
          title={existingProduct ? 'Update Product' : 'Add to Inventory'}
          icon={<Save size={18} color="#FFFFFF" />}
          onPress={handleSave}
          isLoading={isSaving}
          variant="primary"
          size="lg"
          style={{ marginTop: 12 }}
        />

        {existingProduct ? (
          <GlowButton
            title="Delete Product"
            icon={<Trash2 size={18} color="#EF4444" />}
            onPress={handleDelete}
            variant="outline"
            size="default"
            textStyle={{ color: '#EF4444' }}
            style={{ marginTop: 10, borderColor: '#FCA5A5' }}
          />
        ) : null}
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
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
});
