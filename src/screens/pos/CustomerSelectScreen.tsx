import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PosStackParamList } from '@/navigation/types';
import { useMobilePos } from '@/context/MobilePosContext';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/i18n-context';
import type { Customer } from '@/types';
import { GlowInput } from '@/components/ui/GlowInput';
import { GlowButton } from '@/components/ui/GlowButton';
import {
  Search,
  UserPlus,
  User,
  Check,
  ArrowRight,
  X,
  Phone,
  Mail,
  Coins,
} from 'lucide-react-native';

export function CustomerSelectScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<PosStackParamList>>();
  const { customers, selectedCustomer, selectCustomer, addCustomer, cartTotal } = useMobilePos();
  const { business } = useAuth();
  const { t } = useI18n();

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
              <View style={styles.metaRow}>
                <Phone size={12} color="#94A3B8" />
                <Text style={styles.customerMetaText}>{item.phone}</Text>
              </View>
            ) : item.email ? (
              <View style={styles.metaRow}>
                <Mail size={12} color="#94A3B8" />
                <Text style={styles.customerMetaText}>{item.email}</Text>
              </View>
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
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Customer Assignment</Text>
          <Text style={styles.headerSubtitle}>
            Attach sale to a customer for debt ledger & points
          </Text>
        </View>
        <GlowButton
          title="New"
          icon={<UserPlus size={16} color="#FFFFFF" />}
          onPress={() => setShowAddModal(true)}
          variant="primary"
          size="sm"
        />
      </View>

      {/* Search Input with GlowInput */}
      <View style={styles.searchSection}>
        <GlowInput
          placeholder="Search by name, phone or email..."
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

        <GlowButton
          title="Proceed to Payment"
          icon={<ArrowRight size={16} color="#FFFFFF" />}
          onPress={() => navigation.navigate('Payment')}
          variant="primary"
          size="default"
        />
      </View>

      {/* Add Customer Modal with GlowInputs */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Customer Profile</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <GlowInput
                label="Full Name *"
                placeholder="e.g. Fatima Al-Mansoor"
                value={newName}
                onChangeText={setNewName}
                leftIcon={<User size={18} color="#94A3B8" />}
              />

              <GlowInput
                label="Phone Number"
                placeholder="+234..."
                keyboardType="phone-pad"
                value={newPhone}
                onChangeText={setNewPhone}
                leftIcon={<Phone size={18} color="#94A3B8" />}
              />

              <GlowInput
                label="Email Address"
                placeholder="fatima@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={newEmail}
                onChangeText={setNewEmail}
                leftIcon={<Mail size={18} color="#94A3B8" />}
              />

              <GlowButton
                title="Create & Select Customer"
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  guestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
  },
  guestCardSelected: {
    borderColor: '#F47125',
    backgroundColor: '#FFF7ED',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  customerCardSelected: {
    borderColor: '#F47125',
    backgroundColor: '#FFF7ED',
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontWeight: '600',
    color: '#0F172A',
  },
  customerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
    flexWrap: 'wrap',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  customerMetaText: {
    fontSize: 12,
    color: '#64748B',
  },
  debtBadge: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  debtBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },
  checkIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F47125',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  footerTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
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
