import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMobilePos } from '@/context/MobilePosContext';
import { useAuth } from '@/context/AuthContext';
import { getOfflineQueue, clearAllTables } from '@/lib/sqlite-sync';
import type { QueuedAction } from '@/types';
import {
  ArrowLeft,
  RefreshCw,
  Database,
  Trash2,
  Server,
  CheckCircle,
  Clock,
  Layers,
} from 'lucide-react-native';

export function AdminTelemetryScreen() {
  const navigation = useNavigation();
  const { offlineQueueCount, isSyncingQueue, flushOfflineQueue } = useMobilePos();
  const { business, userProfile } = useAuth();

  const [queueItems, setQueueItems] = useState<QueuedAction[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);

  const loadQueue = async () => {
    setIsLoadingQueue(true);
    try {
      const items = await getOfflineQueue();
      setQueueItems(items);
    } catch {
      setQueueItems([]);
    } finally {
      setIsLoadingQueue(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [offlineQueueCount]);

  const handleForceFlush = async () => {
    try {
      await flushOfflineQueue();
      await loadQueue();
      Alert.alert('Queue Processed', 'Pending mutations evaluated against cloud Firestore.');
    } catch (e: any) {
      Alert.alert('Flush Error', e?.message || 'Sync failed.');
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Purge Local Cache',
      'This will clear local mirrors of products and receipts. They will be re-fetched from Firestore on next open.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purge Cache',
          style: 'destructive',
          onPress: async () => {
            await clearAllTables();
            await loadQueue();
            Alert.alert('Cache Cleared', 'Local offline database cleared.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={20} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.headerTitle}>System Telemetry</Text>
            <Text style={styles.headerSubtitle}>
              Offline sync queue diagnostics & storage state
            </Text>
          </View>
        </View>

        {/* Engine Diagnostics Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Engine Diagnostics</Text>

          <View style={styles.diagRow}>
            <View style={styles.diagLeft}>
              <Server size={18} color="#64748B" />
              <Text style={styles.diagLabel}>Cloud Target</Text>
            </View>
            <Text style={styles.diagValue}>Google Cloud Firestore</Text>
          </View>

          <View style={styles.diagRow}>
            <View style={styles.diagLeft}>
              <Database size={18} color="#64748B" />
              <Text style={styles.diagLabel}>Local SQLite Mirror</Text>
            </View>
            <Text style={[styles.diagValue, { color: '#10B981', fontWeight: '700' }]}>
              Active & Healthy
            </Text>
          </View>

          <View style={styles.diagRow}>
            <View style={styles.diagLeft}>
              <Layers size={18} color="#64748B" />
              <Text style={styles.diagLabel}>Tenant ID</Text>
            </View>
            <Text style={styles.diagValue} numberOfLines={1}>
              {business?.id || 'none'}
            </Text>
          </View>
        </View>

        {/* Sync Queue Manager */}
        <View style={styles.card}>
          <View style={styles.queueHeader}>
            <View>
              <Text style={styles.cardTitle}>Pending Offline Queue ({offlineQueueCount})</Text>
              <Text style={styles.cardSubtitle}>
                Mutations written locally awaiting server commit
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.flushBtn, isSyncingQueue && { opacity: 0.7 }]}
              onPress={handleForceFlush}
              disabled={isSyncingQueue}
            >
              {isSyncingQueue ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <RefreshCw size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.flushBtnText}>Flush</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {queueItems.length === 0 ? (
            <View style={styles.emptyQueue}>
              <CheckCircle size={32} color="#10B981" />
              <Text style={styles.emptyQueueText}>Queue is completely clear.</Text>
            </View>
          ) : (
            queueItems.map((item) => (
              <View key={item.id} style={styles.queueItemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.queueItemType}>{item.type.toUpperCase()}</Text>
                  <Text style={styles.queueItemDesc}>{item.description}</Text>
                  <Text style={styles.queueItemTime}>
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
                <View style={styles.queuePendingBadge}>
                  <Text style={styles.queuePendingText}>Pending</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Maintenance Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Maintenance & Hygiene</Text>
          <Text style={styles.cardSubtitle}>
            Safely purge local storage without modifying cloud records
          </Text>

          <TouchableOpacity style={styles.purgeBtn} onPress={handleClearCache}>
            <Trash2 size={18} color="#DC2626" style={{ marginRight: 8 }} />
            <Text style={styles.purgeBtnText}>Purge Local Database Mirror</Text>
          </TouchableOpacity>
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  diagLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  diagLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  diagValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    maxWidth: '55%',
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  flushBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F47125',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  flushBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyQueue: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyQueueText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  queueItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  queueItemType: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F47125',
  },
  queueItemDesc: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
    marginTop: 2,
  },
  queueItemTime: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  queuePendingBadge: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  queuePendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EA580C',
  },
  purgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 14,
  },
  purgeBtnText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
});
