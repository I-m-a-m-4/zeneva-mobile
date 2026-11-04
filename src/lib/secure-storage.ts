import AsyncStorage from '@react-native-async-storage/async-storage';

// In-memory synchronous cache mirror backed by AsyncStorage
const memoryStore = new Map<string, string>();
let isInitialized = false;

// Hydrate in-memory cache immediately on boot
(async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    if (keys && keys.length > 0) {
      const pairs = await AsyncStorage.multiGet(keys);
      for (const [key, val] of pairs) {
        if (val !== null) {
          memoryStore.set(key, val);
        }
      }
    }
  } catch (err) {
    console.warn('[secureStorage] Initial cache hydration failed:', err);
  } finally {
    isInitialized = true;
  }
})();

export const secureStorage = {
  isReady: () => isInitialized,

  /**
   * Initializes / reloads the cache from AsyncStorage.
   */
  init: async (): Promise<void> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      if (keys && keys.length > 0) {
        const pairs = await AsyncStorage.multiGet(keys);
        for (const [key, val] of pairs) {
          if (val !== null) {
            memoryStore.set(key, val);
          }
        }
      }
      isInitialized = true;
    } catch (err) {
      console.warn('[secureStorage] init failed:', err);
    }
  },

  /**
   * Saves data synchronously to memory and persists to AsyncStorage.
   */
  setItem: (key: string, value: any): boolean => {
    try {
      const stringValue = JSON.stringify(value);
      memoryStore.set(key, stringValue);
      AsyncStorage.setItem(key, stringValue).catch((err) => {
        console.warn(`[secureStorage] AsyncStorage write failed for key "${key}":`, err);
      });
      return true;
    } catch (error: any) {
      console.error('[secureStorage] setItem failed:', error);
      return false;
    }
  },

  /**
   * Retrieves data synchronously from the in-memory cache.
   */
  getItem: <T>(key: string): T | null => {
    try {
      const raw = memoryStore.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (error) {
      return null;
    }
  },

  /**
   * Retrieves data asynchronously directly from storage if not in memory.
   */
  getItemAsync: async <T>(key: string): Promise<T | null> => {
    try {
      let raw = memoryStore.get(key);
      if (!raw) {
        const fromDisk = await AsyncStorage.getItem(key);
        if (fromDisk) {
          memoryStore.set(key, fromDisk);
          raw = fromDisk;
        }
      }
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  /**
   * Removes an item
   */
  removeItem: (key: string): void => {
    memoryStore.delete(key);
    AsyncStorage.removeItem(key).catch(() => {});
  },

  /**
   * Clears all items
   */
  clear: (): void => {
    memoryStore.clear();
    AsyncStorage.clear().catch(() => {});
  }
};
