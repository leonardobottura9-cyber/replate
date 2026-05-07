import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { EmptyState } from '../../components/recipes/EmptyState';

export function VideosScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Videos</Text>
        <Text style={styles.subtitle}>Your cooking inspiration</Text>
      </View>
      <EmptyState
        icon="🎬"
        title="No videos saved"
        subtitle="Save cooking videos from YouTube, TikTok, and Instagram all in one place."
        actionLabel="Save a Video"
        onAction={() => {}}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
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
});
