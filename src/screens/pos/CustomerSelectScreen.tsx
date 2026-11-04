import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PosStackParamList } from '@/navigation/types';
import { useMobilePos } from '@/context/MobilePosContext';
import { useAuth } from '@/context/AuthContext';
import type { Customer } from '@/types';
import {
  Search,
  UserPlus,
  User,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
  Phone,
  Mail,
  Coins,
} from 'lucide-react-native';

export function CustomerSelectScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<PosStackParamList>>();
  const { customers, selectedCustomer, selectCustomer, addCustomer, cartTotal } = useMobilePos();
  const { business } = useAuth();

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New customer form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const currency = business?.settings?.currency || 'NGN';

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }, [customers, search]);

  const handleCreateCustomer = async () => {
    if (!newName.trim()) {
      Alert.alert('Required', 'Please enter customer name.');
      return;
    }

    setIsSaving(true);
    try {
      const created = await addCustomer({
        name: newName.trim(),
        phone: newPhone.trim(),
        email: newEmail.trim(),
      });
      setShowAddModal(false);
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      Alert.alert('Customer Added', `${created.name} is now selected for this sale.`);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not save customer.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderCustomerItem = ({ item }: { item: Customer }) => {
    const isSelected = selectedCustomer?.id === item.id;
    const hasDebt = (item.debtBalance || 0) > 0;

    return (
      <TouchableOpacity
        style={[styles.customerCard, isSelected && styles.customerCardSelected]}
        onPress={() => selectCustomer(item)}
        activeOpacity={0.7}
      >
        <View style={styles.customerAvatar}>
          <User size={20} color={isSelected ? '#F47125' : '#64748B'} />
        </View>

        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.name}</Text>
          <View style={styles.customerMeta}>
            {item.phone ? (
              <Text style={styles.customerMetaText}>{item.phone}</Text>
            ) : item.email ? (
              <Text style={styles.customerMetaText}>{item.email}</Text>
            ) : (
              <Text style={styles.customerMetaText}>No contact info</Text>
            )}
            {hasDebt ? (
              <View style={styles.debtBadge}>
                <Text style={styles.debtBadgeText}>
                  Debt: {currency} {item.debtBalance?.toLocaleString()}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {isSelected ? (
          <View style={styles.checkIcon}>
            <Check size={18} color="#FFFFFF" />
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Customer Assignment</Text>
          <Text style={styles.headerSubtitle}>
            Attach sale to a customer for debt ledger & points
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addCustomerButton}
          onPress={() => setShowAddModal(true)}
        >
          <UserPlus size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.addCustomerButtonText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Search size={18} color="#94A3B8" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, phone or email..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <X size={16} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Guest / Walk-in option */}
      <TouchableOpacity
        style={[
          styles.guestCard,
          selectedCustomer === null && styles.guestCardSelected,
        ]}
        onPress={() => selectCustomer(null)}
        activeOpacity={0.7}
      >
        <View style={styles.customerAvatar}>
          <Coins size={20} color={selectedCustomer === null ? '#F47125' : '#64748B'} />
        </View>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>Walk-in / Guest Customer</Text>
          <Text style={styles.customerMetaText}>Standard checkout without customer account</Text>
        </View>
        {selectedCustomer === null ? (
          <View style={styles.checkIcon}>
            <Check size={18} color="#FFFFFF" />
          </View>
        ) : null}
      </TouchableOpacity>

      {/* Customer List */}
      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item.id}
        renderItem={renderCustomerItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No matching customers found.</Text>
          </View>
        }
      />

      {/* Bottom Navigation Bar */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>Sale Total</Text>
          <Text style={styles.footerTotal}>
            {currency} {cartTotal.toLocaleString()}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.proceedButton}
          onPress={() => navigation.navigate('Payment')}
        >
          <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
          <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>

      {/* Add Customer Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Customer Profile</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Fatima Al-Mansoor"
                placeholderTextColor="#94A3B8"
                value={newName}
                onChangeText={setNewName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="+234..."
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={newPhone}
                onChangeText={setNewPhone}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="customer@domain.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={newEmail}
                onChangeText={setNewEmail}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveModalButton, isSaving && { opacity: 0.7 }]}
              onPress={handleCreateCustomer}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveModalButtonText}>Save & Select Customer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F8F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  addCustomerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F47125',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addCustomerButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  guestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
  },
  guestCardSelected: {
    borderColor: '#F47125',
    backgroundColor: '#FFF7ED',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  customerCardSelected: {
    borderColor: '#F47125',
    backgroundColor: '#FFF7ED',
  },
  customerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  customerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
    gap: 8,
  },
  customerMetaText: {
    fontSize: 12,
    color: '#64748B',
  },
  debtBadge: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  debtBadgeText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '700',
  },
  checkIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F47125',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
  },
  footerLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  footerTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  proceedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F47125',
    borderRadius: 12,
    paddingHorizontal: 20,
    height: 48,
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: '#0F172A',
  },
  saveModalButton: {
    backgroundColor: '#F47125',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveModalButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

