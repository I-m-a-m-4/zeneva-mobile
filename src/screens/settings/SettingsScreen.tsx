import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useBranch } from '@/context/branch-context';
import { useI18n } from '@/context/i18n-context';
import type { LocaleCode } from '@/lib/i18n/config';
import {
  Store,
  Globe,
  Lock,
  LogOut,
  Layers,
  Shield,
  Check,
  ChevronRight,
  X,
  CreditCard,
  Building,
} from 'lucide-react-native';

const ALL_LOCALES: { code: LocaleCode; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
];

export function SettingsScreen() {
  const { userProfile, business, signOut, lockApp, setPin, hasPin } = useAuth();
  const { branches, activeBranchId, setActiveBranchId } = useBranch();
  const { locale, setLocale, t } = useI18n();

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const currentLang = ALL_LOCALES.find((l) => l.code === locale) || ALL_LOCALES[0];

  const handleSetNewPin = async () => {
    if (newPin.length !== 4) {
      Alert.alert('Invalid PIN', 'PIN must be exactly 4 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert('Mismatch', 'PINs do not match.');
      return;
    }

    await setPin(newPin);
    setShowPinModal(false);
    setNewPin('');
    setConfirmPin('');
    Alert.alert('PIN Updated', 'Terminal security PIN set successfully.');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out Terminal',
      'Are you sure you want to log out of this retail register?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Store Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.storeIcon}>
            <Store size={28} color="#F47125" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.storeName}>{business?.name || 'Zeneva Retail'}</Text>
            <Text style={styles.storeOwner}>
              {userProfile?.name} • Role: {userProfile?.role?.toUpperCase() || 'CASHIER'}
            </Text>
            <View style={styles.planBadge}>
              <Text style={styles.planText}>
                Plan: {business?.plan?.toUpperCase() || 'STARTER'}
              </Text>
            </View>
          </View>
        </View>

        {/* Multi-Branch Selector */}
        {branches.length > 1 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Store Branch</Text>
            <View style={styles.card}>
              {branches.map((b) => {
                const isActive = activeBranchId === b.id;
                return (
                  <TouchableOpacity
                    key={b.id}
                    style={[styles.rowItem, isActive && styles.rowItemActive]}
                    onPress={() => setActiveBranchId(b.id)}
                  >
                    <View style={styles.rowLeft}>
                      <Building size={18} color={isActive ? '#F47125' : '#64748B'} />
                      <Text style={[styles.rowText, isActive && styles.rowTextActive]}>
                        {b.name} {b.isPrimary ? '(Primary)' : ''}
                      </Text>
                    </View>
                    {isActive ? <Check size={18} color="#F47125" /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Regional & Language */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Internationalization (11 Locales)</Text>
          <TouchableOpacity
            style={styles.cardButton}
            onPress={() => setShowLanguageModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Globe size={20} color="#64748B" />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.cardButtonTitle}>App Language</Text>
                <Text style={styles.cardButtonSubtitle}>
                  {currentLang.nativeName} ({currentLang.name})
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Security & PIN Lock */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Terminal Security</Text>
          <TouchableOpacity
            style={styles.cardButton}
            onPress={() => setShowPinModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Lock size={20} color="#64748B" />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.cardButtonTitle}>
                  {hasPin ? 'Change Security PIN' : 'Set 4-Digit Terminal PIN'}
                </Text>
                <Text style={styles.cardButtonSubtitle}>
                  {hasPin ? 'PIN is active on this register' : 'Protect terminal when stepping away'}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          {hasPin ? (
            <TouchableOpacity
              style={[styles.cardButton, { marginTop: 10 }]}
              onPress={() => lockApp()}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <Shield size={20} color="#F47125" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={[styles.cardButtonTitle, { color: '#F47125' }]}>
                    Lock Terminal Now
                  </Text>
                  <Text style={styles.cardButtonSubtitle}>Requires PIN to resume POS actions</Text>
                </View>
              </View>
              <ChevronRight size={18} color="#F47125" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Cashier Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <LogOut size={18} color="#DC2626" style={{ marginRight: 8 }} />
          <Text style={styles.signOutBtnText}>Log Out Terminal Session</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Language Picker Modal */}
      <Modal visible={showLanguageModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              {ALL_LOCALES.map((l) => {
                const isSelected = locale === l.code;
                return (
                  <TouchableOpacity
                    key={l.code}
                    style={[styles.langRow, isSelected && styles.langRowActive]}
                    onPress={() => {
                      setLocale(l.code);
                      setShowLanguageModal(false);
                    }}
                  >
                    <View>
                      <Text style={[styles.langNative, isSelected && styles.langNativeActive]}>
                        {l.nativeName}
                      </Text>
                      <Text style={styles.langName}>{l.name}</Text>
                    </View>
                    {isSelected ? <Check size={18} color="#F47125" /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Set PIN Modal */}
      <Modal visible={showPinModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Terminal Security PIN</Text>
              <TouchableOpacity onPress={() => setShowPinModal(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Enter a 4-digit code to quickly lock and unlock the cashier screen.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New 4-Digit PIN</Text>
              <TextInput
                style={styles.pinInput}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                placeholder="••••"
                placeholderTextColor="#94A3B8"
                value={newPin}
                onChangeText={setNewPin}
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm 4-Digit PIN</Text>
              <TextInput
                style={styles.pinInput}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                placeholder="••••"
                placeholderTextColor="#94A3B8"
                value={confirmPin}
                onChangeText={setConfirmPin}
              />
            </View>

            <TouchableOpacity style={styles.savePinBtn} onPress={handleSetNewPin}>
              <Text style={styles.savePinBtnText}>Save Security PIN</Text>
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  storeIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  storeOwner: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  planBadge: {
    backgroundColor: '#0F172A',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  planText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardButtonTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardButtonSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowItemActive: {
    backgroundColor: '#FFF7ED',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginLeft: 10,
  },
  rowTextActive: {
    color: '#F47125',
    fontWeight: '700',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 10,
  },
  signOutBtnText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '700',
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
    marginBottom: 12,
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
  langRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  langRowActive: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  langNative: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  langNativeActive: {
    color: '#F47125',
  },
  langName: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  pinInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 8,
    color: '#0F172A',
    textAlign: 'center',
  },
  savePinBtn: {
    backgroundColor: '#F47125',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  savePinBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

