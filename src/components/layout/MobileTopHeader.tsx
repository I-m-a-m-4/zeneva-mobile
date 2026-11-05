import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useBranch } from '@/context/branch-context';
import { useMobilePos } from '@/context/MobilePosContext';
import { fonts } from '@/theme/typography';
import {
  Store,
  Building2,
  ChevronDown,
  Clock,
  Bot,
  Calculator,
  Bell,
  Menu,
  LogOut,
  Settings,
  Shield,
  X,
  Check,
  Send,
  Trash2,
} from 'lucide-react-native';

interface MobileTopHeaderProps {
  onOpenHeldSales?: () => void;
  onOpenSettings?: () => void;
  onOpenMenu?: () => void;
}

export function MobileTopHeader({
  onOpenHeldSales,
  onOpenSettings,
  onOpenMenu,
}: MobileTopHeaderProps) {
  const insets = useSafeAreaInsets();
  const { user, userProfile, business, signOut } = useAuth();
  const { branches, activeBranchId, setActiveBranchId } = useBranch();
  const { heldSales, resumeHeldSale } = useMobilePos();

  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showHeldModal, setShowHeldModal] = useState(false);

  // Calculator state
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcPrev, setCalcPrev] = useState<number | null>(null);
  const [calcOp, setCalcOp] = useState<string | null>(null);
  const [calcResetOnNext, setCalcResetOnNext] = useState(false);

  // AI prompt state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    {
      sender: 'bot',
      text: 'Hello! I am Zen AI. Ask me about stock reorders, sales velocity, or product trends.',
    },
  ]);

  const plan = business?.plan || 'starter';
  const hasMultipleBranches = branches.length > 1;

  const currentBranchName =
    activeBranchId === 'all' && hasMultipleBranches
      ? 'All Branches'
      : branches.find((b) => b.id === activeBranchId)?.name || business?.name || 'Main Store';

  const userInitials = userProfile?.name
    ? userProfile.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'UV';

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of Zeneva?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          setShowProfileModal(false);
          signOut();
        },
      },
    ]);
  };

  // Calculator logic
  const handleCalcNumber = (digit: string) => {
    if (calcResetOnNext || calcDisplay === '0') {
      setCalcDisplay(digit);
      setCalcResetOnNext(false);
    } else {
      setCalcDisplay(calcDisplay + digit);
    }
  };

  const handleCalcOp = (op: string) => {
    setCalcPrev(parseFloat(calcDisplay));
    setCalcOp(op);
    setCalcResetOnNext(true);
  };

  const handleCalcEquals = () => {
    if (calcPrev !== null && calcOp) {
      const current = parseFloat(calcDisplay);
      let result = 0;
      switch (calcOp) {
        case '+':
          result = calcPrev + current;
          break;
        case '-':
          result = calcPrev - current;
          break;
        case '*':
          result = calcPrev * current;
          break;
        case '/':
          result = current !== 0 ? calcPrev / current : 0;
          break;
      }
      setCalcDisplay(String(result));
      setCalcPrev(null);
      setCalcOp(null);
      setCalcResetOnNext(true);
    }
  };

  const handleCalcClear = () => {
    setCalcDisplay('0');
    setCalcPrev(null);
    setCalcOp(null);
    setCalcResetOnNext(false);
  };

  // AI response mock logic
  const handleSendAi = () => {
    if (!aiPrompt.trim()) return;
    const q = aiPrompt.trim();
    setAiMessages((prev) => [...prev, { sender: 'user', text: q }]);
    setAiPrompt('');
    setTimeout(() => {
      let reply = 'Here is the analysis for your inventory: 3 items are low in stock, and sales velocity is currently stable.';
      if (q.toLowerCase().includes('stock') || q.toLowerCase().includes('low')) {
        reply = 'You have items that need restock soon: 13amps double metal socket and 1.5hp submersible pump.';
      } else if (q.toLowerCase().includes('today') || q.toLowerCase().includes('sales')) {
        reply = 'Today your register has processed transactions smoothly. Average basket size is steady.';
      }
      setAiMessages((prev) => [...prev, { sender: 'bot', text: reply }]);
    }, 500);
  };

  return (
    <>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top > 0 ? insets.top : 8,
            height: 52 + (insets.top > 0 ? insets.top : 8),
          },
        ]}
      >
        {/* Left Side: Sidebar / Menu Toggle + Store Selector */}
        <View style={styles.leftGroup}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={onOpenMenu}
            activeOpacity={0.7}
          >
            <Menu size={18} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.branchButton}
            onPress={() => setShowBranchModal(true)}
            activeOpacity={0.7}
          >
            <Store size={15} color="#F47125" />
            <Text style={styles.branchName} numberOfLines={1}>
              {currentBranchName}
            </Text>
            <ChevronDown size={13} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Right Side: Parked Sales, Zen AI, Calculator, Bell, Avatar */}
        <View style={styles.rightGroup}>
          {/* Parked / Held Sales Icon Button */}
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => {
              if (onOpenHeldSales) {
                onOpenHeldSales();
              } else {
                setShowHeldModal(true);
              }
            }}
            activeOpacity={0.7}
          >
            <Clock size={19} color="#334155" />
            {heldSales.length > 0 && (
              <View style={styles.orangeBadge}>
                <Text style={styles.badgeText}>{heldSales.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Zen AI Bot Button */}
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => setShowAiModal(true)}
            activeOpacity={0.7}
          >
            <Bot size={19} color="#334155" />
          </TouchableOpacity>

          {/* Calculator Button */}
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => setShowCalcModal(true)}
            activeOpacity={0.7}
          >
            <Calculator size={19} color="#334155" />
          </TouchableOpacity>

          {/* Notification Bell Button with Red Badge */}
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => setShowNotifModal(true)}
            activeOpacity={0.7}
          >
            <Bell size={19} color="#334155" />
            <View style={styles.redBadge}>
              <Text style={styles.badgeText}>19</Text>
            </View>
          </TouchableOpacity>

          {/* User Profile Avatar with Violet/Indigo Ring */}
          <TouchableOpacity
            style={styles.avatarButtonWithRing}
            onPress={() => setShowProfileModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.avatarRingText}>{userInitials}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Branch Switcher Modal */}
      <Modal visible={showBranchModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Switch Store Branch</Text>
              <TouchableOpacity onPress={() => setShowBranchModal(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {hasMultipleBranches ? (
              <TouchableOpacity
                style={[
                  styles.branchItem,
                  activeBranchId === 'all' && styles.branchItemActive,
                ]}
                onPress={() => {
                  setActiveBranchId('all');
                  setShowBranchModal(false);
                }}
              >
                <Building2 size={20} color={activeBranchId === 'all' ? '#F47125' : '#64748B'} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.branchItemTitle}>All Branches (Consolidated)</Text>
                  <Text style={styles.branchItemSub}>View consolidated inventory and sales</Text>
                </View>
                {activeBranchId === 'all' && <Check size={18} color="#F47125" />}
              </TouchableOpacity>
            ) : null}

            <ScrollView style={{ maxHeight: 260 }}>
              {branches.map((b) => {
                const isSelected = activeBranchId === b.id;
                return (
                  <TouchableOpacity
                    key={b.id}
                    style={[styles.branchItem, isSelected && styles.branchItemActive]}
                    onPress={() => {
                      setActiveBranchId(b.id);
                      setShowBranchModal(false);
                    }}
                  >
                    <Store size={20} color={isSelected ? '#F47125' : '#64748B'} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.branchItemTitle}>{b.name}</Text>
                      {b.address ? <Text style={styles.branchItemSub}>{b.address}</Text> : null}
                    </View>
                    {isSelected && <Check size={18} color="#F47125" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Zen AI Modal */}
      <Modal visible={showAiModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: 520, height: 480 }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Bot size={22} color="#F47125" />
                <Text style={styles.modalTitle}>Zen AI Assistant</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAiModal(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, marginBottom: 12 }}>
              {aiMessages.map((msg, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.aiBubble,
                    msg.sender === 'user' ? styles.aiBubbleUser : styles.aiBubbleBot,
                  ]}
                >
                  <Text
                    style={[
                      styles.aiBubbleText,
                      msg.sender === 'user' ? styles.aiBubbleTextUser : styles.aiBubbleTextBot,
                    ]}
                  >
                    {msg.text}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.aiInputRow}>
              <TextInput
                style={styles.aiInput}
                placeholder="Ask Zen AI..."
                placeholderTextColor="#94A3B8"
                value={aiPrompt}
                onChangeText={setAiPrompt}
                onSubmitEditing={handleSendAi}
              />
              <TouchableOpacity style={styles.aiSendBtn} onPress={handleSendAi}>
                <Send size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Quick Calculator Modal */}
      <Modal visible={showCalcModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 320 }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Calculator size={20} color="#F47125" />
                <Text style={styles.modalTitle}>Quick Calculator</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCalcModal(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Display */}
            <View style={styles.calcDisplayBox}>
              <Text style={styles.calcDisplayText} numberOfLines={1}>
                {calcDisplay}
              </Text>
            </View>

            {/* Keypad Grid */}
            <View style={styles.calcKeypad}>
              {['7', '8', '9', '/'].map((k) => (
                <TouchableOpacity
                  key={k}
                  style={[styles.calcKey, ['/'].includes(k) && styles.calcKeyOp]}
                  onPress={() => (k === '/' ? handleCalcOp('/') : handleCalcNumber(k))}
                >
                  <Text style={[styles.calcKeyText, ['/'].includes(k) && styles.calcKeyOpText]}>
                    {k}
                  </Text>
                </TouchableOpacity>
              ))}
              {['4', '5', '6', '*'].map((k) => (
                <TouchableOpacity
                  key={k}
                  style={[styles.calcKey, ['*'].includes(k) && styles.calcKeyOp]}
                  onPress={() => (k === '*' ? handleCalcOp('*') : handleCalcNumber(k))}
                >
                  <Text style={[styles.calcKeyText, ['*'].includes(k) && styles.calcKeyOpText]}>
                    {k === '*' ? '×' : k}
                  </Text>
                </TouchableOpacity>
              ))}
              {['1', '2', '3', '-'].map((k) => (
                <TouchableOpacity
                  key={k}
                  style={[styles.calcKey, ['-'].includes(k) && styles.calcKeyOp]}
                  onPress={() => (k === '-' ? handleCalcOp('-') : handleCalcNumber(k))}
                >
                  <Text style={[styles.calcKeyText, ['-'].includes(k) && styles.calcKeyOpText]}>
                    {k}
                  </Text>
                </TouchableOpacity>
              ))}
              {['C', '0', '=', '+'].map((k) => (
                <TouchableOpacity
                  key={k}
                  style={[
                    styles.calcKey,
                    k === 'C' && styles.calcKeyClear,
                    ['=', '+'].includes(k) && styles.calcKeyOp,
                    k === '=' && styles.calcKeyEquals,
                  ]}
                  onPress={() => {
                    if (k === 'C') handleCalcClear();
                    else if (k === '=') handleCalcEquals();
                    else if (k === '+') handleCalcOp('+');
                    else handleCalcNumber(k);
                  }}
                >
                  <Text
                    style={[
                      styles.calcKeyText,
                      k === 'C' && styles.calcKeyClearText,
                      ['=', '+'].includes(k) && styles.calcKeyOpText,
                      k === '=' && styles.calcKeyEqualsText,
                    ]}
                  >
                    {k}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal visible={showNotifModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: 420 }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Bell size={20} color="#F47125" />
                <Text style={styles.modalTitle}>Notifications (19)</Text>
              </View>
              <TouchableOpacity onPress={() => setShowNotifModal(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }}>
              <View style={styles.notifItem}>
                <Text style={styles.notifTitle}>Low Stock Alert</Text>
                <Text style={styles.notifBody}>
                  13amps double metal socket is currently out of stock.
                </Text>
                <Text style={styles.notifTime}>10 minutes ago</Text>
              </View>
              <View style={styles.notifItem}>
                <Text style={styles.notifTitle}>Offline Sync Complete</Text>
                <Text style={styles.notifBody}>
                  Pending cash register sales successfully committed to cloud.
                </Text>
                <Text style={styles.notifTime}>35 minutes ago</Text>
              </View>
              <View style={styles.notifItem}>
                <Text style={styles.notifTitle}>Daily Shift Started</Text>
                <Text style={styles.notifBody}>Register UV Electric session opened.</Text>
                <Text style={styles.notifTime}>2 hours ago</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Held Sales Modal */}
      <Modal visible={showHeldModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: 420 }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Clock size={20} color="#F47125" />
                <Text style={styles.modalTitle}>Parked Sales ({heldSales.length})</Text>
              </View>
              <TouchableOpacity onPress={() => setShowHeldModal(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {heldSales.length === 0 ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Clock size={36} color="#CBD5E1" />
                <Text style={{ marginTop: 8, color: '#64748B', fontFamily: fonts.medium }}>
                  No parked sales in queue.
                </Text>
              </View>
            ) : (
              <ScrollView style={{ flex: 1 }}>
                {heldSales.map((sale) => (
                  <View key={sale.id} style={styles.parkedCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.parkedNote}>{sale.notes || 'Parked Sale'}</Text>
                      <Text style={styles.parkedInfo}>
                        {sale.items.length} items • {new Date(sale.timestamp).toLocaleTimeString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.resumeBtn}
                      onPress={() => {
                        resumeHeldSale(sale.id);
                        setShowHeldModal(false);
                      }}
                    >
                      <Text style={styles.resumeBtnText}>Resume</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* User Profile Modal */}
      <Modal visible={showProfileModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.profileModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Account</Text>
              <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.profileInfoBox}>
              <View style={styles.avatarButtonWithRingLarge}>
                <Text style={styles.avatarRingTextLarge}>{userInitials}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.profileName}>
                  {userProfile?.name || business?.name || 'Cashier'}
                </Text>
                <Text style={styles.profileEmail}>{user?.email || 'cashier@zeneva.app'}</Text>
                <View style={styles.planTag}>
                  <Text style={styles.planTagText}>{plan.toUpperCase()} PLAN</Text>
                </View>
              </View>
            </View>

            <View style={styles.profileActions}>
              <TouchableOpacity
                style={styles.profileActionRow}
                onPress={() => {
                  setShowProfileModal(false);
                  if (onOpenSettings) onOpenSettings();
                }}
              >
                <Settings size={18} color="#64748B" />
                <Text style={styles.profileActionText}>Store Settings & Hardware</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.profileActionRow, { borderBottomWidth: 0 }]}
                onPress={handleSignOut}
              >
                <LogOut size={18} color="#DC2626" />
                <Text style={[styles.profileActionText, { color: '#DC2626' }]}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    maxWidth: 160,
  },
  branchName: {
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
    flexShrink: 1,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerIconButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  orangeBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#F47125',
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  redBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: fonts.bold,
    fontWeight: '800',
  },
  avatarButtonWithRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#6366F1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  avatarRingText: {
    color: '#4F46E5',
    fontSize: 12,
    fontFamily: fonts.bold,
    fontWeight: '800',
  },
  avatarButtonWithRingLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#6366F1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRingTextLarge: {
    color: '#4F46E5',
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  profileModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    fontWeight: '700',
    color: '#0F172A',
  },
  branchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  branchItemActive: {
    borderColor: '#F47125',
    backgroundColor: '#FFF7ED',
  },
  branchItemTitle: {
    fontSize: 14,
    fontFamily: fonts.medium,
    fontWeight: '600',
    color: '#0F172A',
  },
  branchItemSub: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  profileInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 15,
    fontFamily: fonts.headingBold,
    fontWeight: '700',
    color: '#0F172A',
  },
  profileEmail: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  planTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(244, 113, 37, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  },
  planTagText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: '#F47125',
  },
  profileActions: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  profileActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  profileActionText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#0F172A',
  },
  aiBubble: {
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: '85%',
  },
  aiBubbleBot: {
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
  },
  aiBubbleUser: {
    backgroundColor: '#F47125',
    alignSelf: 'flex-end',
  },
  aiBubbleText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    lineHeight: 18,
  },
  aiBubbleTextBot: {
    color: '#0F172A',
  },
  aiBubbleTextUser: {
    color: '#FFFFFF',
  },
  aiInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  aiInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#0F172A',
  },
  aiSendBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F47125',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calcDisplayBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  calcDisplayText: {
    fontSize: 26,
    fontFamily: fonts.headingBold,
    fontWeight: '800',
    color: '#0F172A',
  },
  calcKeypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  calcKey: {
    width: '22%',
    height: 46,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calcKeyText: {
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
  },
  calcKeyOp: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  calcKeyOpText: {
    color: '#F47125',
  },
  calcKeyClear: {
    backgroundColor: '#FEF2F2',
  },
  calcKeyClearText: {
    color: '#DC2626',
  },
  calcKeyEquals: {
    backgroundColor: '#F47125',
  },
  calcKeyEqualsText: {
    color: '#FFFFFF',
  },
  notifItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  notifTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#0F172A',
  },
  notifBody: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  notifTime: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  parkedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  parkedNote: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#0F172A',
  },
  parkedInfo: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  resumeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  resumeBtnText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: '#F47125',
  },
});
