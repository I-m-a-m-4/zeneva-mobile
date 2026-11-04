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

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signInWithEmail } = useAuth();
  const { t } = useI18n();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage(t('auth.invalidCredentials'));
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      await signInWithEmail(email.trim(), password.trim());
      // On success, Auth state triggers navigation to MainTabs
    } catch (error: any) {
      let description = t('auth.invalidCredentials');
      if (
        error?.code === 'auth/user-not-found' ||
        error?.code === 'auth/wrong-password' ||
        error?.code === 'auth/invalid-credential'
      ) {
        description = t('auth.invalidCredentialsDetailed');
      } else if (error?.code === 'auth/too-many-requests') {
        description =
          'Too many failed login attempts. Access is temporarily locked for security. Please try again in 15 minutes.';
      } else if (error?.code === 'auth/network-request-failed') {
        description = 'Network connection failed. Please check your internet connection.';
      } else if (error?.code === 'auth/user-disabled') {
        description = 'This account has been disabled. Please contact support.';
      } else if (error?.message) {
        description = error.message;
      }
      setErrorMessage(description);
      Alert.alert(t('auth.loginFailedTitle'), description);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    Alert.alert(
      t('auth.googleSignInFailedTitle'),
      'Google Sign-In on mobile devices requires a registered SHA-1 certificate in Firebase Console. Please sign in with your email and password.',
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
        {/* Top bar: Create an account link */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.ghostButton}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.7}
          >
            <Text style={styles.ghostButtonText}>{t('auth.createAccountLink')}</Text>
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
            <Text style={styles.headline}>{t('auth.loginTitle')}</Text>
            <Text style={styles.subtitle}>{t('auth.loginSubtitle')}</Text>

            {/* Error banner if present */}
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

              {/* Password */}
              <View style={styles.inputItem}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>{t('auth.password')}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert(
                        t('auth.forgotPasswordLink'),
                        'To reset your password, please contact your store administrator or visit https://zeneva.space/forgot-password.'
                      )
                    }
                  >
                    <Text style={styles.forgotLink}>{t('auth.forgotPasswordLink')}</Text>
                  </TouchableOpacity>
                </View>
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

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>{t('auth.loginButton')}</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Divider: Or continue with */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerPill}>
                <Text style={styles.dividerText}>{t('auth.orContinueWith')}</Text>
              </View>
            </View>

            {/* Google OAuth Button */}
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={handleGoogleSignIn}
              activeOpacity={0.7}
            >
              <GoogleIcon size={18} />
              <Text style={styles.outlineButtonText}>Google</Text>
            </TouchableOpacity>

            {/* Bottom prompt: Don't have an account? Sign up */}
            <View style={styles.bottomPrompt}>
              <Text style={styles.promptText}>{t('auth.noAccountPrompt')} </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.linkUnderline}>{t('auth.signUpLink')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Legal Footer */}
        <View style={styles.legalFooter}>
          <Text style={styles.legalText}>
            {t('auth.legalSignIn')}{' '}
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
    maxWidth: 350,
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
    marginBottom: 24,
    lineHeight: 20,
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
    gap: 16,
  },
  inputItem: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
  },
  forgotLink: {
    fontSize: 13,
    color: '#0F172A',
    textDecorationLine: 'underline',
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
  dividerContainer: {
    position: 'relative',
    marginVertical: 20,
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
