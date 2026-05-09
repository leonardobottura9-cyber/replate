import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { MacroComparisonCard } from '../../components/recipes/MacroComparisonCard';
import { analyzeSwaps } from '../../lib/swapEngine';
import { SwapSuggestion } from '../../types';

type ScreenState = 'idle' | 'loading' | 'results' | 'error';

export function SwapsScreen() {
  const [input, setInput] = useState('');
  const [swaps, setSwaps] = useState<SwapSuggestion[]>([]);
  const [screenState, setScreenState] = useState<ScreenState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const canAnalyze = input.trim().length >= 15 && screenState !== 'loading';

  async function handleAnalyze() {
    if (!canAnalyze) return;

    setScreenState('loading');
    setSwaps([]);
    setErrorMessage('');

    try {
      const results = await analyzeSwaps(input.trim());
      setSwaps(results);
      setScreenState('results');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setErrorMessage(msg);
      setScreenState('error');
    }
  }

  function handleClear() {
    setInput('');
    setSwaps([]);
    setScreenState('idle');
    setErrorMessage('');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Ingredient Swaps</Text>
            <Text style={styles.subtitle}>AI-powered healthier substitutions</Text>
          </View>

          {/* Input Section */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Recipe or Ingredients</Text>
            <View style={[
              styles.textInputWrapper,
              screenState === 'loading' && styles.textInputDisabled,
            ]}>
              <TextInput
                style={styles.textInput}
                value={input}
                onChangeText={setInput}
                placeholder={"Paste a recipe or list ingredients...\n\nExample:\n2 cups butter\n1 cup white sugar\n3 cups white flour\n2 eggs\n1 cup sour cream"}
                placeholderTextColor={Colors.gray400}
                multiline
                textAlignVertical="top"
                editable={screenState !== 'loading'}
                autoCorrect={false}
                autoCapitalize="sentences"
                returnKeyType="default"
                blurOnSubmit={false}
              />
            </View>
            <Text style={styles.inputHint}>
              {input.trim().length < 15 && input.length > 0
                ? 'Add more detail to enable analysis'
                : 'Enter a recipe name, ingredient list, or paste a full recipe'}
            </Text>
          </View>

          {/* Analyze Button */}
          <Button
            title="Analyze Swaps"
            onPress={handleAnalyze}
            disabled={!canAnalyze}
            loading={screenState === 'loading'}
            style={styles.analyzeButton}
          />

          {/* Loading State */}
          {screenState === 'loading' && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={Colors.accent} size="large" />
              <Text style={styles.loadingTitle}>Claude is analyzing...</Text>
              <Text style={styles.loadingSubtitle}>Finding healthier substitutions</Text>
            </View>
          )}

          {/* Error State */}
          {screenState === 'error' && (
            <View style={styles.errorCard}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorTitle}>Analysis failed</Text>
              <Text style={styles.errorMessage}>{errorMessage}</Text>
              <TouchableOpacity onPress={handleAnalyze} style={styles.retryButton}>
                <Text style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Results State */}
          {screenState === 'results' && (
            <View style={styles.resultsSection}>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>
                  {swaps.length === 0
                    ? 'No swaps needed 🎉'
                    : `${swaps.length} healthier swap${swaps.length === 1 ? '' : 's'} found`}
                </Text>
                <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              </View>

              {swaps.length === 0 ? (
                <View style={styles.noSwapsCard}>
                  <Text style={styles.noSwapsEmoji}>✅</Text>
                  <Text style={styles.noSwapsText}>
                    Your recipe looks healthy! No significant ingredient improvements were identified.
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
                      <Text style={styles.legendLabel}>improvement</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: Colors.error }]} />
                      <Text style={styles.legendLabel}>trade-off</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: Colors.text.muted }]} />
                      <Text style={styles.legendLabel}>neutral</Text>
                    </View>
                  </View>
                  {swaps.map((swap, index) => (
                    <MacroComparisonCard key={index} swap={swap} />
                  ))}
                </>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Header
  header: {
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

  // Input
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInputWrapper: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    minHeight: 140,
  },
  textInputDisabled: {
    opacity: 0.6,
  },
  textInput: {
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 22,
    minHeight: 112,
  },
  inputHint: {
    fontSize: 11,
    color: Colors.text.muted,
    marginTop: 6,
    marginLeft: 2,
  },

  // Button
  analyzeButton: {
    marginBottom: 24,
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 16,
  },
  loadingSubtitle: {
    fontSize: 13,
    color: Colors.text.muted,
    marginTop: 4,
  },

  // Error
  errorCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  errorIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 6,
  },
  errorMessage: {
    fontSize: 13,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 14,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    backgroundColor: Colors.accent,
    borderRadius: 10,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },

  // Results
  resultsSection: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: Colors.gray100,
    borderRadius: 8,
  },
  clearText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    color: Colors.text.muted,
  },

  // No swaps
  noSwapsCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noSwapsEmoji: {
    fontSize: 32,
    marginBottom: 10,
  },
  noSwapsText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
