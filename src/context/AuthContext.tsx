import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, firestore } from '@/firebase/instance';
import { createUserProfileDocument } from '@/firebase/users';
import type { UserProfile, BusinessInstance } from '@/types';
import { secureStorage } from '@/lib/secure-storage';
import { syncProfileToOffline, getCachedProfile, syncBusinessToOffline, getCachedBusiness } from '@/lib/sqlite-sync';

const PIN_STORAGE_KEY = 'zeneva_mobile_security_pin';
const PIN_LOCKED_KEY = 'zeneva_mobile_is_locked';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  business: BusinessInstance | null;
  isLoading: boolean;
  isLocked: boolean;
  hasPin: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, businessName: string, phone?: string) => Promise<void>;
  signOut: () => Promise<void>;
  lockApp: () => void;
  unlockApp: (enteredPin: string) => boolean;
  setPin: (newPin: string) => Promise<void>;
  reloadProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [business, setBusiness] = useState<BusinessInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [storedPin, setStoredPin] = useState<string | null>(null);

  // Check stored PIN on boot
  useEffect(() => {
    AsyncStorage.getItem(PIN_STORAGE_KEY).then((pin) => {
      if (pin) {
        setStoredPin(pin);
        AsyncStorage.getItem(PIN_LOCKED_KEY).then((locked) => {
          if (locked === 'true') {
            setIsLocked(true);
          }
        }).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  const fetchProfileAndBusiness = useCallback(async (uid: string) => {
    try {
      // 1. Try offline cache first for instant paint
      const cachedProf = await getCachedProfile(uid);
      if (cachedProf) {
        setUserProfile(cachedProf);
        if (cachedProf.businessId) {
          const cachedBiz = await getCachedBusiness(cachedProf.businessId);
          if (cachedBiz) setBusiness(cachedBiz);
        }
      }

      // 2. Fetch fresh user profile from Firestore
      const userRef = doc(firestore, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const profData = { id: userSnap.id, ...userSnap.data() } as UserProfile;
        setUserProfile(profData);
        await syncProfileToOffline(profData);

        if (profData.businessId) {
          const bizRef = doc(firestore, 'businessInstances', profData.businessId);
          const bizSnap = await getDoc(bizRef);
          if (bizSnap.exists()) {
            const bizData = { id: bizSnap.id, ...bizSnap.data() } as BusinessInstance;
            setBusiness(bizData);
            await syncBusinessToOffline(bizData);
          }
        }
      }
    } catch (err) {
      console.warn('[AuthProvider] Profile fetch error (offline mode active):', err);
    }
  }, []);

  // Listen to Auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfileAndBusiness(currentUser.uid);
      } else {
        setUserProfile(null);
        setBusiness(null);
      }
      setIsLoading(false);
    });

    return () => unsub();
  }, [fetchProfileAndBusiness]);

  const signInWithEmail = async (email: string, pass: string): Promise<void> => {
    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      setUser(cred.user);
      await fetchProfileAndBusiness(cred.user.uid);
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    name: string,
    businessName: string,
    phone?: string
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      setUser(cred.user);
      await createUserProfileDocument(firestore, cred.user, name, phone, null, businessName);
      await fetchProfileAndBusiness(cred.user.uid);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await fbSignOut(auth);
      setUser(null);
      setUserProfile(null);
      setBusiness(null);
      setIsLocked(false);
      await AsyncStorage.removeItem(PIN_LOCKED_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  const lockApp = () => {
    if (storedPin) {
      setIsLocked(true);
      AsyncStorage.setItem(PIN_LOCKED_KEY, 'true').catch(() => {});
    }
  };

  const unlockApp = (enteredPin: string): boolean => {
    if (!storedPin || enteredPin === storedPin) {
      setIsLocked(false);
      AsyncStorage.setItem(PIN_LOCKED_KEY, 'false').catch(() => {});
      return true;
    }
    return false;
  };

  const setPin = async (newPin: string): Promise<void> => {
    setStoredPin(newPin);
    await AsyncStorage.setItem(PIN_STORAGE_KEY, newPin);
  };

  const reloadProfile = async () => {
    if (user?.uid) {
      await fetchProfileAndBusiness(user.uid);
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    business,
    isLoading,
    isLocked,
    hasPin: !!storedPin,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    lockApp,
    unlockApp,
    setPin,
    reloadProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

