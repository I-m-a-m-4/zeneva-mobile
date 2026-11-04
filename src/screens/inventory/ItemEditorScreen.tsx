import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { InventoryStackParamList } from '@/navigation/types';
import { useMobilePos } from '@/context/MobilePosContext';
import { useAuth } from '@/context/AuthContext';
import {
  Save,
  Trash2,
  Package,
  Barcode,
  Layers,
  DollarSign,
  Hash,
  AlertCircle,
  ArrowLeft,
  Camera,
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

  const defaultCategories = ['General', 'Groceries', 'Beverages', 'Electronics', 'Apparel', 'Health'];

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
      `Permanently remove "${existingProduct.name}" from inventory?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteProduct(existingProduct.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Top Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {existingProduct ? 'Edit Catalog Item' : 'New Catalog Item'}
          </Text>
          <Text style={styles.subtitle}>
            Changes mirror directly to local SQLite and sync to Firestore.
          </Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Product Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Item Name *</Text>
            <View style={styles.inputWrapper}>
              <Package size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Coca-Cola 500ml"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          {/* Pricing Row */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Selling Price ({currency}) *</Text>
              <TextInput
                style={styles.inputWrapperDirect}
                placeholder="0.00"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Cost Price ({currency})</Text>
              <TextInput
                style={styles.inputWrapperDirect}
                placeholder="0.00"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={costPrice}
                onChangeText={setCostPrice}
              />
            </View>
          </View>

          {/* Stock & Low Stock Threshold */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Stock Quantity *</Text>
              <TextInput
                style={styles.inputWrapperDirect}
                placeholder="0"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={stock}
                onChangeText={setStock}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Low Stock Alert</Text>
              <TextInput
                style={styles.inputWrapperDirect}
                placeholder="5"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={lowStockThreshold}
                onChangeText={setLowStockThreshold}
              />
            </View>
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.inputWrapper}>
              <Layers size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                placeholder="General"
                placeholderTextColor="#94A3B8"
                value={category}
                onChangeText={setCategory}
              />
            </View>
            {/* Quick Category Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
              {defaultCategories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, category === cat && styles.chipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Barcode & SKU */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>SKU / Code</Text>
              <View style={styles.inputWrapper}>
                <Hash size={16} color="#94A3B8" style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.input}
                  placeholder="SKU-1001"
                  placeholderTextColor="#94A3B8"
                  value={sku}
                  onChangeText={setSku}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Barcode</Text>
              <View style={styles.inputWrapper}>
                <Barcode size={16} color="#94A3B8" style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.input}
                  placeholder="Barcode digits"
                  placeholderTextColor="#94A3B8"
                  value={barcode}
                  onChangeText={setBarcode}
                />
              </View>
            </View>
          </View>

          {/* Unit */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Unit of Measurement</Text>
            <TextInput
              style={styles.inputWrapperDirect}
              placeholder="e.g. pcs, kg, pack, box"
              placeholderTextColor="#94A3B8"
              value={unit}
              onChangeText={setUnit}
            />
          </View>
        </View>

        {/* Delete Action if editing */}
        {existingProduct ? (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Trash2 size={18} color="#EF4444" style={{ marginRight: 6 }} />
            <Text style={styles.deleteButtonText}>Delete Product From Catalog</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      {/* Save Button Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Save size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveButtonText}>
                {existingProduct ? 'Update Product' : 'Create Product'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    paddingBottom: 110,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
  },
  inputWrapperDirect: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    fontSize: 14,
    color: '#0F172A',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  chipsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: '#0F172A',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 16,
    elevation: 8,
  },
  saveButton: {
    backgroundColor: '#F47125',
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F47125',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

