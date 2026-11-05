import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, query, where, getDocs, orderBy, getDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { withFirestoreRetry, isOfflineError } from '@/firebase/retry';
import type { Branch } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface BranchContextType {
  activeBranchId: string;
  setActiveBranchId: (id: string) => void;
  branches: Branch[];
  isLoadingBranches: boolean;
  isMultiBranchEnabled: boolean;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [activeBranchId, setActiveBranchId] = useState<string>('all');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const lastLoadedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('zeneva_active_branch').then((cached) => {
      if (cached) setActiveBranchId(cached);
    }).catch(() => {});

    AsyncStorage.getItem('zeneva_cached_branches').then((str) => {
      if (str) {
        try {
          const list = JSON.parse(str);
          if (Array.isArray(list) && list.length > 0) {
            setBranches(list);
            setIsLoadingBranches(false);
          }
        } catch {}
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user || !firestore) {
      setIsLoadingBranches(false);
      return;
    }

    const loadBranches = async () => {
      try {
        setIsLoadingBranches(true);
        const targetUserId = user.uid;
        lastLoadedUserIdRef.current = targetUserId;

        const cacheKey = `zeneva_cached_business_id_${targetUserId}`;
        let businessId = await AsyncStorage.getItem(cacheKey);

        if (!businessId || businessId === 'undefined' || businessId === 'null') {
          const userDocRef = doc(firestore, 'users', targetUserId);
          const userDocSnap = await withFirestoreRetry(() => getDoc(userDocRef), {
            label: 'BranchProvider user profile',
          });
          if (userDocSnap.exists()) {
            businessId = userDocSnap.data().businessId;
          }
        }

        if (businessId) {
          await AsyncStorage.setItem(cacheKey, businessId);

          const branchesQuery = query(
            collection(firestore, 'branches'),
            where('businessId', '==', businessId),
            orderBy('createdAt', 'asc')
          );

          const businessDocRef = doc(firestore, 'businessInstances', businessId);

          const [branchesSnap, businessDocSnap] = await Promise.all([
            withFirestoreRetry(() => getDocs(branchesQuery), {
              label: 'BranchProvider branches',
            }),
            withFirestoreRetry(() => getDoc(businessDocRef), {
              label: 'BranchProvider business instance',
            }).catch(() => null),
          ]);

          let fetchedBranches = branchesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Branch));
          let correctPrimary = fetchedBranches.find((b) => b.id === businessId && b.isPrimary);

          let businessName = 'Main Store (Primary)';
          let businessAddress = '';
          if (businessDocSnap && businessDocSnap.exists()) {
            businessName = businessDocSnap.data().name || businessName;
            businessAddress = businessDocSnap.data().address || '';
          }

          if (!correctPrimary) {
            try {
              const primaryBranchRef = doc(firestore, 'branches', businessId);
              const newBranch = {
                businessId: businessId,
                name: businessName,
                address: businessAddress,
                isPrimary: true,
                isActive: true,
                createdAt: serverTimestamp(),
              };
              await setDoc(primaryBranchRef, newBranch);
              const createdBranch = {
                id: businessId,
                businessId: businessId,
                name: businessName,
                address: businessAddress,
                isPrimary: true,
                isActive: true,
                createdAt: new Date(),
              } as Branch;
              fetchedBranches = [createdBranch, ...fetchedBranches.filter((b) => b.id !== businessId)];
            } catch (createErr) {
              console.warn('Failed to write primary branch:', createErr);
            }
          }

          setBranches(fetchedBranches);
          await AsyncStorage.setItem('zeneva_cached_branches', JSON.stringify(fetchedBranches));

          if (fetchedBranches.length > 0 && activeBranchId !== 'all') {
            const isValid = fetchedBranches.some((b) => b.id === activeBranchId);
            if (!isValid) {
              setActiveBranchId('all');
            }
          }
        } else {
          setBranches([]);
        }
      } catch (err: any) {
        if (!isOfflineError(err)) {
          console.warn('Failed to load branches:', err);
        }
      } finally {
        setIsLoadingBranches(false);
      }
    };

    loadBranches();
  }, [user, firestore]);

  const handleSetActiveBranch = (id: string) => {
    setActiveBranchId(id);
    AsyncStorage.setItem('zeneva_active_branch', id).catch(() => {});
  };

  const value = {
    activeBranchId,
    setActiveBranchId: handleSetActiveBranch,
    branches,
    isLoadingBranches,
    isMultiBranchEnabled: branches.length > 1,
  };

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

const defaultBranchContext: BranchContextType = {
  activeBranchId: 'all',
  setActiveBranchId: () => {},
  branches: [],
  isLoadingBranches: false,
  isMultiBranchEnabled: false,
};

export function useBranch() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    return defaultBranchContext;
  }
  return context;
}
