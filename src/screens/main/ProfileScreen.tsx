import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

const GREEN = '#1A3C34';
const WARM_WHITE = '#FAFAF7';
const APP_VERSION = '1.0.0';
const NOTIFICATIONS_KEY = 'replate_notifications';
const SWAP_COUNT_KEY = 'replate_swap_count';

interface Stats {
  savedRecipes: number;
  savedVideos: number;
  swapsDone: number;
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return (
    <View style={styles.statCard}>
      {loading ? (
        <ActivityIndicator size="small" color={GREEN} style={{ marginBottom: 6 }} />
      ) : (
        <Text style={styles.statValue}>{value}</Text>
      )}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function ProfileScreen() {
  const { user } = useAuth();

  const [stats, setStats] = useState<Stats>({ savedRecipes: 0, savedVideos: 0, swapsDone: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [notifications, setNotifications] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const initial = (user?.email?.[0] ?? 'U').toUpperCase();
  const displayName =
    user?.user_metadata?.name ??
    (user?.email ? user.email.split('@')[0] : 'User');

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    const [recipesRes, videosRes, swapVal, notifVal] = await Promise.all([
      supabase
        .from('recipes')
        .select('*', { count: 'exact', head: true })
        .like('source_url', 'discover:%'),
      supabase.from('saved_videos').select('*', { count: 'exact', head: true }),
      SecureStore.getItemAsync(SWAP_COUNT_KEY),
      SecureStore.getItemAsync(NOTIFICATIONS_KEY),
    ]);

    setStats({
      savedRecipes: recipesRes.count ?? 0,
      savedVideos: videosRes.count ?? 0,
      swapsDone: swapVal ? parseInt(swapVal, 10) : 0,
    });

    if (notifVal !== null) setNotifications(notifVal === 'true');
    setStatsLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { loadStats(); }, [loadStats]));

  async function handleToggleNotifications(val: boolean) {
    setNotifications(val);
    await SecureStore.setItemAsync(NOTIFICATIONS_KEY, String(val));
  }

  function handleEditProfile() {
    setEditName(displayName);
    setEditingName(true);
  }

  async function handleSaveName() {
    const trimmed = editName.trim();
    if (!trimmed) return;
    setSavingName(true);
    const { error } = await supabase.auth.updateUser({ data: { name: trimmed } });
    setSavingName(false);
    if (error) {
      Alert.alert('Error', 'Could not update your name. Please try again.');
    } else {
      setEditingName(false);
    }
  }

  async function handleSignOut() {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          await supabase.auth.signOut();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page header ── */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Profile</Text>
        </View>

        {/* ── Identity card ── */}
        <View style={styles.identityCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{initial}</Text>
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.emailText}>{user?.email}</Text>
        </View>

        {/* ── Stats row ── */}
        <View style={styles.statsCard}>
          <StatCard label="Saved" value={stats.savedRecipes} loading={statsLoading} />
          <View style={styles.statDivider} />
          <StatCard label="Videos" value={stats.savedVideos} loading={statsLoading} />
          <View style={styles.statDivider} />
          <StatCard label="Swaps" value={stats.swapsDone} loading={statsLoading} />
        </View>

        {/* ── My Account ── */}
        <Text style={styles.sectionLabel}>MY ACCOUNT</Text>
        <View style={styles.card}>

          {/* Edit Profile */}
          <TouchableOpacity
            style={styles.cardRow}
            onPress={handleEditProfile}
            activeOpacity={0.7}
          >
            <Text style={styles.rowIcon}>✏️</Text>
            <Text style={styles.rowLabel}>Edit Profile</Text>
            <Text style={styles.rowChevron}>›</Text>
          </TouchableOpacity>

          {editingName && (
            <View style={styles.editZone}>
              <TextInput
                style={styles.editInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your name"
                placeholderTextColor="#A8A8A2"
                autoFocus
                autoCapitalize="words"
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.editCancelBtn}
                  onPress={() => setEditingName(false)}
                >
                  <Text style={styles.editCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editSaveBtn, savingName && { opacity: 0.6 }]}
                  onPress={handleSaveName}
                  disabled={savingName}
                >
                  <Text style={styles.editSaveText}>{savingName ? 'Saving…' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.cardDivider} />

          {/* Notifications toggle */}
          <View style={[styles.cardRow, styles.cardRowSwitch]}>
            <Text style={styles.rowIcon}>🔔</Text>
            <Text style={styles.rowLabel}>Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: '#E0E0DC', true: GREEN + '66' }}
              thumbColor={
                Platform.OS === 'android'
                  ? notifications ? GREEN : '#BDBDBD'
                  : undefined
              }
              ios_backgroundColor="#E0E0DC"
            />
          </View>

          <View style={styles.cardDivider} />

          {/* App version */}
          <View style={styles.cardRow}>
            <Text style={styles.rowIcon}>📱</Text>
            <Text style={styles.rowLabel}>App Version</Text>
            <Text style={styles.rowValue}>{APP_VERSION}</Text>
          </View>

        </View>

        {/* ── Log out ── */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleSignOut}
          disabled={signingOut}
          activeOpacity={0.7}
        >
          {signingOut ? (
            <ActivityIndicator size="small" color="#BDBDBA" />
          ) : (
            <Text style={styles.logoutText}>Log out</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: WARM_WHITE,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 56,
  },

  pageHeader: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
  },

  // Identity card
  identityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E8E8E4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  avatarLetter: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  displayName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 13,
    color: '#6B7280',
  },

  // Stats
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E8E4',
    flexDirection: 'row',
    paddingVertical: 22,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E8E8E4',
    alignSelf: 'center',
  },
  statValue: {
    fontSize: 30,
    fontWeight: '800',
    color: GREEN,
    marginBottom: 4,
    lineHeight: 34,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A8A8A2',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  // Account card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E8E4',
    overflow: 'hidden',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  cardRowSwitch: {
    paddingVertical: 11,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F0F0EC',
    marginLeft: 52,
  },
  rowIcon: {
    fontSize: 17,
    width: 28,
    textAlign: 'center',
    marginRight: 8,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  rowChevron: {
    fontSize: 22,
    color: '#D0D0CB',
    fontWeight: '300',
    lineHeight: 26,
  },
  rowValue: {
    fontSize: 14,
    color: '#A8A8A2',
    fontWeight: '500',
  },

  // Inline edit zone
  editZone: {
    backgroundColor: '#F5F5F2',
    borderTopWidth: 1,
    borderTopColor: '#EBEBEB',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  editInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: GREEN + '55',
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A1A1A',
    marginBottom: 12,
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
  },
  editCancelBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0DC',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  editCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  editSaveBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editSaveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Logout
  logoutBtn: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0DC',
    backgroundColor: '#FFFFFF',
    minWidth: 140,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9E9E9A',
  },
});
