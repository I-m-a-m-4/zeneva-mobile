import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useBranch } from '@/context/branch-context';
import { useMobilePos } from '@/context/MobilePosContext';
import { fonts } from '@/theme/typography';
import {
  Store,
  Building2,
  ChevronDown,
  Wifi,
  WifiOff,
  PauseCircle,
  LogOut,
  Settings,
  Shield,
  X,
  Check,
} from 'lucide-react-native';

interface MobileTopHeaderProps {
  onOpenHeldSales?: () => void;
  onOpenSettings?: () => void;
}

export function MobileTopHeader({ onOpenHeldSales, onOpenSettings }: MobileTopHeaderProps) {
  const { user, userProfile, business, signOut } = useAuth();
  const { branches, activeBranchId, setActiveBranchId } = useBranch();
  const { heldSales, offlineQueueCount, isSyncingQueue } = useMobilePos();

  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

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
    : 'ZN';

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

  return (
    <View style={styles.header}>
      {/* Left: Branch / Store Switcher */}
      <TouchableOpacity
        style={styles.branchButton}
        onPress={() => setShowBranchModal(true)}
        activeOpacity={0.7}
      >
        <View style={styles.branchIconWrapper}>
          {activeBranchId === 'all' && hasMultipleBranches ? (
            <Building2 size={16} color="#F47125" />
          ) : (
            <Store size={16} color="#F47125" />
          )}
        </View>
        <Text style={styles.branchName} numberOfLines={1}>
          {currentBranchName}
        </Text>
        <ChevronDown size={14} color="#64748B" />
      </TouchableOpacity>

      {/* Right Controls: Network status, Queue, Held Sales, Avatar */}
      <View style={styles.rightControls}>
        {/* Network & Queue Indicator */}
        <View style={[styles.networkPill, offlineQueueCount > 0 && styles.networkPillQueue]}>
          <Wifi size={12} color={offlineQueueCount > 0 ? '#F59E0B' : '#10B981'} />
          <Text style={[styles.networkText, offlineQueueCount > 0 && styles.networkTextQueue]}>
            {offlineQueueCount > 0 ? `${offlineQueueCount} queued` : 'Online'}
          </Text>
        </View>

        {/* Held Sales Trigger Button */}
        {heldSales.length > 0 ? (
          <TouchableOpacity
            style={styles.heldButton}
            onPress={onOpenHeldSales}
            activeOpacity={0.7}
          >
            <PauseCircle size={18} color="#F47125" />
            <View style={styles.heldBadge}>
              <Text style={styles.heldBadgeText}>{heldSales.length}</Text>
            </View>
          </TouchableOpacity>
        ) : null}

        {/* User Profile Avatar with Plan Badge */}
        <TouchableOpacity
          style={styles.avatarButton}
          onPress={() => setShowProfileModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.avatarText}>{userInitials}</Text>
          <View style={styles.planBadge}>
            <Text style={styles.planBadgeText}>
              {plan === 'business' ? 'BIZ' : plan === 'pro' ? 'PRO' : 'STD'}
            </Text>
          </View>
        </TouchableOpacity>
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
                <Building2 size={18} color={activeBranchId === 'all' ? '#F47125' : '#64748B'} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.branchItemTitle}>All Branches (Consolidated)</Text>
                  <Text style={styles.branchItemSub}>Aggregate view of all locations</Text>
                </View>
                {activeBranchId === 'all' ? <Check size={18} color="#F47125" /> : null}
              </TouchableOpacity>
            ) : null}

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
                  <Store size={18} color={isSelected ? '#F47125' : '#64748B'} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.branchItemTitle}>{b.name}</Text>
                    <Text style={styles.branchItemSub}>{b.address || 'Physical Store'}</Text>
                  </View>
                  {isSelected ? <Check size={18} color="#F47125" /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* User Profile Quick Sheet Modal */}
      <Modal visible={showProfileModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.profileModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Account</Text>
              <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.profileInfoBox}>
              <View style={styles.largeAvatar}>
                <Text style={styles.largeAvatarText}>{userInitials}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.profileName}>{userProfile?.name || 'Cashier'}</Text>
                <Text style={styles.profileEmail}>{user?.email}</Text>
                <View style={styles.planTag}>
                  <Text style={styles.planTagText}>Plan: {plan.toUpperCase()}</Text>
                </View>
              </View>
            </View>

            <View style={styles.profileActions}>
              {onOpenSettings ? (
                <TouchableOpacity
                  style={styles.profileActionRow}
                  onPress={() => {
                    setShowProfileModal(false);
                    onOpenSettings();
                  }}
                >
                  <Settings size={18} color="#64748B" />
                  <Text style={styles.profileActionText}>Store Settings</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={[styles.profileActionRow, { borderBottomWidth: 0 }]}
                onPress={handleSignOut}
              >
                <LogOut size={18} color="#DC2626" />
                <Text style={[styles.profileActionText, { color: '#DC2626' }]}>Log out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 54,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  branchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '52%',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  branchIconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  branchName: {
    fontSize: 13,
    fontFamily: fonts.medium,
    fontWeight: '600',
    color: '#0F172A',
    flexShrink: 1,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  networkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  networkPillOffline: {
    backgroundColor: '#FEF2F2',
  },
  networkPillQueue: {
    backgroundColor: '#FEF3C7',
  },
  networkText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: '#10B981',
  },
  networkTextOffline: {
    color: '#DC2626',
  },
  networkTextQueue: {
    color: '#D97706',
  },
  heldButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heldBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#F47125',
    borderRadius: 8,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heldBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  avatarButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  planBadge: {
    position: 'absolute',
    bottom: -3,
    right: -4,
    backgroundColor: '#F47125',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 4,
  },
  planBadgeText: {
    color: '#FFFFFF',
    fontSize: 7,
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
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  profileModalCard: {
    width: '100%',
    maxWidth: 360,
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
  largeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fonts.bold,
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
});
