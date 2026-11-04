import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
  Platform,
} from 'react-native';

export interface GlowButtonProps {
  onPress: () => void;
  children?: React.ReactNode;
  title?: string;
  variant?: 'primary' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function GlowButton({
  onPress,
  children,
  title,
  variant = 'primary',
  size = 'default',
  isLoading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}: GlowButtonProps) {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isDestructive = variant === 'destructive';
  const isGhost = variant === 'ghost';

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        isPrimary && styles.primaryGlow,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.82}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={isPrimary || isDestructive ? '#FFFFFF' : '#0F172A'}
        />
      ) : (
        <>
          {icon ? <>{icon}</> : null}
          {title ? (
            <Text
              style={[
                styles.textBase,
                isPrimary || isDestructive ? styles.textLight : styles.textDark,
                textStyle,
              ]}
            >
              {title}
            </Text>
          ) : (
            children
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    gap: 8,
  },
  primary: {
    backgroundColor: '#F47125',
    borderWidth: 0,
  },
  primaryGlow: {
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 0 0 3px rgba(244, 113, 37, 0.12), 0 0 16px 2px rgba(244, 113, 37, 0.2)',
        } as any)
      : {
          shadowColor: '#F47125',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.28,
          shadowRadius: 5,
          elevation: 3,
        }),
  },
  outline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondary: {
    backgroundColor: '#F1F5F9',
    borderWidth: 0,
  },
  destructive: {
    backgroundColor: '#EF4444',
    borderWidth: 0,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  size_default: {
    height: 44,
    paddingHorizontal: 16,
  },
  size_sm: {
    height: 36,
    paddingHorizontal: 12,
  },
  size_lg: {
    height: 48,
    paddingHorizontal: 24,
  },
  disabled: {
    opacity: 0.5,
  },
  textBase: {
    fontSize: 14,
    fontWeight: '600',
  },
  textLight: {
    color: '#FFFFFF',
  },
  textDark: {
    color: '#0F172A',
  },
});
