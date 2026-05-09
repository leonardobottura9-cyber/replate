import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Alert,
  ActivityIndicator,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/colors';
import { SavedVideo } from '../../types';

// ─── Platform helpers ─────────────────────────────────────────────────────────

type VideoPlatform = SavedVideo['platform'];

function detectPlatform(url: string): VideoPlatform {
  const lower = url.toLowerCase();
  if (lower.includes('tiktok.com') || lower.includes('vm.tiktok.com')) return 'tiktok';
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) return 'instagram';
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  return 'other';
}

const PLATFORM_META: Record<VideoPlatform, { emoji: string; label: string; color: string }> = {
  tiktok:    { emoji: '🎵', label: 'TikTok',    color: '#010101' },
  instagram: { emoji: '📸', label: 'Instagram',  color: '#C13584' },
  youtube:   { emoji: '📺', label: 'YouTube',    color: '#FF0000' },
  other:     { emoji: '🎬', label: 'Video',      color: Colors.gray500 },
};

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return url.startsWith('http');
  } catch {
    return false;
  }
}

// ─── Video card ───────────────────────────────────────────────────────────────

function VideoCard({ video, onDelete }: { video: SavedVideo; onDelete: () => void }) {
  const meta = PLATFORM_META[video.platform];

  async function handleOpen() {
    const canOpen = await Linking.canOpenURL(video.video_url);
    if (canOpen) {
      await Linking.openURL(video.video_url);
    } else {
      Alert.alert('Cannot open link', 'This link could not be opened on your device.');
    }
  }

  function handleDelete() {
    Alert.alert(
      'Remove video',
      `Remove "${video.title ?? 'this video'}" from your collection?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: onDelete },
      ]
    );
  }

  return (
    <TouchableOpacity style={styles.videoCard} activeOpacity={0.8} onPress={handleOpen}>
      {/* Platform colour strip */}
      <View style={[styles.platformStrip, { backgroundColor: meta.color + '18' }]}>
        <Text style={styles.platformEmoji}>{meta.emoji}</Text>
      </View>

      <View style={styles.videoCardContent}>
        <View style={styles.videoCardTop}>
          <View style={[styles.platformBadge, { backgroundColor: meta.color + '20' }]}>
            <Text style={[styles.platformBadgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.deleteIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.videoTitle} numberOfLines={2}>
          {video.title ?? 'Untitled video'}
        </Text>

        <Text style={styles.videoUrl} numberOfLines={1}>{video.video_url}</Text>

        <Text style={styles.tapHint}>Tap to open  →</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Add Video Modal ──────────────────────────────────────────────────────────

interface AddVideoModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function AddVideoModal({ visible, onClose, onSaved }: AddVideoModalProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const platform = url.trim() ? detectPlatform(url.trim()) : null;
  const platformMeta = platform ? PLATFORM_META[platform] : null;
  const canSave = isValidUrl(url.trim()) && title.trim().length > 0 && !saving;

  function handleClose() {
    setUrl('');
    setTitle('');
    onClose();
  }

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Not signed in', 'Please sign in to save videos.');
        return;
      }
      const { error } = await supabase.from('saved_videos').insert({
        user_id: user.id,
        video_url: url.trim(),
        title: title.trim(),
        platform: detectPlatform(url.trim()),
        thumbnail: null,
      });
      if (error) throw error;
      setUrl('');
      setTitle('');
      onSaved();
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <Pressable style={styles.modalOverlay} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalKAV}
        >
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            {/* Handle */}
            <View style={styles.sheetHandle} />

            <Text style={styles.sheetTitle}>Add a Video</Text>
            <Text style={styles.sheetSubtitle}>
              Paste a TikTok, Instagram, or YouTube link to save it to your collection.
            </Text>

            {/* URL field */}
            <Text style={styles.fieldLabel}>Video Link</Text>
            <View style={[styles.inputWrapper, url && !isValidUrl(url.trim()) && styles.inputWrapperError]}>
              <TextInput
                style={styles.textInput}
                value={url}
                onChangeText={setUrl}
                placeholder="https://www.tiktok.com/..."
                placeholderTextColor={Colors.gray400}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              {url.length > 0 && (
                <TouchableOpacity onPress={() => setUrl('')} style={styles.clearField}>
                  <Text style={styles.clearFieldText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Platform detection indicator */}
            {platformMeta && isValidUrl(url.trim()) && (
              <View style={styles.detectedRow}>
                <Text style={styles.detectedEmoji}>{platformMeta.emoji}</Text>
                <Text style={[styles.detectedLabel, { color: platformMeta.color }]}>
                  {platformMeta.label} detected
                </Text>
              </View>
            )}

            {/* Title field */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Title</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. High-protein pasta recipe"
                placeholderTextColor={Colors.gray400}
                autoCapitalize="sentences"
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
            </View>

            {/* Actions */}
            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveVideoButton, !canSave && styles.saveVideoButtonDisabled]}
                onPress={handleSave}
                disabled={!canSave}
              >
                {saving ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.saveVideoButtonText}>Save Video</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function VideosScreen() {
  const [videos, setVideos] = useState<SavedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchVideos = useCallback(async () => {
    const { data, error } = await supabase
      .from('saved_videos')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setVideos(data as SavedVideo[]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchVideos();
    }, [fetchVideos])
  );

  async function handleDelete(videoId: string) {
    await supabase.from('saved_videos').delete().eq('id', videoId);
    setVideos(prev => prev.filter(v => v.id !== videoId));
  }

  function handleSaved() {
    setModalVisible(false);
    fetchVideos();
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Saved Videos</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Saved Videos</Text>
          <Text style={styles.subtitle}>
            {videos.length > 0
              ? `${videos.length} video${videos.length !== 1 ? 's' : ''} saved`
              : 'Your cooking inspiration'}
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* ── Platform legend ── */}
      {videos.length > 0 && (
        <View style={styles.legendRow}>
          {(['tiktok', 'instagram', 'youtube'] as VideoPlatform[]).map(p => {
            const m = PLATFORM_META[p];
            const count = videos.filter(v => v.platform === p).length;
            if (count === 0) return null;
            return (
              <View key={p} style={styles.legendItem}>
                <Text style={styles.legendEmoji}>{m.emoji}</Text>
                <Text style={styles.legendCount}>{count}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* ── List ── */}
      <FlatList
        data={videos}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContent,
          videos.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchVideos(); }} tintColor={Colors.accent} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIcon}>🎬</Text>
            </View>
            <Text style={styles.emptyTitle}>No videos saved yet</Text>
            <Text style={styles.emptySubtitle}>
              Save cooking videos from TikTok, Instagram, and YouTube — all in one place.
            </Text>
            <TouchableOpacity style={styles.emptyAction} onPress={() => setModalVisible(true)}>
              <Text style={styles.emptyActionText}>Save your first video</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <VideoCard video={item} onDelete={() => handleDelete(item.id)} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />

      {/* ── FAB (visible when list has items) ── */}
      {videos.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <Text style={styles.fabText}>+ Add</Text>
        </TouchableOpacity>
      )}

      {/* ── Modal ── */}
      <AddVideoModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSaved={handleSaved}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.text.muted,
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 26,
    color: Colors.white,
    lineHeight: 30,
    marginTop: -2,
  },

  // Platform legend
  legendRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  legendEmoji: {
    fontSize: 14,
  },
  legendCount: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.secondary,
  },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: 4,
  },
  listContentEmpty: {
    flexGrow: 1,
  },

  // Video card
  videoCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  platformStrip: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformEmoji: {
    fontSize: 26,
  },
  videoCardContent: {
    flex: 1,
    padding: 14,
  },
  videoCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  platformBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  platformBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  deleteIcon: {
    fontSize: 14,
    color: Colors.text.muted,
    fontWeight: '600',
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
    lineHeight: 20,
    marginBottom: 4,
  },
  videoUrl: {
    fontSize: 11,
    color: Colors.text.muted,
    marginBottom: 8,
  },
  tapHint: {
    fontSize: 11,
    color: Colors.accent,
    fontWeight: '600',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: Colors.accent,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingVertical: 14,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  fabText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.accentLight + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyAction: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  emptyActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalKAV: {
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray300,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 6,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 19,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  inputWrapperError: {
    borderColor: Colors.error,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
    paddingVertical: 12,
  },
  clearField: {
    padding: 4,
  },
  clearFieldText: {
    fontSize: 13,
    color: Colors.text.muted,
  },
  detectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  detectedEmoji: {
    fontSize: 14,
  },
  detectedLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  saveVideoButton: {
    flex: 2,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
  },
  saveVideoButtonDisabled: {
    opacity: 0.45,
  },
  saveVideoButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
