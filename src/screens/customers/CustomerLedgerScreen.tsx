import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
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
import { GlowInput } from '@/components/ui/GlowInput';
import { GlowButton } from '@/components/ui/GlowButton';
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
        <GlowButton
          title="Return to Directory"
          onPress={() => navigation.goBack()}
          variant="outline"
          size="default"
          style={{ marginTop: 12 }}
        />
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
        Alert.alert('WhatsApp Unavailable', 'Could not open WhatsApp on this device.');
      }
    } catch {
      Alert.alert('Error', 'Could not launch WhatsApp.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <User size={32} color="#F47125" />
          </View>
          <Text style={styles.customerName}>{customer.name}</Text>
          {customer.phone ? (
            <View style={styles.contactRow}>
              <Phone size={14} color="#64748B" />
              <Text style={styles.contactText}>{customer.phone}</Text>
            </View>
          ) : null}
          {customer.email ? (
            <View style={styles.contactRow}>
              <Mail size={14} color="#64748B" />
              <Text style={styles.contactText}>{customer.email}</Text>
            </View>
          ) : null}
        </View>

        {/* Debt Balance Card */}
        <View style={[styles.balanceCard, localDebt > 0 && styles.balanceCardDebt]}>
          <View>
            <Text style={styles.balanceLabel}>OUTSTANDING DEBT BALANCE</Text>
            <Text style={[styles.balanceAmount, localDebt > 0 && styles.balanceAmountDebt]}>
              {currency} {localDebt.toLocaleString()}
            </Text>
          </View>

          <View style={styles.balanceActions}>
            <GlowButton
              title="Record Payment"
              icon={<PlusCircle size={16} color="#FFFFFF" />}
              onPress={() => setShowPaymentModal(true)}
              variant="primary"
              size="sm"
            />

            {localDebt > 0 && customer.phone ? (
              <GlowButton
                title="WhatsApp Reminder"
                icon={<MessageCircle size={16} color="#10B981" />}
                onPress={handleSendReminder}
                variant="outline"
                size="sm"
                textStyle={{ color: '#10B981' }}
                style={{ borderColor: '#A7F3D0', marginTop: 8 }}
              />
            ) : null}
          </View>
        </View>

        {/* Purchase History */}
        <Text style={styles.historyTitle}>Purchase History ({customerReceipts.length})</Text>

        {customerReceipts.length === 0 ? (
          <View style={styles.emptyHistory}>
            <ReceiptIcon size={36} color="#CBD5E1" />
            <Text style={styles.emptyHistoryText}>No transactions recorded for this customer yet.</Text>
          </View>
        ) : (
          customerReceipts.map((r) => (
            <View key={r.id} style={styles.receiptCard}>
              <View style={styles.receiptTop}>
                <View>
                  <Text style={styles.receiptId}>Receipt #{r.id.slice(-6).toUpperCase()}</Text>
                  <Text style={styles.receiptDate}>
                    {new Date(r.timestamp).toLocaleDateString()} • {r.items.length} items
                  </Text>
                </View>
                <Text style={styles.receiptTotal}>
                  {currency} {r.total.toLocaleString()}
                </Text>
              </View>

              <View style={styles.receiptMethodBadge}>
                <Text style={styles.receiptMethodText}>{String(r.paymentMethod).toUpperCase()}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Record Payment Modal with GlowInput */}
      <Modal visible={showPaymentModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Debt Repayment</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Enter amount received from {customer.name} to credit towards outstanding balance:
            </Text>

            <GlowInput
              label={`Amount Received (${currency})`}
              placeholder="0.00"
              keyboardType="numeric"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              leftIcon={<DollarSign size={18} color="#94A3B8" />}
            />

            <GlowButton
              title="Apply Credit to Ledger"
              onPress={handleRecordPayment}
              variant="primary"
              size="default"
              style={{ marginTop: 14 }}
            />
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  contactText: {
    fontSize: 13,
    color: '#64748B',
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  balanceCardDebt: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  balanceAmountDebt: {
    color: '#DC2626',
  },
  balanceActions: {
    marginTop: 14,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  emptyHistory: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHistoryText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  receiptTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  receiptId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  receiptDate: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  receiptTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  receiptMethodBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 8,
  },
  receiptMethodText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
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
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
});
