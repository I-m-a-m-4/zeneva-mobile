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
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CustomersStackParamList } from '@/navigation/types';
import { useMobilePos } from '@/context/MobilePosContext';
import { useAuth } from '@/context/AuthContext';
import type { Customer } from '@/types';
import { GlowInput } from '@/components/ui/GlowInput';
import { GlowButton } from '@/components/ui/GlowButton';
import { fonts } from '@/theme/typography';
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
  MessageCircle,
  Award,
  Users,
} from 'lucide-react-native';

export function CustomersDirectoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CustomersStackParamList>>();
  const { customers, refreshCustomers, addCustomer } = useMobilePos();
  const { business } = useAuth();

  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'debtors' | 'vip'>('all');
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

  // Aggregates
  const stats = useMemo(() => {
    let totalDebt = 0;
    let debtorCount = 0;
    let vipCount = 0;

    customers.forEach((c) => {
      const debt = c.debtBalance || 0;
      if (debt > 0) {
        totalDebt += debt;
        debtorCount++;
      }
      if ((c.loyaltyPoints || 0) >= 50 || (c.totalSpent || 0) >= 100000) {
        vipCount++;
      }
    });

    return { totalDebt, debtorCount, vipCount, total: customers.length };
  }, [customers]);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search.trim() ||
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q));

      const hasDebt = (c.debtBalance || 0) > 0;
      const isVip = (c.loyaltyPoints || 0) >= 50 || (c.totalSpent || 0) >= 100000;

      let matchFilter = true;
      if (filterMode === 'debtors') matchFilter = hasDebt;
      if (filterMode === 'vip') matchFilter = isVip;

      return matchSearch && matchFilter;
    });
  }, [customers, search, filterMode]);

  const handleWhatsAppCustomer = (phoneNum: string, custName: string) => {
    const cleanPhone = phoneNum.replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      Alert.alert('No Phone', 'This customer does not have a valid phone number.');
      return;
    }
    const message = encodeURIComponent(`Hello ${custName}, thank you for choosing ${business?.name || 'us'}!`);
    Linking.openURL(`whatsapp://send?phone=${cleanPhone}&text=${message}`).catch(() => {
      Alert.alert('WhatsApp Error', 'Could not open WhatsApp on this device.');
    });
  };

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
    const isVip = (item.loyaltyPoints || 0) >= 50 || (item.totalSpent || 0) >= 100000;

    return (
      <View style={styles.card}>
        <View style={styles.cornerTopRight} />
        <View style={styles.cornerBottomLeft} />

        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.name ? item.name.charAt(0).toUpperCase() : 'C'}
            </Text>
          </View>

          <View style={styles.cardHeaderText}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.customerName}>{item.name}</Text>
              {isVip ? (
                <View style={styles.vipBadge}>
                  <Award size={10} color="#D97706" />
                  <Text style={styles.vipBadgeText}>VIP</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.metaRow}>
              {item.phone ? (
                <View style={styles.metaItem}>
                  <Phone size={12} color="#94A3B8" />
                  <Text style={styles.metaText}>{item.phone}</Text>
                </View>
              ) : null}
              {item.email ? (
                <View style={styles.metaItem}>
                  <Mail size={12} color="#94A3B8" />
                  <Text style={styles.metaText}>{item.email}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View>
            <Text style={styles.metricLabel}>TOTAL SPENT</Text>
            <Text style={styles.metricValue}>
              {currency} {(item.totalSpent || 0).toLocaleString()}
            </Text>
          </View>

          <View>
            <Text style={styles.metricLabel}>LOYALTY POINTS</Text>
            <Text style={styles.metricValue}>{item.loyaltyPoints || 0} pts</Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.metricLabel}>DEBT BALANCE</Text>
            {hasDebt ? (
              <View style={styles.debtTag}>
                <Text style={styles.debtTagText}>
                  {currency} {debt.toLocaleString()}
                </Text>
              </View>
            ) : (
              <Text style={styles.zeroDebtText}>Cleared</Text>
            )}
          </View>
        </View>

        {/* Action Row */}
        <View style={styles.cardActions}>
          {item.phone ? (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleWhatsAppCustomer(item.phone!, item.name)}
              activeOpacity={0.7}
            >
              <MessageCircle size={14} color="#10B981" />
              <Text style={[styles.actionBtnText, { color: '#10B981' }]}>WhatsApp</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.ledgerBtn}
            onPress={() => navigation.navigate('CustomerLedger', { customer: item })}
            activeOpacity={0.7}
          >
            <Text style={styles.ledgerBtnText}>View Ledger</Text>
            <ChevronRight size={14} color="#F47125" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Customers & Debt</Text>
          <Text style={styles.headerSubtitle}>
            {stats.total} accounts • {stats.debtorCount} with active debt
          </Text>
        </View>

        <GlowButton
          title="Add Customer"
          icon={<UserPlus size={16} color="#FFFFFF" />}
          onPress={() => setShowAddModal(true)}
          variant="primary"
          size="sm"
        />
      </View>

      {/* Aggregate Debt Metric Banner */}
      {stats.totalDebt > 0 ? (
        <View style={styles.debtBanner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <CreditCard size={18} color="#DC2626" />
            <Text style={styles.debtBannerLabel}>TOTAL OUTSTANDING DEBT</Text>
          </View>
          <Text style={styles.debtBannerVal}>
            {currency} {stats.totalDebt.toLocaleString()}
          </Text>
        </View>
      ) : null}

      {/* Search Bar with GlowInput */}
      <View style={styles.searchSection}>
        <GlowInput
          placeholder="Search by customer name, phone, email..."
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

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterChip, filterMode === 'all' && styles.filterChipActive]}
          onPress={() => setFilterMode('all')}
        >
          <Text style={[styles.filterText, filterMode === 'all' && styles.filterTextActive]}>
            All ({stats.total})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterMode === 'debtors' && styles.filterChipActive]}
          onPress={() => setFilterMode('debtors')}
        >
          <Text style={[styles.filterText, filterMode === 'debtors' && styles.filterTextActive]}>
            Debtors ({stats.debtorCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterMode === 'vip' && styles.filterChipActive]}
          onPress={() => setFilterMode('vip')}
        >
          <Text style={[styles.filterText, filterMode === 'vip' && styles.filterTextActive]}>
            VIP ({stats.vipCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderCustomer}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Users size={40} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No matching customers</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search query or create a new customer profile.
            </Text>
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
                label="Customer Full Name *"
                placeholder="e.g. Amina Bello"
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
                placeholder="amina@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                leftIcon={<Mail size={18} color="#94A3B8" />}
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <GlowButton
                  title="Cancel"
                  onPress={() => setShowAddModal(false)}
                  variant="outline"
                  size="default"
                  style={{ flex: 1 }}
                />
                <GlowButton
                  title="Save Profile"
                  onPress={handleCreateCustomer}
                  isLoading={isSaving}
                  variant="primary"
                  size="default"
                  style={{ flex: 1 }}
                />
              </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  debtBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  debtBannerLabel: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: '#DC2626',
    letterSpacing: 0.8,
  },
  debtBannerVal: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    fontWeight: '800',
    color: '#DC2626',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  filterTabs: {
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
  filterChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: fonts.medium,
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    position: 'relative',
  },
  cornerTopRight: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 6,
    height: 6,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: '#CBD5E1',
    zIndex: 10,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    width: 6,
    height: 6,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
    borderColor: '#CBD5E1',
    zIndex: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    fontWeight: '700',
    color: '#F47125',
  },
  cardHeaderText: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontFamily: fonts.medium,
    fontWeight: '600',
    color: '#0F172A',
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  vipBadgeText: {
    fontSize: 9,
    fontFamily: fonts.bold,
    color: '#D97706',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: fonts.regular,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metricLabel: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 13,
    fontFamily: fonts.medium,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 2,
  },
  debtTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  debtTagText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#DC2626',
  },
  zeroDebtText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#10B981',
    marginTop: 2,
  },
  cardActions: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#ECFDF5',
  },
  actionBtnText: {
    fontSize: 11,
    fontFamily: fonts.bold,
  },
  ledgerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ledgerBtnText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: '#F47125',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: fonts.headingBold,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: fonts.regular,
    marginTop: 4,
    textAlign: 'center',
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
    fontSize: 17,
    fontFamily: fonts.headingBold,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalForm: {
    gap: 8,
  },
});
