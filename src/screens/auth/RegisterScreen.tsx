import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/i18n-context';
import { Eye, EyeOff } from 'lucide-react-native';
import { GoogleIcon } from '@/components/common/GoogleIcon';

export function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signUpWithEmail } = useAuth();
  const { t } = useI18n();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage(t('auth.valInvalidEmail'));
      return;
    }
    if (password.length < 6) {
      setErrorMessage(t('auth.valPasswordMin'));
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      const finalName = name.trim() || email.split('@')[0];
      const finalBiz = businessName.trim() || `${finalName}'s Store`;
      await signUpWithEmail(email.trim(), password.trim(), finalName, finalBiz);
      // Auth state update handles transition to main app flow
    } catch (error: any) {
      let description = t('auth.createAccountFailed');
      if (error?.code === 'auth/email-already-in-use') {
        description = t('auth.emailAlreadyInUse');
      } else if (error?.code === 'auth/weak-password') {
        description = t('auth.valPasswordMin');
      } else if (error?.code === 'auth/invalid-email') {
        description = t('auth.valInvalidEmail');
      } else if (error?.message) {
        description = error.message;
      }
      setErrorMessage(description);
      Alert.alert(t('auth.authFailedTitle'), description);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    Alert.alert(
      t('auth.googleSignInFailedTitle'),
      'Google Sign-Up on mobile devices requires a registered SHA-1 certificate in Firebase Console. Please register with your email and password.',
      [{ text: 'OK' }]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Bar: Sign in link */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.ghostButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={styles.ghostButtonText}>{t('auth.signInLink')}</Text>
          </TouchableOpacity>
        </View>

        {/* Center content */}
        <View style={styles.centerContainer}>
          <View style={styles.formWrapper}>
            {/* Logo */}
            <View style={styles.logoRow}>
              <Image
                source={require('../../../assets/icon.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            {/* Headline & Subtitle */}
            <Text style={styles.headline}>{t('auth.signupTitle')}</Text>
            <Text style={styles.subtitle}>{t('auth.signupSubtitle')}</Text>

            {/* Google OAuth Button First (exactly as on signup/page.tsx line 468) */}
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={handleGoogleSignup}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <GoogleIcon size={18} />
              <Text style={styles.outlineButtonText}>{t('auth.continueWithGoogle')}</Text>
            </TouchableOpacity>

            {/* Divider: Or sign up with email */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerPill}>
                <Text style={styles.dividerText}>{t('auth.orSignupWithEmail')}</Text>
              </View>
            </View>

            {/* Error banner */}
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Form Fields */}
            <View style={styles.formGroup}>
              {/* Email */}
              <View style={styles.inputItem}>
                <Text style={styles.label}>{t('common.email')}</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={t('auth.emailPlaceholder')}
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errorMessage) setErrorMessage('');
                  }}
                />
              </View>

              {/* Your Name */}
              <View style={styles.inputItem}>
                <Text style={styles.label}>{t('auth.nameLabel')}</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={t('auth.namePlaceholder')}
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="words"
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    if (errorMessage) setErrorMessage('');
                  }}
                />
              </View>

              {/* Store / Business Name */}
              <View style={styles.inputItem}>
                <Text style={styles.label}>{t('auth.businessNameLabel')}</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={t('auth.businessNamePlaceholder')}
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="words"
                  value={businessName}
                  onChangeText={(val) => {
                    setBusinessName(val);
                    if (errorMessage) setErrorMessage('');
                  }}
                />
              </View>

              {/* Password */}
              <View style={styles.inputItem}>
                <Text style={styles.label}>{t('auth.password')}</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={[styles.textInput, styles.passwordInput]}
                    placeholder="••••••••••••"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      if (errorMessage) setErrorMessage('');
                    }}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color="#64748B" />
                    ) : (
                      <Eye size={18} color="#64748B" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>{t('auth.createAccountButton')}</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Bottom prompt: Already have an account? Sign in */}
            <View style={styles.bottomPrompt}>
              <Text style={styles.promptText}>{t('auth.alreadyHaveAccount')} </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkUnderline}>{t('auth.signInLink')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Legal Footer */}
        <View style={styles.legalFooter}>
          <Text style={styles.legalText}>
            {t('auth.legalSignUp')}{' '}
            <Text style={styles.legalLink}>{t('footer.linkTerms')}</Text>{' '}
            {t('auth.legalAnd')}{' '}
            <Text style={styles.legalLink}>{t('footer.linkPrivacyPolicy')}</Text>.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    width: '100%',
    minHeight: '100%',
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 12,
  },
  ghostButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  ghostButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 12,
  },
  formWrapper: {
    width: '100%',
    maxWidth: 380,
  },
  logoRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  outlineButton: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  outlineButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
  },
  dividerContainer: {
    position: 'relative',
    marginVertical: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dividerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    lineHeight: 18,
  },
  formGroup: {
    gap: 14,
  },
  inputItem: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 42,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    height: 44,
    backgroundColor: '#F47125',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  bottomPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  promptText: {
    fontSize: 13,
    color: '#0F172A',
  },
  linkUnderline: {
    fontSize: 13,
    color: '#0F172A',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  legalFooter: {
    marginTop: 24,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  legalText: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 14,
    maxWidth: 340,
  },
  legalLink: {
    color: '#F47125',
    textDecorationLine: 'underline',
  },
});
