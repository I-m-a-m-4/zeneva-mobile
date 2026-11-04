import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
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
import { Eye, EyeOff, Mail, User, Store, Lock } from 'lucide-react-native';
import { GoogleIcon } from '@/components/common/GoogleIcon';
import { GlowInput } from '@/components/ui/GlowInput';
import { GlowButton } from '@/components/ui/GlowButton';

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
            <GlowButton
              onPress={handleGoogleSignup}
              variant="outline"
              size="default"
              icon={<GoogleIcon size={18} />}
              title={t('auth.continueWithGoogle')}
              disabled={isLoading}
            />

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

            {/* Form Fields with glow effect on focus */}
            <View style={styles.formGroup}>
              {/* Email */}
              <GlowInput
                label={t('common.email')}
                placeholder={t('auth.emailPlaceholder')}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                value={email}
                leftIcon={<Mail size={18} color="#94A3B8" />}
                onChangeText={(val) => {
                  setEmail(val);
                  if (errorMessage) setErrorMessage('');
                }}
              />

              {/* Your Name */}
              <GlowInput
                label={t('auth.nameLabel')}
                placeholder={t('auth.namePlaceholder')}
                autoCapitalize="words"
                value={name}
                leftIcon={<User size={18} color="#94A3B8" />}
                onChangeText={(val) => {
                  setName(val);
                  if (errorMessage) setErrorMessage('');
                }}
              />

              {/* Store / Business Name */}
              <GlowInput
                label={t('auth.businessNameLabel')}
                placeholder={t('auth.businessNamePlaceholder')}
                autoCapitalize="words"
                value={businessName}
                leftIcon={<Store size={18} color="#94A3B8" />}
                onChangeText={(val) => {
                  setBusinessName(val);
                  if (errorMessage) setErrorMessage('');
                }}
              />

              {/* Password */}
              <GlowInput
                label={t('auth.password')}
                placeholder="••••••••••••"
                secureTextEntry={!showPassword}
                value={password}
                leftIcon={<Lock size={18} color="#94A3B8" />}
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color="#64748B" />
                    ) : (
                      <Eye size={18} color="#64748B" />
                    )}
                  </TouchableOpacity>
                }
                onChangeText={(val) => {
                  setPassword(val);
                  if (errorMessage) setErrorMessage('');
                }}
              />

              {/* Submit Button with button-glow */}
              <GlowButton
                title={t('auth.createAccountButton')}
                onPress={handleRegister}
                isLoading={isLoading}
                variant="primary"
                size="default"
                style={{ marginTop: 8 }}
              />
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
    marginBottom: 8,
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
    gap: 10,
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
