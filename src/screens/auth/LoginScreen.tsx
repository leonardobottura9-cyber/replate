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
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      setErrors({ general: 'Incorrect email or password. Please try again.' });
    }
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
          <Text style={styles.formTitle}>Welcome back</Text>
          <Text style={styles.formSubtitle}>Sign in to your account</Text>

          {errors.general ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errors.general}</Text>
            </View>
          ) : null}

          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={text => { setEmail(text); setErrors(e => ({ ...e, email: undefined, general: undefined })); }}
            keyboardType="email-address"
            error={errors.email}
            autoComplete="email"
          />
          <Input
            label="Password"
            placeholder="Your password"
            value={password}
            onChangeText={text => { setPassword(text); setErrors(e => ({ ...e, password: undefined, general: undefined })); }}
            secureToggle
            error={errors.password}
            autoComplete="password"
          />

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Create one</Text>
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

  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 14,
    color: '#B91C1C',
    lineHeight: 20,
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
