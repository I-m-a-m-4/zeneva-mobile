import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PosStackParamList } from '@/navigation/types';
import { useMobilePos, type PaymentMethod } from '@/context/MobilePosContext';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/i18n-context';
import { GlowInput } from '@/components/ui/GlowInput';
import { GlowButton } from '@/components/ui/GlowButton';
import {
  Banknote,
  CreditCard,
  Building2,
  BookOpen,
  Percent,
  Coins,
  CheckCircle2,
  FileText,
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
    selectedCustomer,
    completeSale,
  } = useMobilePos();
  const { business } = useAuth();
  const { t } = useI18n();

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

  const methods: { id: PaymentMethod; label: string; desc: string; icon: any }[] = [
    { id: 'cash', label: 'Cash', desc: 'Physical bills & coins', icon: Banknote },
    { id: 'card', label: 'Card / POS', desc: 'Debit / credit terminal', icon: CreditCard },
    { id: 'bank_transfer', label: 'Bank Transfer', desc: 'Direct wire / instant pay', icon: Building2 },
    { id: 'store_credit', label: 'Debt / Ledger', desc: 'Account credit balance', icon: BookOpen },
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
            <Text style={styles.walkInText}>Walk-in Guest Sale</Text>
          )}
        </View>

        {/* Payment Method 2x2 Grid */}
        <Text style={styles.sectionTitle}>Payment Method</Text>
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
                <Text style={styles.methodDesc}>{m.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Cash Tender Calculation */}
        {paymentMethod === 'cash' ? (
          <View style={styles.cashTenderSection}>
            <Text style={styles.sectionTitle}>Cash Tendered</Text>
            <View style={styles.tenderInputContainer}>
              <View style={{ flex: 1 }}>
                <GlowInput
                  placeholder={cartTotal.toString()}
                  keyboardType="numeric"
                  value={amountTendered > 0 ? amountTendered.toString() : ''}
                  onChangeText={(val) => setAmountTendered(parseFloat(val) || 0)}
                  leftIcon={<Text style={styles.currencyPrefix}>{currency}</Text>}
                  rightIcon={
                    <TouchableOpacity
                      style={styles.exactButton}
                      onPress={() => setAmountTendered(cartTotal)}
                    >
                      <Text style={styles.exactButtonText}>Exact</Text>
                    </TouchableOpacity>
                  }
                  containerStyle={{ marginVertical: 0 }}
                />
              </View>
            </View>

            {/* Quick Bill Chips */}
            <View style={styles.quickBillsRow}>
              {quickBills.map((bill) => (
                <TouchableOpacity
                  key={bill}
                  style={styles.billChip}
                  onPress={() => setAmountTendered(bill)}
                  activeOpacity={0.7}
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
            <View style={{ flex: 1 }}>
              <GlowInput
                placeholder="Discount value"
                keyboardType="numeric"
                value={discountValue > 0 ? discountValue.toString() : ''}
                onChangeText={(v) => setDiscountValue(parseFloat(v) || 0)}
                leftIcon={<Percent size={18} color="#94A3B8" />}
                containerStyle={{ marginVertical: 0 }}
              />
            </View>

            <View style={styles.toggleGroup}>
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
        </View>

        {/* Transaction Notes with GlowInput */}
        <View style={styles.notesSection}>
          <GlowInput
            label="Transaction Note (Optional)"
            placeholder="Add receipt memo or order notes..."
            value={notes}
            onChangeText={setNotes}
            leftIcon={<FileText size={18} color="#94A3B8" />}
          />
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
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>
                +{currency} {cartTax.toLocaleString()}
              </Text>
            </View>
          ) : null}
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalSummaryLabel}>Final Amount</Text>
            <Text style={styles.totalSummaryValue}>
              {currency} {cartTotal.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Complete Payment Button with button-glow */}
        <GlowButton
          title={`Complete Payment • ${currency} ${cartTotal.toLocaleString()}`}
          icon={<CheckCircle2 size={18} color="#FFFFFF" />}
          onPress={handleCompletePayment}
          isLoading={isProcessing}
          variant="primary"
          size="lg"
          style={{ marginTop: 20 }}
        />
      </ScrollView>
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
  totalHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 1,
  },
  totalAmountText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 6,
  },
  customerTag: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  customerTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F47125',
  },
  walkInText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 10,
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  methodCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  methodCardSelected: {
    borderColor: '#F47125',
    backgroundColor: '#FFF7ED',
  },
  methodLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 8,
  },
  methodLabelSelected: {
    color: '#F47125',
  },
  methodDesc: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 2,
  },
  cashTenderSection: {
    marginBottom: 20,
  },
  tenderInputContainer: {
    marginBottom: 10,
  },
  currencyPrefix: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  exactButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  exactButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  quickBillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  billChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
  },
  billChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  changeDueCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
  },
  changeDueActive: {
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
  },
  changeDueLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  changeDueAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 2,
  },
  adjustmentSection: {
    marginBottom: 16,
  },
  adjustmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2,
  },
  typeToggle: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  typeToggleActive: {
    backgroundColor: '#FFFFFF',
  },
  typeToggleText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  typeToggleTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  notesSection: {
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  totalSummaryLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalSummaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
});
