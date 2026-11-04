import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMobilePos } from '@/context/MobilePosContext';
import { useAuth } from '@/context/AuthContext';
import type { Product } from '@/types';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  RotateCcw,
  Plus,
  Minus,
  Save,
  Barcode,
} from 'lucide-react-native';

interface CountMap {
  [productId: string]: number;
}

export function StockTakeScreen() {
  const navigation = useNavigation();
  const { products, saveProduct } = useMobilePos();
  const { business } = useAuth();

  const [search, setSearch] = useState('');
  const [counts, setCounts] = useState<CountMap>(() => {
    const init: CountMap = {};
    products.forEach((p) => {
      init[p.id] = p.stock || 0;
    });
    return init;
  });
  const [isCommitting, setIsCommitting] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q))
    );
  }, [products, search]);

  const updateCount = (productId: string, val: number) => {
    setCounts((prev) => ({
      ...prev,
      [productId]: Math.max(0, val),
    }));
  };

  const handleCommitStockTake = async () => {
    const changes: { product: Product; newCount: number }[] = [];
    products.forEach((p) => {
      const counted = counts[p.id];
      if (counted !== undefined && counted !== (p.stock || 0)) {
        changes.push({ product: p, newCount: counted });
      }
    });

    if (changes.length === 0) {
      Alert.alert('No Changes', 'All counted quantities match current catalog stock.');
      return;
    }

    Alert.alert(
      'Commit Stock Take',
      `Apply verified counts for ${changes.length} items to inventory? This will overwrite existing stock quantities.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Commit',
          style: 'default',
          onPress: async () => {
            setIsCommitting(true);
            try {
              for (const change of changes) {
                await saveProduct({
                  ...change.product,
                  stock: change.newCount,
                });
              }
              Alert.alert('Success', `Updated stock levels for ${changes.length} products.`);
              navigation.goBack();
            } catch (err: any) {
              Alert.alert('Commit Error', err?.message || 'Failed to apply stock take.');
            } finally {
              setIsCommitting(false);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Product }) => {
    const systemQty = item.stock || 0;
    const countedQty = counts[item.id] !== undefined ? counts[item.id] : systemQty;
    const diff = countedQty - systemQty;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemMeta}>
              {item.sku ? `SKU: ${item.sku}` : ''} {item.barcode ? `• Barcode: ${item.barcode}` : ''}
            </Text>
          </View>

          {/* Difference badge */}
          {diff !== 0 ? (
            <View
              style={[
                styles.diffBadge,
                diff > 0 ? styles.diffBadgeGreen : styles.diffBadgeRed,
              ]}
            >
              <Text
                style={[
                  styles.diffText,
                  diff > 0 ? styles.diffTextGreen : styles.diffTextRed,
                ]}
              >
                {diff > 0 ? `+${diff}` : diff}
              </Text>
            </View>
          ) : (
            <View style={styles.matchBadge}>
              <CheckCircle2 size={16} color="#10B981" />
            </View>
          )}
        </View>

        <View style={styles.cardBottom}>
          <View>
            <Text style={styles.metricLabel}>System Record</Text>
            <Text style={styles.metricValue}>
              {systemQty} {item.unit || 'pcs'}
            </Text>
          </View>

          {/* Stepper Count Controls */}
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => updateCount(item.id, countedQty - 1)}
            >
              <Minus size={16} color="#0F172A" />
            </TouchableOpacity>

            <TextInput
              style={styles.countInput}
              keyboardType="numeric"
              value={countedQty.toString()}
              onChangeText={(val) => updateCount(item.id, parseInt(val, 10) || 0)}
            />

            <TouchableOpacity
              style={[styles.stepBtn, styles.stepBtnAdd]}
              onPress={() => updateCount(item.id, countedQty + 1)}
            >
              <Plus size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Rapid Stock-Take</Text>
          <Text style={styles.headerSubtitle}>
            Physical audit & inventory reconciliation
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Search size={18} color="#94A3B8" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Filter by name, barcode or SKU..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />

      {/* Commit Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.commitBtn, isCommitting && { opacity: 0.7 }]}
          onPress={handleCommitStockTake}
          disabled={isCommitting}
          activeOpacity={0.8}
        >
          {isCommitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Save size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.commitBtnText}>Reconcile & Commit Counts</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemMeta: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  diffBadgeGreen: { backgroundColor: '#ECFDF5' },
  diffBadgeRed: { backgroundColor: '#FEF2F2' },
  diffText: {
    fontSize: 12,
    fontWeight: '700',
  },
  diffTextGreen: { color: '#10B981' },
  diffTextRed: { color: '#EF4444' },
  matchBadge: {
    padding: 4,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnAdd: {
    backgroundColor: '#F47125',
  },
  countInput: {
    width: 50,
    height: 34,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginHorizontal: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  commitBtn: {
    backgroundColor: '#F47125',
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

