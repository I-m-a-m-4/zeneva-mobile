import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Customer, Product, BusinessInstance, Receipt, UserProfile, QueuedAction, BusinessStats, AuditLog } from '@/types';

/**
 * Zeneva Offline Storage Bridge for React Native / Expo
 * Mirrors critical business data locally for complete offline resiliency.
 */

const STORAGE_PREFIX = 'zeneva_db_';

function tableKey(table: string, businessId?: string): string {
  return businessId ? `${STORAGE_PREFIX}${table}_${businessId}` : `${STORAGE_PREFIX}${table}`;
}

async function getJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function setJson(key: string, data: any): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`[sqlite-sync] setJson failed for key ${key}:`, err);
  }
}

export function offlineDbUsable(): boolean {
  return true;
}

export async function getOfflineDb() {
  return {
    usable: true,
  };
}

export async function getLastSyncMetadata(businessId: string): Promise<number | null> {
  try {
    const key = `${STORAGE_PREFIX}sync_metadata_${businessId}`;
    const raw = await AsyncStorage.getItem(key);
    return raw ? parseInt(raw, 10) : null;
  } catch {
    return null;
  }
}

export async function setLastSyncMetadata(businessId: string, timestamp: number): Promise<void> {
  try {
    const key = `${STORAGE_PREFIX}sync_metadata_${businessId}`;
    await AsyncStorage.setItem(key, timestamp.toString());
  } catch (err) {
    console.error('Offline setLastSyncMetadata error:', err);
  }
}

// ---------------- PRODUCTS ----------------

export async function syncProductsToOffline(businessId: string, products: Product[]): Promise<void> {
  try {
    const key = tableKey('products', businessId);
    await setJson(key, products);
  } catch (err) {
    console.error('Offline syncProductsToOffline error:', err);
  }
}

export async function syncProductToOffline(businessId: string, product: Product): Promise<void> {
  try {
    const key = tableKey('products', businessId);
    const existing = (await getJson<Product[]>(key)) || [];
    const index = existing.findIndex((p) => p.id === product.id);
    if (index >= 0) {
      existing[index] = product;
    } else {
      existing.unshift(product);
    }
    await setJson(key, existing);
  } catch (err) {
    console.error('Offline syncProductToOffline error:', err);
  }
}

export async function deleteMultipleProductsFromOffline(businessId: string, productIds: string[]): Promise<void> {
  try {
    const key = tableKey('products', businessId);
    const existing = (await getJson<Product[]>(key)) || [];
    const idSet = new Set(productIds);
    const filtered = existing.filter((p) => !idSet.has(p.id));
    await setJson(key, filtered);
  } catch (err) {
    console.error('Offline deleteMultipleProductsFromOffline error:', err);
  }
}

export async function getCachedProductsResult(businessId: string): Promise<{ products: Product[]; confirmedEmpty: boolean }> {
  try {
    const key = tableKey('products', businessId);
    const products = await getJson<Product[]>(key);
    if (products === null) {
      return { products: [], confirmedEmpty: false };
    }
    return { products, confirmedEmpty: products.length === 0 };
  } catch (err) {
    console.error('Offline getCachedProductsResult error:', err);
    return { products: [], confirmedEmpty: false };
  }
}

// ---------------- CUSTOMERS ----------------

export async function syncCustomersToOffline(businessId: string, customers: Customer[]): Promise<void> {
  try {
    const key = tableKey('customers', businessId);
    await setJson(key, customers);
  } catch (err) {
    console.error('Offline syncCustomersToOffline error:', err);
  }
}

export async function getCachedCustomers(businessId: string): Promise<Customer[]> {
  try {
    const key = tableKey('customers', businessId);
    return (await getJson<Customer[]>(key)) || [];
  } catch (err) {
    console.error('Offline getCachedCustomers error:', err);
    return [];
  }
}

export async function getCachedCustomersResult(businessId: string): Promise<{ customers: Customer[]; confirmedEmpty: boolean }> {
  try {
    const key = tableKey('customers', businessId);
    const customers = await getJson<Customer[]>(key);
    if (customers === null) {
      return { customers: [], confirmedEmpty: false };
    }
    return { customers, confirmedEmpty: customers.length === 0 };
  } catch (err) {
    console.error('Offline getCachedCustomersResult error:', err);
    return { customers: [], confirmedEmpty: false };
  }
}

// ---------------- RECEIPTS ----------------

function receiptCreatedAtSeconds(receipt: Receipt): number {
  if (receipt.createdAt && typeof (receipt.createdAt as any).seconds === 'number') {
    return (receipt.createdAt as any).seconds;
  }
  if (receipt.createdAt && typeof (receipt.createdAt as any).toDate === 'function') {
    return Math.floor((receipt.createdAt as any).toDate().getTime() / 1000);
  }
  if (receipt.createdAt) {
    const d = new Date(receipt.createdAt as any);
    if (!isNaN(d.getTime())) return Math.floor(d.getTime() / 1000);
  }
  return Math.floor(Date.now() / 1000);
}

export async function syncReceiptsToOffline(businessId: string, receipts: Receipt[]): Promise<void> {
  try {
    const key = tableKey('receipts', businessId);
    const existing = (await getJson<Receipt[]>(key)) || [];
    const map = new Map<string, Receipt>();
    for (const r of existing) map.set(r.id, r);
    for (const r of receipts) map.set(r.id, r);
    const sorted = Array.from(map.values()).sort((a, b) => receiptCreatedAtSeconds(b) - receiptCreatedAtSeconds(a));
    await setJson(key, sorted.slice(0, 500));
  } catch (err) {
    console.error('Offline syncReceiptsToOffline error:', err);
  }
}

export async function syncReceiptToOffline(businessId: string, receipt: Receipt): Promise<void> {
  try {
    const key = tableKey('receipts', businessId);
    const existing = (await getJson<Receipt[]>(key)) || [];
    const filtered = existing.filter((r) => r.id !== receipt.id);
    filtered.unshift(receipt);
    filtered.sort((a, b) => receiptCreatedAtSeconds(b) - receiptCreatedAtSeconds(a));
    await setJson(key, filtered.slice(0, 500));
  } catch (err) {
    console.error('Offline syncReceiptToOffline error:', err);
  }
}

export async function deleteReceiptFromOffline(receiptId: string): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const receiptKeys = allKeys.filter((k) => k.startsWith(`${STORAGE_PREFIX}receipts_`));
    for (const k of receiptKeys) {
      const list = (await getJson<Receipt[]>(k)) || [];
      const updated = list.filter((r) => r.id !== receiptId);
      if (updated.length !== list.length) {
        await setJson(k, updated);
      }
    }
  } catch (err) {
    console.error('Offline deleteReceiptFromOffline error:', err);
  }
}

export async function getCachedReceipts(businessId: string, limitCount: number = 50): Promise<Receipt[]> {
  try {
    const key = tableKey('receipts', businessId);
    const receipts = (await getJson<Receipt[]>(key)) || [];
    return receipts.slice(0, limitCount);
  } catch (err) {
    console.error('Offline getCachedReceipts error:', err);
    return [];
  }
}

export async function getCachedCustomerReceipts(businessId: string, customerId: string): Promise<Receipt[]> {
  try {
    const key = tableKey('receipts', businessId);
    const receipts = (await getJson<Receipt[]>(key)) || [];
    return receipts.filter((r) => r.customer?.id === customerId);
  } catch (err) {
    console.error('Offline getCachedCustomerReceipts error:', err);
    return [];
  }
}

// ---------------- BUSINESS & STATS ----------------

export async function syncBusinessToOffline(business: BusinessInstance): Promise<void> {
  try {
    const key = `${STORAGE_PREFIX}business_${business.id}`;
    await setJson(key, business);
  } catch (err) {
    console.error('Offline syncBusinessToOffline error:', err);
  }
}

export async function getCachedBusiness(businessId: string): Promise<BusinessInstance | null> {
  try {
    const key = `${STORAGE_PREFIX}business_${businessId}`;
    return await getJson<BusinessInstance>(key);
  } catch (err) {
    console.error('Offline getCachedBusiness error:', err);
    return null;
  }
}

export async function syncStatsToOffline(businessId: string, stats: BusinessStats): Promise<void> {
  try {
    const key = tableKey('stats', businessId);
    await setJson(key, stats);
  } catch (err) {
    console.error('Offline syncStatsToOffline error:', err);
  }
}

export async function getCachedStats(businessId: string): Promise<BusinessStats | null> {
  try {
    const key = tableKey('stats', businessId);
    return await getJson<BusinessStats>(key);
  } catch (err) {
    console.error('Offline getCachedStats error:', err);
    return null;
  }
}

// ---------------- USERS & PROFILES ----------------

export async function syncProfileToOffline(profile: UserProfile): Promise<void> {
  try {
    const key = `${STORAGE_PREFIX}profile_${profile.id || profile.email}`;
    await setJson(key, profile);
  } catch (err) {
    console.error('Offline syncProfileToOffline error:', err);
  }
}

export async function getCachedProfile(userId: string): Promise<UserProfile | null> {
  try {
    const key = `${STORAGE_PREFIX}profile_${userId}`;
    return await getJson<UserProfile>(key);
  } catch (err) {
    console.error('Offline getCachedProfile error:', err);
    return null;
  }
}

export async function syncUsersToOffline(businessId: string, users: UserProfile[]): Promise<void> {
  try {
    const key = tableKey('users', businessId);
    await setJson(key, users);
  } catch (err) {
    console.error('Offline syncUsersToOffline error:', err);
  }
}

export async function getCachedUsers(businessId: string): Promise<UserProfile[]> {
  try {
    const key = tableKey('users', businessId);
    return (await getJson<UserProfile[]>(key)) || [];
  } catch (err) {
    console.error('Offline getCachedUsers error:', err);
    return [];
  }
}

// ---------------- AUDIT LOGS ----------------

export async function syncAuditLogsToOffline(businessId: string, logs: AuditLog[]): Promise<void> {
  try {
    const key = tableKey('audit_logs', businessId);
    await setJson(key, logs);
  } catch (err) {
    console.error('Offline syncAuditLogsToOffline error:', err);
  }
}

export async function getCachedAuditLogs(businessId: string): Promise<AuditLog[]> {
  try {
    const key = tableKey('audit_logs', businessId);
    return (await getJson<AuditLog[]>(key)) || [];
  } catch (err) {
    console.error('Offline getCachedAuditLogs error:', err);
    return [];
  }
}

// ---------------- OFFLINE QUEUE ----------------

const QUEUE_KEY = `${STORAGE_PREFIX}sync_queue`;

export async function saveActionToOfflineQueue(action: QueuedAction): Promise<void> {
  try {
    const queue = (await getJson<QueuedAction[]>(QUEUE_KEY)) || [];
    const index = queue.findIndex((q) => q.id === action.id);
    if (index >= 0) {
      queue[index] = action;
    } else {
      queue.push(action);
    }
    await setJson(QUEUE_KEY, queue);
  } catch (err) {
    console.error('Offline saveActionToOfflineQueue error:', err);
  }
}

export async function getOfflineQueue(): Promise<QueuedAction[]> {
  try {
    const queue = (await getJson<QueuedAction[]>(QUEUE_KEY)) || [];
    return queue.filter((q) => (q as any).status !== 'synced');
  } catch (err) {
    console.error('Offline getOfflineQueue error:', err);
    return [];
  }
}

export async function removeActionFromOfflineQueue(actionId: string): Promise<void> {
  try {
    const queue = (await getJson<QueuedAction[]>(QUEUE_KEY)) || [];
    const filtered = queue.filter((q) => q.id !== actionId);
    await setJson(QUEUE_KEY, filtered);
  } catch (err) {
    console.error('Offline removeActionFromOfflineQueue error:', err);
  }
}

// ---------------- ANALYTICS & REVENUE ----------------

export async function getMonthlyRevenue(businessId: string, monthCount: number = 12): Promise<{ month: string; revenue: number }[]> {
  try {
    const receipts = await getCachedReceipts(businessId, 500);
    const monthsMap = new Map<string, number>();

    for (const r of receipts) {
      const s = receiptCreatedAtSeconds(r);
      const d = new Date(s * 1000);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const rev = Number(r.total) || 0;
      monthsMap.set(mStr, (monthsMap.get(mStr) || 0) + rev);
    }

    const sortedMonths = Array.from(monthsMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, monthCount);

    return sortedMonths.map(([month, revenue]) => ({ month, revenue }));
  } catch (err) {
    console.error('Offline getMonthlyRevenue error:', err);
    return [];
  }
}

export async function clearAllTables(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const zenevaKeys = allKeys.filter((k) => k.startsWith(STORAGE_PREFIX));
    if (zenevaKeys.length > 0) {
      await AsyncStorage.multiRemove(zenevaKeys);
    }
  } catch (err) {
    console.error('Offline clearAllTables error:', err);
  }
}
