import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
  Platform,
} from 'react-native';
import { fonts } from '@/theme/typography';

export interface GlowInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const GlowInput = React.forwardRef<any, GlowInputProps>(
  ({ label, error, leftIcon, rightIcon, containerStyle, style, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e: any) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <View style={[styles.wrapper, containerStyle]}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <View
          style={[
            styles.glowContainer,
            isFocused && styles.glowActive,
            !!error && styles.glowError,
          ]}
        >
          <View
            style={[
              styles.inputContainer,
              isFocused && styles.inputFocused,
              !!error && styles.inputError,
            ]}
          >
            {leftIcon ? <View style={styles.leftIconContainer}>{leftIcon}</View> : null}
            <TextInput
              ref={ref}
              style={[
                styles.textInput,
                leftIcon ? { paddingLeft: 8 } : null,
                rightIcon ? { paddingRight: 8 } : null,
                style,
              ]}
              placeholderTextColor="#94A3B8"
              onFocus={handleFocus}
              onBlur={handleBlur}
              {...props}
            />
            {rightIcon ? <View style={styles.rightIconContainer}>{rightIcon}</View> : null}
          </View>
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  }
);

GlowInput.displayName = 'GlowInput';

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginVertical: 4,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.medium,
    fontWeight: '500',
    color: '#0F172A',
    marginBottom: 6,
  },
  glowContainer: {
    borderRadius: 10,
    padding: 2,
    backgroundColor: 'transparent',
    transition: 'all 0.25s ease-out',
  } as ViewStyle,
  glowActive: {
    backgroundColor: 'rgba(244, 113, 37, 0.14)',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 0 0 3px rgba(244, 113, 37, 0.15), 0 0 16px 2px rgba(244, 113, 37, 0.22)',
        } as any)
      : {
          shadowColor: '#F47125',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.35,
          shadowRadius: 6,
          elevation: 3,
        }),
  },
  glowError: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  inputFocused: {
    borderColor: '#F47125',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#0F172A',
    padding: 0,
  },
  leftIconContainer: {
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconContainer: {
    marginLeft: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 2,
  },
});
