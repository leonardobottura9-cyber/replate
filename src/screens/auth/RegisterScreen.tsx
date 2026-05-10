import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/ui/Input';

const GREEN = '#1A3C34';
const WARM_WHITE = '#FAFAF7';
const ORANGE = '#E8845A';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

function parseAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('rate limit') || lower.includes('too many') || lower.includes('email rate')) {
    return "You've hit the sign-up limit for now. Please wait an hour and try again — this is a free-tier limit.";
  }
  if (lower.includes('already registered') || lower.includes('already in use') || lower.includes('unique')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (lower.includes('password')) {
    return 'Your password must be at least 6 characters.';
  }
  return 'Something went wrong. Please check your details and try again.';
}

export function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  function clearFieldError(field: keyof typeof errors) {
    setErrors(e => ({ ...e, [field]: undefined, general: undefined }));
  }

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim() } },
    });

    setLoading(false);

    if (error) {
      setErrors({ general: parseAuthError(error.message) });
      return;
    }

    // Email confirmation disabled in Supabase dashboard — session is immediate.
    // If somehow a session isn't returned (e.g., email confirmation re-enabled),
    // handle gracefully by redirecting to login with a message.
    if (data.user && !data.session) {
      setErrors({
        general: "We sent a confirmation email. Please verify your address, then sign in.",
      });
    }
    // If data.session is present, useAuth picks it up and RootNavigator swaps to Main automatically.
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Green header */}
        <View style={styles.heroBlock}>
          <Text style={styles.heroEmoji}>🥗</Text>
          <Text style={styles.heroTitle}>Replate</Text>
          <Text style={styles.heroTagline}>Eat the same. Just smarter.</Text>
        </View>

        {/* White form card */}
        <ScrollView
          style={styles.formCard}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.formTitle}>Create account</Text>
          <Text style={styles.formSubtitle}>Start your healthier cooking journey</Text>

          {errors.general ? (
            <View style={[
              styles.banner,
              errors.general.includes('confirmation') ? styles.bannerInfo : styles.bannerError,
            ]}>
              <Text style={[
                styles.bannerText,
                errors.general.includes('confirmation') ? styles.bannerTextInfo : styles.bannerTextError,
              ]}>
                {errors.general}
              </Text>
            </View>
          ) : null}

          <Input
            label="Full Name"
            placeholder="Your name"
            value={name}
            onChangeText={text => { setName(text); clearFieldError('name'); }}
            autoCapitalize="words"
            error={errors.name}
            autoComplete="name"
          />
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={text => { setEmail(text); clearFieldError('email'); }}
            keyboardType="email-address"
            error={errors.email}
            autoComplete="email"
          />
          <Input
            label="Password"
            placeholder="Min. 6 characters"
            value={password}
            onChangeText={text => { setPassword(text); clearFieldError('password'); }}
            secureToggle
            error={errors.password}
            autoComplete="new-password"
          />
          <Input
            label="Confirm Password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChangeText={text => { setConfirmPassword(text); clearFieldError('confirmPassword'); }}
            secureToggle
            error={errors.confirmPassword}
            autoComplete="new-password"
          />

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>{loading ? 'Creating account…' : 'Create Account'}</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: GREEN,
  },
  flex: {
    flex: 1,
  },

  heroBlock: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 32,
    backgroundColor: GREEN,
  },
  heroEmoji: {
    fontSize: 52,
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  heroTagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },

  formCard: {
    flex: 1,
    backgroundColor: WARM_WHITE,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  formContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 48,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: GREEN,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },

  banner: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  bannerError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  bannerInfo: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  bannerText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bannerTextError: {
    color: '#B91C1C',
  },
  bannerTextInfo: {
    color: '#1D4ED8',
  },

  primaryButton: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    fontSize: 15,
    color: '#6B7280',
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '700',
    color: ORANGE,
  },
});
