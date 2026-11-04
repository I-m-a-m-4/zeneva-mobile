import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useBranch } from '@/context/branch-context';
import { useI18n } from '@/context/i18n-context';
import type { LocaleCode } from '@/lib/i18n/config';
import { GlowInput } from '@/components/ui/GlowInput';
import { GlowButton } from '@/components/ui/GlowButton';
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
                    activeOpacity={0.7}
                  >
                    <View style={styles.rowLeft}>
                      <Building size={18} color={isActive ? '#F47125' : '#64748B'} />
                      <Text style={[styles.rowLabel, isActive && styles.rowLabelActive]}>
                        {b.name}
                      </Text>
                    </View>
                    {isActive ? <Check size={18} color="#F47125" /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* General Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            {/* Language Selector */}
            <TouchableOpacity
              style={styles.rowItem}
              onPress={() => setShowLanguageModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <Globe size={18} color="#64748B" />
                <Text style={styles.rowLabel}>Application Language</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue}>{currentLang.name}</Text>
                <ChevronRight size={18} color="#94A3B8" />
              </View>
            </TouchableOpacity>

            {/* Currency Info */}
            <View style={styles.rowItem}>
              <View style={styles.rowLeft}>
                <CreditCard size={18} color="#64748B" />
                <Text style={styles.rowLabel}>Primary Currency</Text>
              </View>
              <Text style={styles.rowValue}>{business?.settings?.currency || 'NGN'}</Text>
            </View>
          </View>
        </View>

        {/* Security & Lock Screen */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security & Cashier Lock</Text>
          <View style={styles.card}>
            {/* Set / Change PIN */}
            <TouchableOpacity
              style={styles.rowItem}
              onPress={() => setShowPinModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <Shield size={18} color="#64748B" />
                <Text style={styles.rowLabel}>
                  {hasPin ? 'Change Terminal PIN' : 'Set Terminal PIN'}
                </Text>
              </View>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>

            {/* Lock Register Now */}
            {hasPin ? (
              <TouchableOpacity
                style={styles.rowItem}
                onPress={() => lockApp()}
                activeOpacity={0.7}
              >
                <View style={styles.rowLeft}>
                  <Lock size={18} color="#F47125" />
                  <Text style={[styles.rowLabel, { color: '#F47125' }]}>Lock Register Now</Text>
                </View>
                <ChevronRight size={18} color="#F47125" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Sign Out Button */}
        <GlowButton
          title="Sign Out Terminal"
          icon={<LogOut size={18} color="#EF4444" />}
          onPress={handleSignOut}
          variant="outline"
          size="default"
          textStyle={{ color: '#EF4444' }}
          style={{ marginTop: 24, borderColor: '#FCA5A5' }}
        />
      </ScrollView>

      {/* Language Selector Modal */}
      <Modal visible={showLanguageModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Language</Text>
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
                    style={[styles.langItem, isSelected && styles.langItemActive]}
                    onPress={() => {
                      setLocale(l.code);
                      setShowLanguageModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View>
                      <Text style={[styles.langName, isSelected && styles.langNameActive]}>
                        {l.name}
                      </Text>
                      <Text style={styles.langNative}>{l.nativeName}</Text>
                    </View>
                    {isSelected ? <Check size={18} color="#F47125" /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* PIN Setup Modal with GlowInputs */}
      <Modal visible={showPinModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Terminal Security PIN</Text>
              <TouchableOpacity onPress={() => setShowPinModal(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Enter a 4-digit numeric code to protect the register when unattended:
            </Text>

            <GlowInput
              label="New 4-Digit PIN"
              placeholder="••••"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              value={newPin}
              onChangeText={setNewPin}
              leftIcon={<Lock size={18} color="#94A3B8" />}
            />

            <GlowInput
              label="Confirm PIN"
              placeholder="••••"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              value={confirmPin}
              onChangeText={setConfirmPin}
              leftIcon={<Lock size={18} color="#94A3B8" />}
            />

            <GlowButton
              title="Save Terminal PIN"
              onPress={handleSetNewPin}
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 14,
  },
  storeIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  storeOwner: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  planBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 6,
  },
  planText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowItemActive: {
    backgroundColor: '#FFF7ED',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowLabel: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  rowLabelActive: {
    color: '#F47125',
    fontWeight: '600',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowValue: {
    fontSize: 14,
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
    marginBottom: 14,
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
  langItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 4,
  },
  langItemActive: {
    backgroundColor: '#FFF7ED',
  },
  langName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  langNameActive: {
    color: '#F47125',
  },
  langNative: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
