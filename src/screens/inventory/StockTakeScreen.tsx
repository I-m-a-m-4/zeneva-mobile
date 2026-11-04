import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMobilePos } from '@/context/MobilePosContext';
import { useAuth } from '@/context/AuthContext';
import type { Product } from '@/types';
import { GlowInput } from '@/components/ui/GlowInput';
import { GlowButton } from '@/components/ui/GlowButton';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  Minus,
  Save,
  X,
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

  const currency = business?.settings?.currency || 'NGN';

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
    const current = item.stock || 0;
    const counted = counts[item.id] !== undefined ? counts[item.id] : current;
    const variance = counted - current;

    return (
      <View style={styles.stockItemCard}>
        <View style={styles.itemHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemSku}>
              SKU: {item.sku || 'N/A'} • System Stock: {current}
            </Text>
          </View>

          {variance !== 0 ? (
            <View
              style={[
                styles.varianceBadge,
                variance > 0 ? styles.variancePositive : styles.varianceNegative,
              ]}
            >
              <Text
                style={[
                  styles.varianceText,
                  variance > 0 ? styles.varianceTextPositive : styles.varianceTextNegative,
                ]}
              >
                {variance > 0 ? `+${variance}` : variance}
              </Text>
            </View>
          ) : (
            <View style={styles.varianceBadgeNeutral}>
              <Text style={styles.varianceTextNeutral}>Matched</Text>
            </View>
          )}
        </View>

        <View style={styles.countRow}>
          <Text style={styles.countLabel}>Physical Count:</Text>
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => updateCount(item.id, counted - 1)}
            >
              <Minus size={16} color="#0F172A" />
            </TouchableOpacity>

            <TextInput
              style={styles.countInput}
              keyboardType="numeric"
              value={counted.toString()}
              onChangeText={(txt) => updateCount(item.id, parseInt(txt, 10) || 0)}
            />

            <TouchableOpacity
              style={[styles.stepBtn, styles.stepBtnAdd]}
              onPress={() => updateCount(item.id, counted + 1)}
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
      {/* Top Search Bar */}
      <View style={styles.searchSection}>
        <GlowInput
          placeholder="Filter products to count..."
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

      {/* Product List */}
      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />

      {/* Floating Commit Bar */}
      <View style={styles.commitBar}>
        <GlowButton
          title="Commit Stock Take"
          icon={<Save size={18} color="#FFFFFF" />}
          onPress={handleCommitStockTake}
          isLoading={isCommitting}
          variant="primary"
          size="default"
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F8F6',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  stockItemCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  itemSku: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  varianceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  variancePositive: {
    backgroundColor: '#ECFDF5',
  },
  varianceNegative: {
    backgroundColor: '#FEF2F2',
  },
  varianceText: {
    fontSize: 12,
    fontWeight: '700',
  },
  varianceTextPositive: {
    color: '#10B981',
  },
  varianceTextNegative: {
    color: '#EF4444',
  },
  varianceBadgeNeutral: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  varianceTextNeutral: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  countLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnAdd: {
    backgroundColor: '#F47125',
  },
  countInput: {
    width: 50,
    height: 32,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    padding: 0,
  },
  commitBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 16,
  },
});
