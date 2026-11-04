import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CustomersStackParamList } from '@/navigation/types';
import { useMobilePos } from '@/context/MobilePosContext';
import { useAuth } from '@/context/AuthContext';
import type { Customer } from '@/types';
import {
  Search,
  UserPlus,
  User,
  Phone,
  Mail,
  ChevronRight,
  X,
  CreditCard,
  DollarSign,
} from 'lucide-react-native';

export function CustomersDirectoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CustomersStackParamList>>();
  const { customers, refreshCustomers, addCustomer } = useMobilePos();
  const { business } = useAuth();

  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'debtors'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New customer state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const currency = business?.settings?.currency || 'NGN';

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refreshCustomers();
    setIsRefreshing(false);
  };

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search.trim() ||
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q));

      const hasDebt = (c.debtBalance || 0) > 0;
      const matchFilter = filterMode === 'all' || hasDebt;

      return matchSearch && matchFilter;
    });
  }, [customers, search, filterMode]);

  const handleCreateCustomer = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a name for the customer.');
      return;
    }

    setIsSaving(true);
    try {
      await addCustomer({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
      });
      setShowAddModal(false);
      setName('');
      setPhone('');
      setEmail('');
      Alert.alert('Success', 'Customer profile created.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save customer.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderCustomer = ({ item }: { item: Customer }) => {
    const debt = item.debtBalance || 0;
    const hasDebt = debt > 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('CustomerLedger', { customer: item })}
        activeOpacity={0.7}
      >
        <View style={styles.cardLeft}>
          <View style={[styles.avatar, hasDebt && styles.avatarDebt]}>
            <User size={22} color={hasDebt ? '#DC2626' : '#64748B'} />
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{item.name}</Text>
            <View style={styles.contactRow}>
              {item.phone ? (
                <Text style={styles.contactText}>{item.phone}</Text>
              ) : item.email ? (
                <Text style={styles.contactText}>{item.email}</Text>
              ) : (
                <Text style={styles.contactText}>No contact</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.cardRight}>
          {hasDebt ? (
            <View style={styles.debtBox}>
              <Text style={styles.debtLabel}>DEBT DUE</Text>
              <Text style={styles.debtAmount}>
                {currency} {debt.toLocaleString()}
              </Text>
            </View>
          ) : (
            <View style={styles.spentBox}>
              <Text style={styles.spentLabel}>TOTAL SPENT</Text>
              <Text style={styles.spentAmount}>
                {currency} {(item.totalSpent || 0).toLocaleString()}
              </Text>
            </View>
          )}
          <ChevronRight size={18} color="#94A3B8" style={{ marginLeft: 8 }} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search & Actions Bar */}
      <View style={styles.searchBar}>
        <View style={styles.searchInputWrapper}>
          <Search size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers by name, phone..."
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

        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <UserPlus size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filterMode === 'all' && styles.filterChipActive]}
          onPress={() => setFilterMode('all')}
        >
          <Text
            style={[styles.filterChipText, filterMode === 'all' && styles.filterChipTextActive]}
          >
            All Customers ({customers.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterMode === 'debtors' && styles.filterChipActive]}
          onPress={() => setFilterMode('debtors')}
        >
          <Text
            style={[
              styles.filterChipText,
              filterMode === 'debtors' && styles.filterChipTextActive,
            ]}
          >
            Outstanding Debtors
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderCustomer}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <User size={44} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No customers found</Text>
            <Text style={styles.emptySubtitle}>
              {filterMode === 'debtors'
                ? 'No customers currently have outstanding debt.'
                : 'Tap "+ Add" to register a new customer profile.'}
            </Text>
          </View>
        }
      />

      {/* Add Customer Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Customer</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Ibrahim Mohammed"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="+234..."
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="customer@email.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
              onPress={handleCreateCustomer}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save Customer</Text>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F47125',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  list: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarDebt: {
    backgroundColor: '#FEF2F2',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  contactRow: {
    marginTop: 2,
  },
  contactText: {
    fontSize: 12,
    color: '#64748B',
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  debtBox: {
    alignItems: 'flex-end',
  },
  debtLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  debtAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
  },
  spentBox: {
    alignItems: 'flex-end',
  },
  spentLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  spentAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
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
  label: {
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
  saveBtn: {
    backgroundColor: '#F47125',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

