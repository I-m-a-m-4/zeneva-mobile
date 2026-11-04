import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'idb_keyval_';

export const idb = {
  dbPromise: Promise.resolve(true),

  async get<T>(key: string): Promise<T | null> {
    try {
      const val = await AsyncStorage.getItem(PREFIX + key);
      if (!val) return null;
      return JSON.parse(val) as T;
    } catch {
      return null;
    }
  },

  async set(key: string, val: any): Promise<void> {
    try {
      await AsyncStorage.setItem(PREFIX + key, JSON.stringify(val));
    } catch (e) {
      console.warn('[idb] set failed for key:', key, e);
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(PREFIX + key);
    } catch (e) {
      console.warn('[idb] remove failed for key:', key, e);
    }
  },

  async clear(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const idbKeys = allKeys.filter((k) => k.startsWith(PREFIX));
      if (idbKeys.length > 0) {
        await AsyncStorage.multiRemove(idbKeys);
      }
    } catch (e) {
      console.warn('[idb] clear failed:', e);
    }
  }
};
