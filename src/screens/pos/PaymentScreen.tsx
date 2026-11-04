import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PosStackParamList } from '@/navigation/types';
import { useMobilePos, type PaymentMethod } from '@/context/MobilePosContext';
import { useAuth } from '@/context/AuthContext';
import {
  Banknote,
  CreditCard,
  Building2,
  BookOpen,
  Percent,
  CheckCircle2,
  ArrowLeft,
  Coins,
  ShieldCheck,
} from 'lucide-react-native';

export function PaymentScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<PosStackParamList>>();
  const {
    cart,
    cartSubtotal,
    cartDiscount,
    cartTax,
    cartTotal,
    paymentMethod,
    setPaymentMethod,
    amountTendered,
    setAmountTendered,
    changeDue,
    discountValue,
    setDiscountValue,
    discountType,
    setDiscountType,
    taxRate,
    setTaxRate,
    selectedCustomer,
    completeSale,
  } = useMobilePos();
  const { business } = useAuth();

  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const currency = business?.settings?.currency || 'NGN';

  const quickBills = [1000, 2000, 5000, 10000, 20000];

  const handleCompletePayment = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Cannot process transaction with 0 items.');
      return;
    }

    if (paymentMethod === 'cash' && amountTendered > 0 && amountTendered < cartTotal) {
      Alert.alert(
        'Insufficient Tender',
        `Tendered amount (${currency} ${amountTendered.toLocaleString()}) is less than total (${currency} ${cartTotal.toLocaleString()}).`
      );
      return;
    }

    if (paymentMethod === 'store_credit' && !selectedCustomer) {
      Alert.alert('Customer Required', 'Customer debt/credit requires selecting a registered customer.');
      return;
    }

    setIsProcessing(true);
    try {
      const receipt = await completeSale(notes);
      navigation.navigate('ReceiptReview', { receipt });
    } catch (err: any) {
      Alert.alert('Sale Error', err?.message || 'Could not complete transaction.');
    } finally {
      setIsProcessing(false);
    }
  };

  const methods: { id: PaymentMethod; label: string; icon: any }[] = [
    { id: 'cash', label: 'Cash', icon: Banknote },
    { id: 'card', label: 'Card / POS', icon: CreditCard },
    { id: 'bank_transfer', label: 'Transfer', icon: Building2 },
    { id: 'store_credit', label: 'Debt / Credit', icon: BookOpen },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Grand Total Header */}
        <View style={styles.totalHeaderCard}>
          <Text style={styles.totalLabel}>TOTAL AMOUNT DUE</Text>
          <Text style={styles.totalAmountText}>
            {currency} {cartTotal.toLocaleString()}
          </Text>
          {selectedCustomer ? (
            <View style={styles.customerTag}>
              <Text style={styles.customerTagText}>Customer: {selectedCustomer.name}</Text>
            </View>
          ) : (
            <Text style={styles.walkInText}>Walk-in Customer</Text>
          )}
        </View>

        {/* Payment Method Selector */}
        <Text style={styles.sectionTitle}>Select Payment Method</Text>
        <View style={styles.methodsGrid}>
          {methods.map((m) => {
            const Icon = m.icon;
            const isSelected = paymentMethod === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.methodCard, isSelected && styles.methodCardSelected]}
                onPress={() => {
                  setPaymentMethod(m.id);
                  if (m.id === 'cash' && amountTendered === 0) {
                    setAmountTendered(cartTotal);
                  }
                }}
                activeOpacity={0.7}
              >
                <Icon size={24} color={isSelected ? '#F47125' : '#64748B'} />
                <Text style={[styles.methodLabel, isSelected && styles.methodLabelSelected]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Cash Tender Calculation */}
        {paymentMethod === 'cash' ? (
          <View style={styles.cashTenderSection}>
            <Text style={styles.sectionTitle}>Cash Tendered</Text>
            <View style={styles.tenderInputWrapper}>
              <Text style={styles.currencyPrefix}>{currency}</Text>
              <TextInput
                style={styles.tenderInput}
                keyboardType="numeric"
                placeholder={cartTotal.toString()}
                placeholderTextColor="#94A3B8"
                value={amountTendered > 0 ? amountTendered.toString() : ''}
                onChangeText={(val) => setAmountTendered(parseFloat(val) || 0)}
              />
              <TouchableOpacity
                style={styles.exactButton}
                onPress={() => setAmountTendered(cartTotal)}
              >
                <Text style={styles.exactButtonText}>Exact</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Bill Chips */}
            <View style={styles.quickBillsRow}>
              {quickBills.map((bill) => (
                <TouchableOpacity
                  key={bill}
                  style={styles.billChip}
                  onPress={() => setAmountTendered(bill)}
                >
                  <Text style={styles.billChipText}>+{bill.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Change Due Callout */}
            <View style={[styles.changeDueCard, changeDue > 0 && styles.changeDueActive]}>
              <View>
                <Text style={styles.changeDueLabel}>CHANGE DUE TO CUSTOMER</Text>
                <Text style={styles.changeDueAmount}>
                  {currency} {changeDue.toLocaleString()}
                </Text>
              </View>
              <Coins size={28} color={changeDue > 0 ? '#10B981' : '#94A3B8'} />
            </View>
          </View>
        ) : null}

        {/* Discounts & Adjustments */}
        <View style={styles.adjustmentSection}>
          <Text style={styles.sectionTitle}>Discount & Adjustments</Text>
          <View style={styles.adjustmentRow}>
            <View style={styles.discountInputWrapper}>
              <Percent size={18} color="#94A3B8" style={{ marginRight: 6 }} />
              <TextInput
                style={styles.discountInput}
                keyboardType="numeric"
                placeholder="Discount"
                placeholderTextColor="#94A3B8"
                value={discountValue > 0 ? discountValue.toString() : ''}
                onChangeText={(v) => setDiscountValue(parseFloat(v) || 0)}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.typeToggle,
                discountType === 'percentage' && styles.typeToggleActive,
              ]}
              onPress={() => setDiscountType('percentage')}
            >
              <Text
                style={[
                  styles.typeToggleText,
                  discountType === 'percentage' && styles.typeToggleTextActive,
                ]}
              >
                %
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeToggle, discountType === 'fixed' && styles.typeToggleActive]}
              onPress={() => setDiscountType('fixed')}
            >
              <Text
                style={[
                  styles.typeToggleText,
                  discountType === 'fixed' && styles.typeToggleTextActive,
                ]}
              >
                {currency}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Breakdown Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal ({cart.length} items)</Text>
            <Text style={styles.summaryValue}>
              {currency} {cartSubtotal.toLocaleString()}
            </Text>
          </View>
          {cartDiscount > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: '#EF4444' }]}>Discount</Text>
              <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
                -{currency} {cartDiscount.toLocaleString()}
              </Text>
            </View>
          ) : null}
          {cartTax > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax ({taxRate}%)</Text>
              <Text style={styles.summaryValue}>
                +{currency} {cartTax.toLocaleString()}
              </Text>
            </View>
          ) : null}
          <View style={[styles.summaryRow, styles.summaryDivider]}>
            <Text style={styles.grandTotalLabel}>Final Amount</Text>
            <Text style={styles.grandTotalValue}>
              {currency} {cartTotal.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Notes Field */}
        <TextInput
          style={styles.notesInput}
          placeholder="Transaction notes (optional)..."
          placeholderTextColor="#94A3B8"
          value={notes}
          onChangeText={setNotes}
        />
      </ScrollView>

      {/* Complete Button Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.completeButton, isProcessing && { opacity: 0.7 }]}
          onPress={handleCompletePayment}
          disabled={isProcessing}
          activeOpacity={0.8}
        >
          {isProcessing ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <CheckCircle2 size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.completeButtonText}>
                Complete Sale ({currency} {cartTotal.toLocaleString()})
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    paddingBottom: 110,
  },
  totalHeaderCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  totalAmountText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    marginVertical: 8,
  },
  customerTag: {
    backgroundColor: 'rgba(244, 113, 37, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  customerTagText: {
    color: '#F47125',
    fontSize: 12,
    fontWeight: '700',
  },
  walkInText: {
    color: '#64748B',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  methodsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  methodCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodCardSelected: {
    borderColor: '#F47125',
    backgroundColor: '#FFF7ED',
  },
  methodLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 6,
  },
  methodLabelSelected: {
    color: '#F47125',
    fontWeight: '700',
  },
  cashTenderSection: {
    marginBottom: 20,
  },
  tenderInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    height: 52,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    marginRight: 8,
  },
  tenderInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  exactButton: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  exactButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  quickBillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  billChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  billChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  changeDueCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginTop: 12,
  },
  changeDueActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  changeDueLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  changeDueAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#10B981',
    marginTop: 2,
  },
  adjustmentSection: {
    marginBottom: 20,
  },
  adjustmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  discountInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 44,
  },
  discountInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  typeToggle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeToggleActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  typeToggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  typeToggleTextActive: {
    color: '#FFFFFF',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  summaryDivider: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 8,
    paddingTop: 10,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F47125',
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    height: 48,
    fontSize: 13,
    color: '#0F172A',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 16,
    elevation: 8,
  },
  completeButton: {
    backgroundColor: '#F47125',
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F47125',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

