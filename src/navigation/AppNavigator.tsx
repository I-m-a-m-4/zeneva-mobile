import React, { useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useBranch } from '@/context/branch-context';
import type {
  RootStackParamList,
  MainTabParamList,
  PosStackParamList,
  InventoryStackParamList,
  CustomersStackParamList,
  AdminStackParamList,
} from './types';
import { fonts } from '@/theme/typography';
import { MobileTopHeader } from '@/components/layout/MobileTopHeader';

// Screens
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { RegisterScreen } from '@/screens/auth/RegisterScreen';
import { PinLockScreen } from '@/screens/auth/PinLockScreen';

import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
import { SelectProductsScreen } from '@/screens/pos/SelectProductsScreen';
import { CustomerSelectScreen } from '@/screens/pos/CustomerSelectScreen';
import { PaymentScreen } from '@/screens/pos/PaymentScreen';
import { ReceiptReviewScreen } from '@/screens/pos/ReceiptReviewScreen';

import { InventoryCatalogScreen } from '@/screens/inventory/InventoryCatalogScreen';
import { ItemEditorScreen } from '@/screens/inventory/ItemEditorScreen';
import { StockTakeScreen } from '@/screens/inventory/StockTakeScreen';

import { CustomersDirectoryScreen } from '@/screens/customers/CustomersDirectoryScreen';
import { CustomerLedgerScreen } from '@/screens/customers/CustomerLedgerScreen';

import { AuditForensicsScreen } from '@/screens/audit/AuditForensicsScreen';
import { AdminDashboardScreen } from '@/screens/admin/AdminDashboardScreen';
import { AdminTelemetryScreen } from '@/screens/admin/AdminTelemetryScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';

// Icons
import {
  Home,
  ShoppingCart,
  Package,
  Users,
  Menu,
  ShieldAlert,
  BarChart3,
  Settings,
  LogOut,
  Award,
  Store,
  X,
  ChevronRight,
} from 'lucide-react-native';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const PosStack = createNativeStackNavigator<PosStackParamList>();
const InventoryStack = createNativeStackNavigator<InventoryStackParamList>();
const CustomersStack = createNativeStackNavigator<CustomersStackParamList>();
const AdminStack = createNativeStackNavigator<AdminStackParamList>();

function PosNavigator() {
  return (
    <PosStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#0F172A',
        headerTitleStyle: { fontFamily: fonts.headingBold, fontSize: 17, fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <PosStack.Screen
        name="SelectProducts"
        component={SelectProductsScreen}
        options={{ headerShown: false }}
      />
      <PosStack.Screen
        name="CustomerSelect"
        component={CustomerSelectScreen}
        options={{ title: 'Select Customer' }}
      />
      <PosStack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ title: 'Tender Payment' }}
      />
      <PosStack.Screen
        name="ReceiptReview"
        component={ReceiptReviewScreen}
        options={{ title: 'Digital Receipt', headerBackVisible: false }}
      />
    </PosStack.Navigator>
  );
}

function InventoryNavigator() {
  return (
    <InventoryStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#0F172A',
        headerTitleStyle: { fontFamily: fonts.headingBold, fontSize: 17, fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <InventoryStack.Screen
        name="InventoryCatalog"
        component={InventoryCatalogScreen}
        options={{ headerShown: false }}
      />
      <InventoryStack.Screen
        name="ItemEditor"
        component={ItemEditorScreen}
        options={{ title: 'Item Editor' }}
      />
      <InventoryStack.Screen
        name="StockTake"
        component={StockTakeScreen}
        options={{ headerShown: false }}
      />
    </InventoryStack.Navigator>
  );
}

function CustomersNavigator() {
  return (
    <CustomersStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#0F172A',
        headerTitleStyle: { fontFamily: fonts.headingBold, fontSize: 17, fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <CustomersStack.Screen
        name="CustomersDirectory"
        component={CustomersDirectoryScreen}
        options={{ headerShown: false }}
      />
      <CustomersStack.Screen
        name="CustomerLedger"
        component={CustomerLedgerScreen}
        options={{ headerShown: false }}
      />
    </CustomersStack.Navigator>
  );
}

function AdminNavigator() {
  return (
    <AdminStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#0F172A',
        headerTitleStyle: { fontFamily: fonts.headingBold, fontSize: 17, fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <AdminStack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ title: 'Management & Velocity' }}
      />
      <AdminStack.Screen
        name="AdminTelemetry"
        component={AdminTelemetryScreen}
        options={{ headerShown: false }}
      />
    </AdminStack.Navigator>
  );
}

const EmptyScreen = () => <View style={{ flex: 1, backgroundColor: '#F9F8F6' }} />;

function MainTabNavigator() {
  const rootNavigation = useNavigation<any>();
  const { signOut, user } = useAuth();
  const { branches, activeBranchId } = useBranch();
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  const activeBranchName =
    branches.find((b) => b.id === activeBranchId)?.name || 'Main Store';

  const handleSignOut = () => {
    setIsMoreSheetOpen(false);
    Alert.alert('Sign Out', 'Are you sure you want to log out of Zeneva?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Top Header Bar matching website (Store/Branch, WiFi Status, Queue, Avatar) */}
      <MobileTopHeader
        onOpenSettings={() => rootNavigation.navigate('SettingsScreen')}
      />

      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#F47125',
          tabBarInactiveTintColor: '#94A3B8',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#E2E8F0',
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontFamily: fonts.medium,
            fontWeight: '600',
          },
          headerShown: false,
        }}
      >
        {/* 1. Dashboard Tab */}
        <Tab.Screen
          name="DashboardTab"
          component={DashboardScreen}
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          }}
        />

        {/* 2. Inventory Tab */}
        <Tab.Screen
          name="InventoryTab"
          component={InventoryNavigator}
          options={{
            title: 'Inventory',
            tabBarIcon: ({ color, size }) => <Package size={size} color={color} />,
          }}
        />

        {/* 3. POS Tab */}
        <Tab.Screen
          name="PosTab"
          component={PosNavigator}
          options={{
            title: 'POS',
            tabBarIcon: ({ color, size }) => <ShoppingCart size={size} color={color} />,
          }}
        />

        {/* 4. More Tab - opens the bottom sheet with all other links matching web MobileBottomNav */}
        <Tab.Screen
          name="MoreTab"
          component={EmptyScreen}
          options={{
            title: 'More',
            tabBarIcon: ({ color, size }) => <Menu size={size} color={color} />,
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setIsMoreSheetOpen(true);
            },
          }}
        />
      </Tab.Navigator>

      {/* "More Options" Bottom Sheet matching web MobileBottomNav */}
      <Modal visible={isMoreSheetOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.moreSheetCard}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>More Options</Text>
              <TouchableOpacity onPress={() => setIsMoreSheetOpen(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Current Store / Branch Indicator */}
            <View style={styles.sheetBranchRow}>
              <Store size={18} color="#F47125" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.sheetBranchLabel}>ACTIVE BRANCH</Text>
                <Text style={styles.sheetBranchName}>{activeBranchName}</Text>
              </View>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              <TouchableOpacity
                style={styles.sheetItem}
                onPress={() => {
                  setIsMoreSheetOpen(false);
                  rootNavigation.navigate('CustomersScreen');
                }}
              >
                <View style={[styles.sheetItemIcon, { backgroundColor: '#F0FDF4' }]}>
                  <Users size={18} color="#16A34A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetItemTitle}>Customers & Debt Ledger</Text>
                  <Text style={styles.sheetItemSub}>Client accounts, credit balance & history</Text>
                </View>
                <ChevronRight size={16} color="#CBD5E1" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetItem}
                onPress={() => {
                  setIsMoreSheetOpen(false);
                  rootNavigation.navigate('AuditScreen');
                }}
              >
                <View style={[styles.sheetItemIcon, { backgroundColor: '#FEF2F2' }]}>
                  <ShieldAlert size={18} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetItemTitle}>Audit Log & Forensics</Text>
                  <Text style={styles.sheetItemSub}>Cashier audits & void detections</Text>
                </View>
                <ChevronRight size={16} color="#CBD5E1" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetItem}
                onPress={() => {
                  setIsMoreSheetOpen(false);
                  rootNavigation.navigate('AdminScreen');
                }}
              >
                <View style={[styles.sheetItemIcon, { backgroundColor: '#EFF6FF' }]}>
                  <BarChart3 size={18} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetItemTitle}>Platform Analytics & Velocity</Text>
                  <Text style={styles.sheetItemSub}>Store metrics & GMV telemetry</Text>
                </View>
                <ChevronRight size={16} color="#CBD5E1" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetItem}
                onPress={() => {
                  setIsMoreSheetOpen(false);
                  rootNavigation.navigate('SettingsScreen');
                }}
              >
                <View style={[styles.sheetItemIcon, { backgroundColor: '#F1F5F9' }]}>
                  <Settings size={18} color="#475569" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetItemTitle}>Store Settings</Text>
                  <Text style={styles.sheetItemSub}>Receipts, printers & staff accounts</Text>
                </View>
                <ChevronRight size={16} color="#CBD5E1" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sheetItem, { borderBottomWidth: 0, marginTop: 8 }]}
                onPress={handleSignOut}
              >
                <View style={[styles.sheetItemIcon, { backgroundColor: '#FEF2F2' }]}>
                  <LogOut size={18} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sheetItemTitle, { color: '#DC2626' }]}>Sign Out</Text>
                  <Text style={styles.sheetItemSub}>{user?.email}</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export function AppNavigator() {
  const { user, isLoading, isLocked } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color="#F47125" />
      </View>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <RootStack.Screen name="Login" component={LoginScreen} />
          <RootStack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : isLocked ? (
        <RootStack.Screen name="PinLock" component={PinLockScreen} />
      ) : (
        <>
          <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
          <RootStack.Screen
            name="CustomersScreen"
            component={CustomersNavigator}
            options={{ headerShown: false }}
          />
          <RootStack.Screen
            name="AuditScreen"
            component={AuditForensicsScreen}
            options={{
              headerShown: true,
              title: 'Forensics & Audit Log',
              headerStyle: { backgroundColor: '#FFFFFF' },
              headerTintColor: '#0F172A',
              headerTitleStyle: { fontFamily: fonts.headingBold, fontSize: 17, fontWeight: '700' },
            }}
          />
          <RootStack.Screen
            name="AdminScreen"
            component={AdminNavigator}
            options={{ headerShown: false }}
          />
          <RootStack.Screen
            name="SettingsScreen"
            component={SettingsScreen}
            options={{
              headerShown: true,
              title: 'Store Settings',
              headerStyle: { backgroundColor: '#FFFFFF' },
              headerTintColor: '#0F172A',
              headerTitleStyle: { fontFamily: fonts.headingBold, fontSize: 17, fontWeight: '700' },
            }}
          />
        </>
      )}
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#F9F8F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  moreSheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 17,
    fontFamily: fonts.headingBold,
    fontWeight: '700',
    color: '#0F172A',
  },
  sheetBranchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  sheetBranchLabel: {
    fontSize: 9,
    fontFamily: fonts.bold,
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  sheetBranchName: {
    fontSize: 13,
    fontFamily: fonts.medium,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 2,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sheetItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sheetItemTitle: {
    fontSize: 14,
    fontFamily: fonts.medium,
    fontWeight: '600',
    color: '#0F172A',
  },
  sheetItemSub: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: fonts.regular,
    marginTop: 2,
  },
});
