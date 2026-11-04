import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  doc,
  query,
  where,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import { firestore } from '@/firebase/instance';
import { useAuth } from './AuthContext';
import { useBranch } from './branch-context';
import type {
  Product,
  Customer,
  CartItem,
  Receipt,
  QueuedAction,
  AuditLog,
  HeldSale,
  BusinessInstance,
} from '@/types';
import {
  syncProductsToOffline,
  syncProductToOffline,
  deleteMultipleProductsFromOffline,
  getCachedProductsResult,
  syncCustomersToOffline,
  getCachedCustomers,
  syncReceiptsToOffline,
  syncReceiptToOffline,
  getCachedReceipts,
  saveActionToOfflineQueue,
  getOfflineQueue,
  removeActionFromOfflineQueue,
  syncAuditLogsToOffline,
  getCachedAuditLogs,
} from '@/lib/sqlite-sync';
import { useToast } from '@/hooks/use-toast';

export type PaymentMethod = 'Cash' | 'Card' | 'Bank Transfer' | 'Invoice' | 'cash' | 'card' | 'bank_transfer' | 'store_credit';

interface MobilePosContextType {
  // Catalog
  products: Product[];
  isLoadingProducts: boolean;
  refreshProducts: () => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categories: string[];

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartItemCount: number;
  cartSubtotal: number;
  cartDiscount: number;
  cartTax: number;
  cartTotal: number;
  discountType: 'percentage' | 'fixed';
  setDiscountType: (type: 'percentage' | 'fixed') => void;
  discountValue: number;
  setDiscountValue: (val: number) => void;
  taxRate: number;
  setTaxRate: (rate: number) => void;

  // Customer
  customers: Customer[];
  selectedCustomer: Customer | null;
  selectCustomer: (customer: Customer | null) => void;
  addCustomer: (customerData: Omit<Customer, 'id' | 'businessId' | 'createdAt'>) => Promise<Customer>;
  refreshCustomers: () => Promise<void>;

  // Payment & Sale
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  amountTendered: number;
  setAmountTendered: (amount: number) => void;
  changeDue: number;
  completeSale: (notes?: string) => Promise<Receipt>;
  lastReceipt: Receipt | null;
  receipts: Receipt[];

  // Held Sales
  heldSales: HeldSale[];
  holdCurrentSale: (note?: string) => Promise<void>;
  resumeHeldSale: (heldSaleId: string) => void;
  discardHeldSale: (heldSaleId: string) => void;

  // Offline & Choke-point
  offlineQueueCount: number;
  isSyncingQueue: boolean;
  addToQueue: (action: Omit<QueuedAction, 'id' | 'timestamp' | 'status'>) => Promise<void>;
  flushOfflineQueue: () => Promise<void>;

  // Product mutations (routed through addToQueue)
  saveProduct: (product: Partial<Product> & { name: string; price: number }) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
}

const MobilePosContext = createContext<MobilePosContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'zeneva_mobile_cart';
const HELD_SALES_STORAGE_KEY = 'zeneva_mobile_held_sales';

export function MobilePosProvider({ children }: { children: ReactNode }) {
  const { user, userProfile, business } = useAuth();
  const { activeBranchId } = useBranch();
  const { toast } = useToast();

  const businessId = userProfile?.businessId || business?.id || '';

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [taxRate, setTaxRate] = useState(0);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [amountTendered, setAmountTendered] = useState(0);
  const [lastReceipt, setLastReceipt] = useState<Receipt | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  const [heldSales, setHeldSales] = useState<HeldSale[]>([]);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [isSyncingQueue, setIsSyncingQueue] = useState(false);

  // Restore cart and held sales from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(CART_STORAGE_KEY).then((data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) setCart(parsed);
        } catch {}
      }
    }).catch(() => {});

    AsyncStorage.getItem(HELD_SALES_STORAGE_KEY).then((data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) setHeldSales(parsed);
        } catch {}
      }
    }).catch(() => {});

    getOfflineQueue().then((q) => {
      setOfflineQueueCount(q.length);
    }).catch(() => {});
  }, []);

  // Save cart changes
  useEffect(() => {
    AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart)).catch(() => {});
  }, [cart]);

  // Save held sales changes
  useEffect(() => {
    AsyncStorage.setItem(HELD_SALES_STORAGE_KEY, JSON.stringify(heldSales)).catch(() => {});
  }, [heldSales]);

  // Load products from offline cache, then sync from Firestore
  const refreshProducts = useCallback(async () => {
    if (!businessId) return;
    setIsLoadingProducts(true);

    try {
      const cached = await getCachedProductsResult(businessId);
      if (cached.products.length > 0) {
        setProducts(cached.products);
      }

      const pQuery = query(collection(firestore, 'products'), where('businessId', '==', businessId));
      const snap = await getDocs(pQuery);
      const fetched: Product[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));

      setProducts(fetched);
      await syncProductsToOffline(businessId, fetched);
    } catch (err) {
      console.warn('[MobilePosContext] Products load error (continuing offline):', err);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [businessId]);

  // Load customers
  const refreshCustomers = useCallback(async () => {
    if (!businessId) return;
    try {
      const cached = await getCachedCustomers(businessId);
      if (cached.length > 0) setCustomers(cached);

      const cQuery = query(collection(firestore, 'customers'), where('businessId', '==', businessId));
      const snap = await getDocs(cQuery);
      const fetched: Customer[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Customer));

      setCustomers(fetched);
      await syncCustomersToOffline(businessId, fetched);
    } catch (err) {
      console.warn('[MobilePosContext] Customers load error (continuing offline):', err);
    }
  }, [businessId]);

  // Load recent receipts
  const refreshReceipts = useCallback(async () => {
    if (!businessId) return;
    try {
      const cached = await getCachedReceipts(businessId, 50);
      if (cached.length > 0) setReceipts(cached);

      const rQuery = query(
        collection(firestore, 'receipts'),
        where('businessId', '==', businessId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const snap = await getDocs(rQuery);
      const fetched: Receipt[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Receipt));
      setReceipts(fetched);
      await syncReceiptsToOffline(businessId, fetched);
    } catch (err) {
      console.warn('[MobilePosContext] Receipts load error (continuing offline):', err);
    }
  }, [businessId]);

  useEffect(() => {
    if (businessId) {
      refreshProducts();
      refreshCustomers();
      refreshReceipts();
    }
  }, [businessId, refreshProducts, refreshCustomers, refreshReceipts]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    set.add('All');
    for (const p of products) {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    }
    return Array.from(set);
  }, [products]);

  // Cart operations
  const addToCart = useCallback((product: Product, quantity = 1) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
        };
        return updated;
      }
      return [
        ...prev,
        {
          product,
          quantity,
        },
      ];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          return {
            ...item,
            quantity,
          };
        }
        return item;
      })
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
    setSelectedCustomer(null);
    setDiscountValue(0);
    setAmountTendered(0);
  }, []);

  // Cart calculations
  const cartItemCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);

  const cartSubtotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity * (item.product.price || 0), 0),
    [cart]
  );

  const cartDiscount = useMemo(() => {
    if (discountValue <= 0) return 0;
    if (discountType === 'percentage') {
      return Math.round((cartSubtotal * Math.min(discountValue, 100)) / 100);
    }
    return Math.min(discountValue, cartSubtotal);
  }, [cartSubtotal, discountType, discountValue]);

  const cartTax = useMemo(() => {
    if (taxRate <= 0) return 0;
    const taxableAmount = Math.max(0, cartSubtotal - cartDiscount);
    return Math.round((taxableAmount * taxRate) / 100);
  }, [cartSubtotal, cartDiscount, taxRate]);

  const cartTotal = useMemo(() => {
    return Math.max(0, cartSubtotal - cartDiscount + cartTax);
  }, [cartSubtotal, cartDiscount, cartTax]);

  const changeDue = useMemo(() => {
    if (paymentMethod !== 'Cash' && paymentMethod !== 'cash') return 0;
    return Math.max(0, amountTendered - cartTotal);
  }, [amountTendered, cartTotal, paymentMethod]);

  // Customer selection
  const selectCustomer = useCallback((customer: Customer | null) => {
    setSelectedCustomer(customer);
  }, []);

  // LAW 1 WRITE CHOKE-POINT: addToQueue
  const addToQueue = useCallback(
    async (actionData: Omit<QueuedAction, 'id' | 'timestamp' | 'status'>) => {
      const action: QueuedAction = {
        id: `qa_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        timestamp: Date.now(),
        status: 'pending',
        ...actionData,
      };

      await saveActionToOfflineQueue(action);
      const currentQueue = await getOfflineQueue();
      setOfflineQueueCount(currentQueue.length);

      flushOfflineQueue().catch(() => {});
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Synchronize queued actions with Firestore
  const flushOfflineQueue = useCallback(async () => {
    if (isSyncingQueue) return;
    setIsSyncingQueue(true);

    try {
      const queue = await getOfflineQueue();
      for (const action of queue) {
        try {
          if (action.type === 'complete-sale' || action.type === 'create_receipt') {
            const receiptData = action.payload;
            const rRef = doc(firestore, 'receipts', receiptData.id);
            await setDoc(rRef, {
              ...receiptData,
              syncedAt: serverTimestamp(),
            });

            if (Array.isArray(receiptData.items)) {
              for (const item of receiptData.items) {
                if (item.productId) {
                  const pRef = doc(firestore, 'products', item.productId);
                  const pSnap = await getDocs(query(collection(firestore, 'products'), where('__name__', '==', item.productId)));
                  if (!pSnap.empty) {
                    const currentStock = pSnap.docs[0].data().stock || 0;
                    await updateDoc(pRef, {
                      stock: Math.max(0, currentStock - item.quantity),
                      updatedAt: serverTimestamp(),
                    });
                  }
                }
              }
            }
          } else if (action.type === 'add-product' || action.type === 'create_product') {
            const pRef = doc(firestore, 'products', action.payload.id);
            await setDoc(pRef, { ...action.payload, createdAt: serverTimestamp() });
          } else if (action.type === 'update-product') {
            const pRef = doc(firestore, 'products', action.payload.id);
            await updateDoc(pRef, { ...action.payload, updatedAt: serverTimestamp() });
          } else if (action.type === 'delete-product') {
            const pRef = doc(firestore, 'products', action.payload.id);
            await deleteDoc(pRef);
          } else if (action.type === 'add-customer' || action.type === 'create_customer') {
            const cRef = doc(firestore, 'customers', action.payload.id);
            await setDoc(cRef, { ...action.payload, createdAt: serverTimestamp() });
          }

          await removeActionFromOfflineQueue(action.id);
        } catch (itemErr) {
          console.warn('[MobilePosContext] Error processing queue item:', action.id, itemErr);
          break;
        }
      }

      const remaining = await getOfflineQueue();
      setOfflineQueueCount(remaining.length);
    } catch (err) {
      console.warn('[MobilePosContext] Queue flush aborted:', err);
    } finally {
      setIsSyncingQueue(false);
    }
  }, [isSyncingQueue]);

  // Complete Sale
  const completeSale = useCallback(
    async (notes?: string): Promise<Receipt> => {
      if (cart.length === 0) {
        throw new Error('Cart is empty.');
      }

      const receiptId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date();

      const receiptItems = cart.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        costPrice: item.product.costPrice,
      }));

      const newReceipt: Receipt = {
        id: receiptId,
        businessId,
        branchId: activeBranchId !== 'all' ? activeBranchId : businessId,
        cashierId: user?.uid || 'guest_cashier',
        cashierName: userProfile?.name || 'Cashier',
        customer: selectedCustomer
          ? { id: selectedCustomer.id, name: selectedCustomer.name, email: selectedCustomer.email }
          : undefined,
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.name,
        customerPhone: selectedCustomer?.phone,
        items: receiptItems,
        subtotal: cartSubtotal,
        discount: cartDiscount,
        tax: cartTax,
        total: cartTotal,
        paymentMethod,
        amountTendered: (paymentMethod === 'Cash' || paymentMethod === 'cash') ? amountTendered || cartTotal : cartTotal,
        changeDue: (paymentMethod === 'Cash' || paymentMethod === 'cash') ? changeDue : 0,
        notes: notes || '',
        status: 'paid',
        createdAt: now as any,
      };

      await syncReceiptToOffline(businessId, newReceipt);

      setReceipts((prev) => [newReceipt, ...prev]);
      setLastReceipt(newReceipt);

      setProducts((prev) =>
        prev.map((prod) => {
          const itemInCart = cart.find((c) => c.product.id === prod.id);
          if (itemInCart) {
            const updatedStock = Math.max(0, (prod.stock || 0) - itemInCart.quantity);
            const updatedProd = { ...prod, stock: updatedStock };
            syncProductToOffline(businessId, updatedProd).catch(() => {});
            return updatedProd;
          }
          return prod;
        })
      );

      await addToQueue({
        type: 'complete-sale',
        payload: newReceipt,
        description: `Sale ${receiptId} for ${business?.settings?.currency || 'NGN'} ${cartTotal}`,
      });

      clearCart();
      return newReceipt;
    },
    [
      cart,
      businessId,
      activeBranchId,
      user?.uid,
      userProfile?.name,
      selectedCustomer,
      cartSubtotal,
      cartDiscount,
      cartTax,
      cartTotal,
      paymentMethod,
      amountTendered,
      changeDue,
      business?.settings?.currency,
      addToQueue,
      clearCart,
    ]
  );

  // Add Customer (Law 1)
  const addCustomer = useCallback(
    async (customerData: Omit<Customer, 'id' | 'businessId' | 'createdAt'>): Promise<Customer> => {
      const customerId = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newCust: Customer = {
        ...customerData,
        id: customerId,
        businessId,
        createdAt: new Date() as any,
        totalSpent: 0,
        visitCount: 0,
        debtBalance: 0,
      };

      setCustomers((prev) => [newCust, ...prev]);
      setSelectedCustomer(newCust);
      await syncCustomersToOffline(businessId, [newCust, ...customers]);

      await addToQueue({
        type: 'add-customer',
        payload: newCust,
        description: `Create customer ${newCust.name}`,
      });

      return newCust;
    },
    [businessId, customers, addToQueue]
  );

  // Save Product (Law 1)
  const saveProduct = useCallback(
    async (productData: Partial<Product> & { name: string; price: number }) => {
      const isNew = !productData.id;
      const productId = productData.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const fullProduct: Product = {
        id: productId,
        businessId,
        name: productData.name,
        price: Number(productData.price) || 0,
        costPrice: Number(productData.costPrice) || 0,
        stock: Number(productData.stock) || 0,
        category: productData.category || 'General',
        sku: productData.sku || '',
        barcode: productData.barcode || '',
        unit: productData.unit || 'pcs',
        lowStockThreshold: Number(productData.lowStockThreshold) || 5,
        isActive: productData.isActive !== false,
        branchId: activeBranchId !== 'all' ? activeBranchId : businessId,
        createdAt: productData.createdAt || (new Date() as any),
        updatedAt: new Date() as any,
      };

      setProducts((prev) => {
        const index = prev.findIndex((p) => p.id === productId);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = fullProduct;
          return updated;
        }
        return [fullProduct, ...prev];
      });

      await syncProductToOffline(businessId, fullProduct);

      await addToQueue({
        type: isNew ? 'add-product' : 'update-product',
        payload: fullProduct,
        description: `${isNew ? 'Create' : 'Update'} product ${fullProduct.name}`,
      });
    },
    [businessId, activeBranchId, addToQueue]
  );

  // Delete Product (Law 1)
  const deleteProduct = useCallback(
    async (productId: string) => {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      await deleteMultipleProductsFromOffline(businessId, [productId]);

      await addToQueue({
        type: 'delete-product',
        payload: { id: productId, businessId },
        description: `Delete product ${productId}`,
      });
    },
    [businessId, addToQueue]
  );

  // Hold Sale
  const holdCurrentSale = useCallback(
    async (note?: string) => {
      if (cart.length === 0) return;
      const heldId = `held_${Date.now()}`;
      const newHeld: HeldSale = {
        id: heldId,
        items: [...cart],
        customer: selectedCustomer,
        total: cartTotal,
        notes: note || `Held sale (${cartItemCount} items)`,
        timestamp: Date.now(),
      };
      setHeldSales((prev) => [newHeld, ...prev]);
      clearCart();
    },
    [cart, selectedCustomer, cartTotal, cartItemCount, clearCart]
  );

  const resumeHeldSale = useCallback(
    (heldSaleId: string) => {
      const found = heldSales.find((h) => h.id === heldSaleId);
      if (!found) return;
      setCart(found.items);
      if (found.customer) setSelectedCustomer(found.customer);
      setHeldSales((prev) => prev.filter((h) => h.id !== heldSaleId));
    },
    [heldSales]
  );

  const discardHeldSale = useCallback((heldSaleId: string) => {
    setHeldSales((prev) => prev.filter((h) => h.id !== heldSaleId));
  }, []);

  const value: MobilePosContextType = {
    products,
    isLoadingProducts,
    refreshProducts,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,

    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartItemCount,
    cartSubtotal,
    cartDiscount,
    cartTax,
    cartTotal,
    discountType,
    setDiscountType,
    discountValue,
    setDiscountValue,
    taxRate,
    setTaxRate,

    customers,
    selectedCustomer,
    selectCustomer,
    addCustomer,
    refreshCustomers,

    paymentMethod,
    setPaymentMethod,
    amountTendered,
    setAmountTendered,
    changeDue,
    completeSale,
    lastReceipt,
    receipts,

    heldSales,
    holdCurrentSale,
    resumeHeldSale,
    discardHeldSale,

    offlineQueueCount,
    isSyncingQueue,
    addToQueue,
    flushOfflineQueue,

    saveProduct,
    deleteProduct,
  };

  return <MobilePosContext.Provider value={value}>{children}</MobilePosContext.Provider>;
}

export function useMobilePos() {
  const context = useContext(MobilePosContext);
  if (!context) {
    throw new Error('useMobilePos must be used within a MobilePosProvider');
  }
  return context;
}

export const usePOS = useMobilePos;
export const POSProvider = MobilePosProvider;
