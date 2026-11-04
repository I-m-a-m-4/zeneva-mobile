import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Vibration,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Lock, Delete, LogOut, ShieldAlert } from 'lucide-react-native';

const PIN_LENGTH = 4;

export function PinLockScreen() {
  const { unlockApp, signOut, userProfile } = useAuth();
  const [pin, setPin] = useState('');
  const [isError, setIsError] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length >= PIN_LENGTH) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setIsError(false);

    if (nextPin.length === PIN_LENGTH) {
      setTimeout(() => {
        const success = unlockApp(nextPin);
        if (!success) {
          Vibration.vibrate(200);
          setIsError(true);
          setPin('');
          Alert.alert('Incorrect PIN', 'The security PIN entered is invalid. Please try again.');
        }
      }, 100);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setIsError(false);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out and lock this terminal?',
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
      {/* Header Info */}
      <View style={styles.header}>
        <View style={[styles.lockIconBadge, isError && styles.lockIconError]}>
          {isError ? <ShieldAlert size={32} color="#EF4444" /> : <Lock size={32} color="#F47125" />}
        </View>
        <Text style={styles.title}>Terminal Locked</Text>
        <Text style={styles.subtitle}>
          {userProfile?.name ? `Cashier: ${userProfile.name}` : 'Enter your 4-digit terminal PIN'}
        </Text>
      </View>

      {/* Dots Indicator */}
      <View style={styles.dotsContainer}>
        {Array.from({ length: PIN_LENGTH }).map((_, idx) => {
          const filled = idx < pin.length;
          return (
            <View
              key={idx}
              style={[
                styles.dot,
                filled && styles.dotFilled,
                isError && styles.dotError,
              ]}
            />
          );
        })}
      </View>

      {/* Numeric Keypad */}
      <View style={styles.keypad}>
        {[
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
          ['clear', '0', 'del'],
        ].map((row, rowIdx) => (
          <View key={rowIdx} style={styles.keypadRow}>
            {row.map((btn) => {
              if (btn === 'clear') {
                return (
                  <TouchableOpacity
                    key={btn}
                    style={styles.keySpecial}
                    onPress={() => setPin('')}
                  >
                    <Text style={styles.keySpecialText}>Clear</Text>
                  </TouchableOpacity>
                );
              }
              if (btn === 'del') {
                return (
                  <TouchableOpacity
                    key={btn}
                    style={styles.keySpecial}
                    onPress={handleDelete}
                  >
                    <Delete size={24} color="#64748B" />
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={btn}
                  style={styles.keyButton}
                  onPress={() => handleDigit(btn)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.keyText}>{btn}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Footer Switch Cashier */}
      <TouchableOpacity style={styles.switchButton} onPress={handleSignOut}>
        <LogOut size={18} color="#64748B" />
        <Text style={styles.switchButtonText}>Sign Out Cashier</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F8F6',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 56,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
  },
  lockIconBadge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    marginBottom: 16,
  },
  lockIconError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginVertical: 24,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#F47125',
    borderColor: '#F47125',
  },
  dotError: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  keypad: {
    width: '100%',
    maxWidth: 320,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  keyButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  keyText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#0F172A',
  },
  keySpecial: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keySpecialText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  switchButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 8,
  },
});

