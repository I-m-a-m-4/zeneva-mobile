import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '@/context/AuthContext';
import type {
  RootStackParamList,
  MainTabParamList,
  PosStackParamList,
  InventoryStackParamList,
  CustomersStackParamList,
  AdminStackParamList,
} from './types';

// Screens
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { RegisterScreen } from '@/screens/auth/RegisterScreen';
import { PinLockScreen } from '@/screens/auth/PinLockScreen';

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
  ShoppingCart,
  Package,
  Users,
  ShieldAlert,
  BarChart3,
  Settings,
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
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <PosStack.Screen
        name="SelectProducts"
        component={SelectProductsScreen}
        options={{ title: 'POS Register' }}
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
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <InventoryStack.Screen
        name="InventoryCatalog"
        component={InventoryCatalogScreen}
        options={{ title: 'Catalog & Inventory' }}
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
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <CustomersStack.Screen
        name="CustomersDirectory"
        component={CustomersDirectoryScreen}
        options={{ title: 'Customer Directory' }}
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
        headerTitleStyle: { fontWeight: '700' },
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

function MainTabNavigator() {
  return (
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
          fontWeight: '600',
        },
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#0F172A',
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="PosTab"
        component={PosNavigator}
        options={{
          title: 'Register',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <ShoppingCart size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="InventoryTab"
        component={InventoryNavigator}
        options={{
          title: 'Inventory',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Package size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="CustomersTab"
        component={CustomersNavigator}
        options={{
          title: 'Customers',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="AuditTab"
        component={AuditForensicsScreen}
        options={{
          title: 'Audit',
          headerTitle: 'Forensics & Audit',
          tabBarIcon: ({ color, size }) => <ShieldAlert size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="AdminTab"
        component={AdminNavigator}
        options={{
          title: 'Admin',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          headerTitle: 'Register Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
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
        <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
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
});

