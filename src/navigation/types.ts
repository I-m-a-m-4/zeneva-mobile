import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Customer, Product, Receipt } from '@/types';

export type PosStackParamList = {
  SelectProducts: undefined;
  CustomerSelect: undefined;
  Payment: undefined;
  ReceiptReview: { receipt: Receipt };
};

export type InventoryStackParamList = {
  InventoryCatalog: undefined;
  ItemEditor: { productId?: string };
  StockTake: undefined;
};

export type CustomersStackParamList = {
  CustomersDirectory: undefined;
  CustomerLedger: { customer: Customer };
};

export type AuditStackParamList = {
  AuditForensics: undefined;
};

export type AdminStackParamList = {
  AdminDashboard: undefined;
  AdminTelemetry: undefined;
};

export type MainTabParamList = {
  PosTab: NavigatorScreenParams<PosStackParamList>;
  InventoryTab: NavigatorScreenParams<InventoryStackParamList>;
  CustomersTab: NavigatorScreenParams<CustomersStackParamList>;
  AuditTab: undefined;
  AdminTab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  PinLock: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  ItemEditorModal: { productId?: string };
  StockTakeModal: undefined;
  CustomerLedgerModal: { customer: Customer };
  ReceiptReviewModal: { receipt: Receipt };
};

