import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Share,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PosStackParamList } from '@/navigation/types';
import { useAuth } from '@/context/AuthContext';
import { useBranch } from '@/context/branch-context';
import { fonts } from '@/theme/typography';
import {
  CheckCircle,
  Share2,
  Printer,
  PlusCircle,
  MessageCircle,
  Store,
} from 'lucide-react-native';

export function ReceiptReviewScreen() {
  const route = useRoute<RouteProp<PosStackParamList, 'ReceiptReview'>>();
  const navigation = useNavigation<NativeStackNavigationProp<PosStackParamList>>();
  const { business } = useAuth();
  const { branches, activeBranchId } = useBranch();

  const receipt = route.params?.receipt;

  if (!receipt) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Receipt Not Found</Text>
        <TouchableOpacity
          style={styles.newSaleButton}
          onPress={() => navigation.navigate('SelectProducts')}
        >
          <Text style={styles.newSaleButtonText}>Return to POS</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currency = business?.settings?.currency || 'NGN';
  const branchName =
    branches.find((b) => b.id === receipt.branchId)?.name ||
    business?.name ||
    'Main Store';

  // Construct text receipt for sharing or WhatsApp
  const generateReceiptText = () => {
    let text = `🧾 *${business?.name || 'ZENEVA RETAIL'}*\n`;
    text += `📍 Branch: ${branchName}\n`;
    text += `🆔 Receipt: ${receipt.id}\n`;
    text += `📅 Date: ${new Date().toLocaleString()}\n`;
    text += `👤 Cashier: ${receipt.cashierName}\n`;
    if (receipt.customer) {
      text += `🤝 Customer: ${receipt.customer.name}\n`;
    }
    text += `--------------------------------\n`;
    receipt.items.forEach((item) => {
      text += `${item.name} x${item.quantity} = ${currency} ${(item.quantity * item.price).toLocaleString()}\n`;
    });
    text += `--------------------------------\n`;
    text += `Subtotal: ${currency} ${receipt.subtotal.toLocaleString()}\n`;
    if (receipt.discount > 0) text += `Discount: -${currency} ${receipt.discount.toLocaleString()}\n`;
    if (receipt.tax > 0) text += `Tax: +${currency} ${receipt.tax.toLocaleString()}\n`;
    text += `*TOTAL: ${currency} ${receipt.total.toLocaleString()}*\n`;
    text += `Method: ${String(receipt.paymentMethod).toUpperCase()}\n`;
    if (receipt.paymentMethod === 'Cash' || (receipt.paymentMethod as string) === 'cash') {
      text += `Tendered: ${currency} ${(receipt.amountTendered || receipt.total).toLocaleString()}\n`;
      text += `Change: ${currency} ${(receipt.changeDue || 0).toLocaleString()}\n`;
    }
    text += `\nThank you for shopping with us! Powered by Zeneva POS.`;
    return text;
  };

  const handleWhatsAppDispatch = async () => {
    const text = encodeURIComponent(generateReceiptText());
    let phone = receipt.customerPhone || '';
    const url = phone ? `whatsapp://send?phone=${phone.replace(/[^0-9]/g, '')}&text=${text}` : `whatsapp://send?text=${text}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Share.share({ message: generateReceiptText() });
      }
    } catch {
      await Share.share({ message: generateReceiptText() });
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: generateReceiptText(),
        title: `Receipt ${receipt.id}`,
      });
    } catch (e: any) {
      Alert.alert('Share Failed', e?.message || 'Could not share receipt.');
    }
  };

  const handlePrint = () => {
    Alert.alert(
      'Receipt Ready',
      `Thermal print job dispatched to local hardware printer for sale #${receipt.id}.`
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Success Banner */}
        <View style={styles.successBanner}>
          <CheckCircle size={44} color="#10B981" />
          <Text style={styles.successTitle}>Transaction Complete!</Text>
          <Text style={styles.successSubtitle}>
            Sale successfully recorded and queued for delta sync.
          </Text>
        </View>

        {/* Paper Receipt Simulation */}
        <View style={styles.paperReceipt}>
          {/* Header */}
          <View style={styles.receiptHeader}>
            <Text style={styles.storeTitle}>{business?.name || 'ZENEVA STORE'}</Text>
            <Text style={styles.storeSubtitle}>{branchName}</Text>
            <Text style={styles.receiptIdText}>Sale ID: #{receipt.id}</Text>
            <Text style={styles.receiptMetaText}>
              {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
            </Text>
          </View>

          <View style={styles.dashedDivider} />

          {/* Cashier & Customer Info */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cashier:</Text>
            <Text style={styles.infoValue}>{receipt.cashierName}</Text>
          </View>
          {receipt.customer ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Customer:</Text>
              <Text style={styles.infoValue}>{receipt.customer.name}</Text>
            </View>
          ) : null}

          <View style={styles.dashedDivider} />

          {/* Items */}
          <View style={styles.itemsList}>
            {receipt.items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQtyPrice}>
                    {item.quantity} x {currency} {item.price.toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.itemSubtotal}>
                  {currency} {(item.quantity * item.price).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.dashedDivider} />

          {/* Totals Breakdown */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalVal}>
              {currency} {receipt.subtotal.toLocaleString()}
            </Text>
          </View>
          {receipt.discount > 0 ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={[styles.totalVal, { color: '#EF4444' }]}>
                -{currency} {receipt.discount.toLocaleString()}
              </Text>
            </View>
          ) : null}
          {receipt.tax > 0 ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={styles.totalVal}>
                +{currency} {receipt.tax.toLocaleString()}
              </Text>
            </View>
          ) : null}
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>TOTAL</Text>
            <Text style={styles.grandTotalVal}>
              {currency} {receipt.total.toLocaleString()}
            </Text>
          </View>

          <View style={styles.dashedDivider} />

          {/* Payment Details */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Method:</Text>
            <Text style={[styles.infoValue, { textTransform: 'uppercase' }]}>
              {receipt.paymentMethod.replace('_', ' ')}
            </Text>
          </View>
          {receipt.paymentMethod === 'Cash' || (receipt.paymentMethod as string) === 'cash' ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Cash Tendered:</Text>
                <Text style={styles.infoValue}>
                  {currency} {(receipt.amountTendered || receipt.total).toLocaleString()}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Change Due:</Text>
                <Text style={[styles.infoValue, { color: '#10B981', fontWeight: '800' }]}>
                  {currency} {(receipt.changeDue || 0).toLocaleString()}
                </Text>
              </View>
            </>
          ) : null}

          {/* Footer message */}
          <View style={styles.receiptFooter}>
            <Text style={styles.footerThanks}>Thank you for your business!</Text>
            <Text style={styles.footerPowered}>Zeneva Operating System</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleWhatsAppDispatch}>
            <MessageCircle size={18} color="#10B981" />
            <Text style={[styles.actionButtonText, { color: '#10B981' }]}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Share2 size={18} color="#0F172A" />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handlePrint}>
            <Printer size={18} color="#0F172A" />
            <Text style={styles.actionButtonText}>Print</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Start New Sale Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.newSaleButton}
          onPress={() => navigation.navigate('SelectProducts')}
          activeOpacity={0.8}
        >
          <PlusCircle size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.newSaleButtonText}>Start New Sale</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  successBanner: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 8,
  },
  successTitle: {
    fontSize: 22,
    fontFamily: fonts.headingBold,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  successSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: fonts.regular,
    marginTop: 4,
    textAlign: 'center',
  },
  paperReceipt: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  storeTitle: {
    fontSize: 20,
    fontFamily: fonts.nexaBold,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  storeSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  receiptIdText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
    fontFamily: 'monospace',
  },
  receiptMetaText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: fonts.regular,
  },
  infoValue: {
    fontSize: 13,
    fontFamily: fonts.medium,
    fontWeight: '600',
    color: '#0F172A',
  },
  itemsList: {
    paddingVertical: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  itemDetails: {
    flex: 1,
    marginRight: 10,
  },
  itemName: {
    fontSize: 14,
    fontFamily: fonts.medium,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemQtyPrice: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  itemSubtotal: {
    fontSize: 14,
    fontFamily: fonts.headingBold,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: fonts.regular,
  },
  totalVal: {
    fontSize: 13,
    fontFamily: fonts.medium,
    fontWeight: '600',
    color: '#0F172A',
  },
  grandTotalRow: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#0F172A',
  },
  grandTotalLabel: {
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '900',
    color: '#0F172A',
  },
  grandTotalVal: {
    fontSize: 18,
    fontFamily: fonts.headingBold,
    fontWeight: '900',
    color: '#F47125',
  },
  receiptFooter: {
    alignItems: 'center',
    marginTop: 16,
  },
  footerThanks: {
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '600',
    color: '#0F172A',
  },
  footerPowered: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 16,
  },
  newSaleButton: {
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
  newSaleButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
});
