import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Linking,
  Alert,
  Modal,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { CustomersStackParamList } from '@/navigation/types';
import { useMobilePos } from '@/context/MobilePosContext';
import { useAuth } from '@/context/AuthContext';
import {
  User,
  Phone,
  Mail,
  ArrowLeft,
  DollarSign,
  Receipt as ReceiptIcon,
  MessageCircle,
  PlusCircle,
  X,
  CreditCard,
} from 'lucide-react-native';

export function CustomerLedgerScreen() {
  const route = useRoute<RouteProp<CustomersStackParamList, 'CustomerLedger'>>();
  const navigation = useNavigation();
  const { receipts, addToQueue } = useMobilePos();
  const { business } = useAuth();

  const customer = route.params?.customer;

  const [paymentAmount, setPaymentAmount] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [localDebt, setLocalDebt] = useState(customer?.debtBalance || 0);

  if (!customer) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Customer profile not found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Return to Directory</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currency = business?.settings?.currency || 'NGN';

  // Receipts for this customer
  const customerReceipts = useMemo(() => {
    return receipts.filter((r) => r.customerId === customer.id || r.customer?.id === customer.id);
  }, [receipts, customer.id]);

  const handleRecordPayment = async () => {
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }

    const nextDebt = Math.max(0, localDebt - amt);
    setLocalDebt(nextDebt);
    setShowPaymentModal(false);
    setPaymentAmount('');

    await addToQueue({
      type: 'update_customer_debt',
      payload: {
        customerId: customer.id,
        businessId: customer.businessId,
        paymentAmount: amt,
        remainingDebt: nextDebt,
        timestamp: Date.now(),
      },
      description: `Debt payment of ${currency} ${amt} recorded for ${customer.name}`,
    });

    Alert.alert('Payment Recorded', `Successfully credited ${currency} ${amt} to ${customer.name}'s account.`);
  };

  const handleSendReminder = async () => {
    if (!customer.phone) {
      Alert.alert('No Phone', 'This customer does not have a phone number on file.');
      return;
    }

    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hello ${customer.name}, friendly reminder from ${business?.name || 'Zeneva Store'}: your outstanding balance is ${currency} ${localDebt.toLocaleString()}. Thank you!`
    );
    const url = `whatsapp://send?phone=${cleanPhone}&text=${message}`;

    try {
      const can = await Linking.canOpenURL(url);
      if (can) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(`sms:${cleanPhone}?body=${message}`);
      }
    } catch {
      Alert.alert('Error', 'Could not open messaging application.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Customer Statement</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <User size={32} color="#F47125" />
          </View>
          <Text style={styles.customerName}>{customer.name}</Text>
          <View style={styles.contactDetails}>
            {customer.phone ? (
              <View style={styles.contactItem}>
                <Phone size={14} color="#64748B" />
                <Text style={styles.contactItemText}>{customer.phone}</Text>
              </View>
            ) : null}
            {customer.email ? (
              <View style={styles.contactItem}>
                <Mail size={14} color="#64748B" />
                <Text style={styles.contactItemText}>{customer.email}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Financial Highlights */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, localDebt > 0 && styles.statBoxDebt]}>
            <Text style={styles.statLabel}>OUTSTANDING DEBT</Text>
            <Text style={[styles.statValue, localDebt > 0 && styles.statValueDebt]}>
              {currency} {localDebt.toLocaleString()}
            </Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>LIFETIME SPENT</Text>
            <Text style={styles.statValue}>
              {currency} {(customer.totalSpent || 0).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Debt Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.payBtn}
            onPress={() => setShowPaymentModal(true)}
          >
            <CreditCard size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.payBtnText}>Record Payment</Text>
          </TouchableOpacity>

          {localDebt > 0 ? (
            <TouchableOpacity style={styles.remindBtn} onPress={handleSendReminder}>
              <MessageCircle size={18} color="#10B981" style={{ marginRight: 6 }} />
              <Text style={styles.remindBtnText}>WhatsApp Reminder</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Purchase History */}
        <Text style={styles.sectionTitle}>Transaction History ({customerReceipts.length})</Text>

        {customerReceipts.length === 0 ? (
          <View style={styles.emptyCard}>
            <ReceiptIcon size={32} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No transaction history</Text>
            <Text style={styles.emptySubtitle}>Sales completed for this customer will appear here.</Text>
          </View>
        ) : (
          customerReceipts.map((r) => (
            <View key={r.id} style={styles.receiptCard}>
              <View>
                <Text style={styles.receiptId}>Receipt #{r.id}</Text>
                <Text style={styles.receiptDate}>
                  {new Date(r.createdAt as any).toLocaleDateString()} • {r.items.length} items
                </Text>
              </View>
              <Text style={styles.receiptTotal}>
                {currency} {r.total.toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Record Debt Payment Modal */}
      <Modal visible={showPaymentModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Debt Payment</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Current Outstanding Balance: {currency} {localDebt.toLocaleString()}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount Paid ({currency}) *</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                autoFocus
              />
            </View>

            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleRecordPayment}>
              <Text style={styles.modalSubmitBtnText}>Credit Customer Balance</Text>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  contactDetails: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 6,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactItemText: {
    fontSize: 13,
    color: '#64748B',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statBoxDebt: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 4,
  },
  statValueDebt: {
    color: '#DC2626',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  payBtn: {
    flex: 1,
    backgroundColor: '#F47125',
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  remindBtn: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  remindBtnText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  receiptCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  receiptId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  receiptDate: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  receiptTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
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
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubmitBtn: {
    backgroundColor: '#F47125',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 12,
  },
  backBtn: {
    backgroundColor: '#F47125',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
