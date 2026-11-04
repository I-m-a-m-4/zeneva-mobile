import { Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Platform detection for React Native / Expo.
 */
export function isNativeApp(): boolean {
  return true;
}

export function apiBase(): string {
  const base = process.env.EXPO_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://zeneva.space';
  return base.replace(/\/+$/, '');
}

export function isMobileApp(): boolean {
  return Platform.OS === 'android' || Platform.OS === 'ios';
}

const FIRST_LAUNCH_KEY = 'zeneva_first_launch_at';
let firstLaunchCache: boolean | null = null;

export function isFirstLaunchEver(): boolean {
  if (firstLaunchCache !== null) return firstLaunchCache;
  return false;
}

export async function checkFirstLaunch(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
    firstLaunchCache = val === null;
    return firstLaunchCache;
  } catch {
    firstLaunchCache = false;
    return false;
  }
}

export async function markLaunched(): Promise<void> {
  firstLaunchCache = false;
  try {
    await AsyncStorage.setItem(FIRST_LAUNCH_KEY, new Date().toISOString());
  } catch {
    // In-memory memo still holds
  }
}

export function signedOutLandingRoute(): string {
  return 'Login';
}

export type UpdateChannel = 'play' | 'appstore' | 'web';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.zeneva.mobilepos';
const APP_STORE_URL = 'https://apps.apple.com/app/zeneva-mobile/id1234567890';

export function updateChannel(): UpdateChannel {
  if (Platform.OS === 'android') return 'play';
  if (Platform.OS === 'ios') return 'appstore';
  return 'web';
}

export function storeUrl(channel: UpdateChannel = updateChannel()): string | null {
  switch (channel) {
    case 'play':
      return PLAY_STORE_URL;
    case 'appstore':
      return APP_STORE_URL;
    default:
      return null;
  }
}

export function storeName(channel: UpdateChannel = updateChannel()): string {
  switch (channel) {
    case 'play':
      return 'Google Play';
    case 'appstore':
      return 'App Store';
    default:
      return 'Zeneva';
  }
}

export async function openStore(channel: UpdateChannel = updateChannel()): Promise<void> {
  const url = storeUrl(channel);
  if (url) {
    await Linking.openURL(url).catch(() => {});
  }
}

export async function openExternal(url: string): Promise<void> {
  if (!url) return;
  try {
    const can = await Linking.canOpenURL(url);
    if (can) {
      await Linking.openURL(url);
    }
  } catch (e) {
    console.warn('Failed to open external url:', url, e);
  }
}

export async function openStoreReview(): Promise<void> {
  const url = Platform.OS === 'android' ? 'market://details?id=com.zeneva.mobilepos' : APP_STORE_URL;
  try {
    await Linking.openURL(url);
  } catch {
    const fallback = storeUrl();
    if (fallback) await Linking.openURL(fallback).catch(() => {});
  }
}

export function isNewerVersion(latest: string, current: string): boolean {
  const parse = (v: string) =>
    String(v ?? '')
      .trim()
      .replace(/^v/i, '')
      .split('-')[0]
      .split('.')
      .map((n) => parseInt(n, 10) || 0);

  const a = parse(latest);
  const b = parse(current);
  for (let i = 0; i < Math.max(a.length, b.length, 3); i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x !== y) return x > y;
  }
  return false;
}
