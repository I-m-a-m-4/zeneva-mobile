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
import { fonts } from '@/theme/typography';
import {
  Banknote,
  CreditCard,
  Building2,
  BookOpen,
  Percent,
  Coins,
  CheckCircle2,
  FileText,
  ArrowRight,
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
    { id: 'cash', label: 'Cash', desc: 'Physical currency', icon: Banknote },
    { id: 'card', label: 'Card / POS', desc: 'Debit / credit card', icon: CreditCard },
    { id: 'bank_transfer', label: 'Bank Transfer', desc: 'Instant bank transfer', icon: Building2 },
    { id: 'store_credit', label: 'Debt / Invoice', desc: 'Customer debt ledger', icon: BookOpen },
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

        {/* Bank Transfer Details Alert (Matching web PaymentPage) */}
        {paymentMethod === 'bank_transfer' ? (
          <View style={styles.terminalCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Building2 size={18} color="#10B981" />
              <Text style={styles.terminalTitle}>TERMINAL DIRECT ACCOUNT</Text>
              <View style={styles.activePill}><Text style={styles.activePillText}>ACTIVE</Text></View>
            </View>
            <Text style={styles.terminalDesc}>Instruct customer to transfer exact amount to:</Text>
            <View style={styles.terminalDetails}>
              <Text style={styles.terminalDetailText}>Bank: <Text style={{ fontFamily: fonts.bold, color: '#0F172A' }}>{(business?.settings as any)?.terminalBankName || 'Wema Bank'}</Text></Text>
              <Text style={styles.terminalDetailText}>Account No: <Text style={{ fontFamily: fonts.bold, color: '#0F172A' }}>{(business?.settings as any)?.terminalAccountNumber || '0123456789'}</Text></Text>
              <Text style={styles.terminalDetailText}>Account Name: <Text style={{ fontFamily: fonts.bold, color: '#0F172A' }}>{(business?.settings as any)?.terminalAccountName || `Zeneva - ${business?.name || 'Retail'}`}</Text></Text>
            </View>
          </View>
        ) : null}

        {/* Invoice / Debt Details Alert */}
        {paymentMethod === 'store_credit' ? (
          <View style={styles.invoiceCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <BookOpen size={18} color="#2563EB" />
              <Text style={styles.invoiceTitle}>Customer Debt Ledger</Text>
            </View>
            <Text style={styles.invoiceDesc}>
              This sale total will be booked directly to {selectedCustomer?.name || 'the customer'}&apos;s credit ledger.
            </Text>
          </View>
        ) : null}

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
              <Text style={styles.discountLabel}>Applied Discount</Text>
              <Text style={styles.discountValue}>
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

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.grandTotalLabel}>Net Total Payable</Text>
            <Text style={styles.grandTotalValue}>
              {currency} {cartTotal.toLocaleString()}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.floatingActionFooter}>
        <GlowButton
          title={isProcessing ? 'Recording Sale...' : `Complete Sale • ${currency} ${cartTotal.toLocaleString()}`}
          icon={<ArrowRight size={18} color="#FFFFFF" />}
          onPress={handleCompletePayment}
          isLoading={isProcessing}
          variant="primary"
          size="lg"
        />
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
    paddingBottom: 90,
  },
  totalHeaderCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  totalLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: fonts.bold,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  totalAmountText: {
    fontSize: 30,
    fontFamily: fonts.headingBold,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  customerTag: {
    marginTop: 10,
    backgroundColor: 'rgba(244, 113, 37, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  customerTagText: {
    color: '#FED7AA',
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  walkInText: {
    color: '#64748B',
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: fonts.headingBold,
    fontWeight: '700',
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
    fontFamily: fonts.bold,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 8,
  },
  methodLabelSelected: {
    color: '#F47125',
  },
  methodDesc: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: fonts.regular,
    marginTop: 2,
    textAlign: 'center',
  },
  terminalCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  terminalTitle: {
    fontSize: 12,
    fontFamily: fonts.headingBold,
    fontWeight: '700',
    color: '#065F46',
  },
  activePill: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  activePillText: {
    fontSize: 9,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
  },
  terminalDesc: {
    fontSize: 12,
    color: '#047857',
    fontFamily: fonts.regular,
    marginBottom: 6,
  },
  terminalDetails: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    gap: 3,
  },
  terminalDetailText: {
    fontSize: 12,
    color: '#334155',
    fontFamily: fonts.regular,
  },
  invoiceCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  invoiceTitle: {
    fontSize: 13,
    fontFamily: fonts.headingBold,
    fontWeight: '700',
    color: '#1E40AF',
  },
  invoiceDesc: {
    fontSize: 12,
    color: '#1E40AF',
    fontFamily: fonts.regular,
    marginTop: 4,
  },
  cashTenderSection: {
    marginBottom: 20,
  },
  tenderInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currencyPrefix: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: '#64748B',
  },
  exactButton: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  exactButtonText: {
    fontSize: 12,
    fontFamily: fonts.medium,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  billChipText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#0F172A',
  },
  changeDueCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  changeDueActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  changeDueLabel: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: '#64748B',
    letterSpacing: 0.8,
  },
  changeDueAmount: {
    fontSize: 20,
    fontFamily: fonts.headingBold,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  adjustmentSection: {
    marginBottom: 16,
  },
  adjustmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleGroup: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    height: 44,
  },
  typeToggle: {
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeToggleActive: {
    backgroundColor: '#0F172A',
  },
  typeToggleText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#64748B',
  },
  typeToggleTextActive: {
    color: '#FFFFFF',
  },
  notesSection: {
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 10,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: fonts.regular,
  },
  summaryValue: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#0F172A',
  },
  discountLabel: {
    fontSize: 13,
    color: '#DC2626',
    fontFamily: fonts.regular,
  },
  discountValue: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#DC2626',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontFamily: fonts.headingBold,
    fontWeight: '700',
    color: '#0F172A',
  },
  grandTotalValue: {
    fontSize: 17,
    fontFamily: fonts.headingBold,
    fontWeight: '800',
    color: '#0F172A',
  },
  floatingActionFooter: {
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
});
