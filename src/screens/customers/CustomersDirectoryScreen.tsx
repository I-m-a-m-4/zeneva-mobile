import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
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
import { GlowInput } from '@/components/ui/GlowInput';
import { GlowButton } from '@/components/ui/GlowButton';
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
            <View style={styles.debtTag}>
              <Text style={styles.debtTagText}>
                Debt: {currency} {debt.toLocaleString()}
              </Text>
            </View>
          ) : (
            <Text style={styles.cleanBalance}>Clean Ledger</Text>
          )}
          <ChevronRight size={18} color="#94A3B8" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Search and New Customer */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <GlowInput
            placeholder="Search customers by name, phone, email..."
            value={search}
            onChangeText={setSearch}
            leftIcon={<Search size={18} color="#94A3B8" />}
            rightIcon={
              search ? (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <X size={16} color="#94A3B8" />
                </TouchableOpacity>
              ) : undefined
            }
            containerStyle={{ marginVertical: 0 }}
          />
        </View>

        <GlowButton
          title="Add Customer"
          icon={<UserPlus size={16} color="#FFFFFF" />}
          onPress={() => setShowAddModal(true)}
          variant="primary"
          size="default"
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filterMode === 'all' && styles.filterChipSelected]}
          onPress={() => setFilterMode('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterChipText, filterMode === 'all' && styles.filterChipTextSelected]}>
            All Customers ({customers.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterMode === 'debtors' && styles.filterChipSelected]}
          onPress={() => setFilterMode('debtors')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterChipText,
              filterMode === 'debtors' && styles.filterChipTextSelected,
            ]}
          >
            Debtors Only ({customers.filter((c) => (c.debtBalance || 0) > 0).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Customer Directory List */}
      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        renderItem={renderCustomer}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <User size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No customers found</Text>
            <Text style={styles.emptySubtitle}>Tap 'Add Customer' above to record a new client profile.</Text>
          </View>
        }
      />

      {/* Add Customer Modal with GlowInputs */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Customer Profile</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <GlowInput
                label="Full Name *"
                placeholder="e.g. Ibrahim Danladi"
                value={name}
                onChangeText={setName}
                leftIcon={<User size={18} color="#94A3B8" />}
              />

              <GlowInput
                label="Phone Number"
                placeholder="+234..."
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                leftIcon={<Phone size={18} color="#94A3B8" />}
              />

              <GlowInput
                label="Email Address"
                placeholder="ibrahim@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                leftIcon={<Mail size={18} color="#94A3B8" />}
              />

              <GlowButton
                title="Save Customer Profile"
                onPress={handleCreateCustomer}
                isLoading={isSaving}
                variant="primary"
                size="default"
                style={{ marginTop: 12 }}
              />
            </View>
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipSelected: {
    borderColor: '#F47125',
    backgroundColor: '#FFF7ED',
  },
  filterChipText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  filterChipTextSelected: {
    color: '#F47125',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
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
    fontWeight: '600',
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
    gap: 8,
  },
  debtTag: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  debtTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  cleanBalance: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
  modalForm: {
    gap: 8,
  },
});
