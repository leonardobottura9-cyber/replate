import React, { useRef, useState } from 'react';
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
import { analyzeSwaps } from '../../lib/swapEngine';
import { ReplatedAnalysis, IngredientAnalysis } from '../../types';

type ScreenState = 'idle' | 'loading' | 'results' | 'error';

// ─── Loading dots animation ───────────────────────────────────────────────────

const LOADING_STEPS = [
  'Reading your recipe...',
  'Reviewing every ingredient...',
  'Crafting your healthier version...',
  'Writing the full recipe...',
  'Almost there...',
];

function LoadingView() {
  const [stepIndex, setStepIndex] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => {
      setStepIndex(i => Math.min(i + 1, LOADING_STEPS.length - 1));
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingIconWrap}>
        <Text style={styles.loadingIcon}>🔄</Text>
      </View>
      <ActivityIndicator color={Colors.accent} size="large" style={{ marginBottom: 16 }} />
      <Text style={styles.loadingStep}>{LOADING_STEPS[stepIndex]}</Text>
      <Text style={styles.loadingHint}>
        Claude is analysing every ingredient and writing your complete replated recipe.
      </Text>
    </View>
  );
}

// ─── Ingredient row ───────────────────────────────────────────────────────────

function IngredientRow({ item, index }: { item: IngredientAnalysis; index: number }) {
  const isSwap = item.decision === 'swap';
  const calDelta = item.replacementMacros.calories - item.originalMacros.calories;
  const protDelta = item.replacementMacros.protein - item.originalMacros.protein;
  const fatDelta = item.replacementMacros.fat - item.originalMacros.fat;

  return (
    <View style={styles.ingredientRow}>
      {/* Index + original */}
      <View style={styles.ingredientHeader}>
        <View style={styles.ingredientIndex}>
          <Text style={styles.ingredientIndexText}>{index + 1}</Text>
        </View>
        <Text style={styles.ingredientOriginal}>{item.original}</Text>
      </View>

      {/* Decision badge + replacement */}
      <View style={styles.decisionRow}>
        {isSwap ? (
          <>
            <View style={styles.swapBadge}>
              <Text style={styles.swapBadgeText}>SWAPPED</Text>
            </View>
            <Text style={styles.swapArrow}>→</Text>
            <Text style={styles.replacementText}>{item.replacement}</Text>
          </>
        ) : (
          <View style={styles.keepBadge}>
            <Text style={styles.keepBadgeText}>✓  STAYS</Text>
          </View>
        )}
      </View>

      {/* Why */}
      <Text style={styles.whyText}>{item.why}</Text>

      {/* Macro delta — only shown for swaps where something actually changed */}
      {isSwap && calDelta !== 0 && (
        <View style={styles.macroDeltaRow}>
          <MacroPill
            label="Cal"
            delta={calDelta}
            unit=""
            lowerIsBetter
          />
          {protDelta !== 0 && (
            <MacroPill label="Protein" delta={protDelta} unit="g" lowerIsBetter={false} />
          )}
          {fatDelta !== 0 && (
            <MacroPill label="Fat" delta={fatDelta} unit="g" lowerIsBetter />
          )}
        </View>
      )}
    </View>
  );
}

function MacroPill({ label, delta, unit, lowerIsBetter }: {
  label: string; delta: number; unit: string; lowerIsBetter: boolean;
}) {
  const isGood = lowerIsBetter ? delta < 0 : delta > 0;
  const bg = isGood ? Colors.success + '18' : Colors.error + '18';
  const color = isGood ? Colors.success : Colors.error;
  const prefix = delta > 0 ? '+' : '';
  return (
    <View style={[styles.macroPill, { backgroundColor: bg }]}>
      <Text style={[styles.macroPillText, { color }]}>
        {prefix}{delta}{unit} {label}
      </Text>
    </View>
  );
}

// ─── Results document ─────────────────────────────────────────────────────────

function ResultsDocument({
  analysis,
  onClear,
}: {
  analysis: ReplatedAnalysis;
  onClear: () => void;
}) {
  const calSaved = analysis.totals.originalCalories - analysis.totals.replatedCalories;
  const protGained = analysis.totals.replatedProtein - analysis.totals.originalProtein;
  const fatReduced = analysis.totals.originalFat - analysis.totals.replatedFat;

  const swapCount = analysis.ingredients.filter(i => i.decision === 'swap').length;

  return (
    <View style={styles.document}>

      {/* ── Doc header ── */}
      <View style={styles.docHeader}>
        <View style={styles.docHeaderLeft}>
          <Text style={styles.docRecipeName}>{analysis.recipeName}</Text>
          <Text style={styles.docMeta}>
            {swapCount} swap{swapCount !== 1 ? 's' : ''} · {analysis.ingredients.length} ingredients reviewed
          </Text>
        </View>
        <TouchableOpacity style={styles.clearButton} onPress={onClear}>
          <Text style={styles.clearButtonText}>Start over</Text>
        </TouchableOpacity>
      </View>

      {/* ── Intro ── */}
      <Text style={styles.introText}>{analysis.intro}</Text>

      {/* ── Ingredient review ── */}
      <View style={styles.sectionDivider} />
      <Text style={styles.sectionLabel}>INGREDIENT REVIEW</Text>

      {analysis.ingredients.map((item, i) => (
        <React.Fragment key={i}>
          <IngredientRow item={item} index={i} />
          {i < analysis.ingredients.length - 1 && <View style={styles.rowDivider} />}
        </React.Fragment>
      ))}

      {/* ── Replated recipe ── */}
      <View style={styles.sectionDivider} />
      <View style={styles.recipeSection}>
        <Text style={styles.sectionLabel}>THE REPLATED RECIPE</Text>
        <Text style={styles.recipeTitle}>{analysis.recipeName}</Text>

        {/* Ingredients */}
        <Text style={styles.recipeSubHeading}>Ingredients</Text>
        <View style={styles.recipeIngredientList}>
          {analysis.replatedRecipe.ingredients.map((ing, i) => (
            <View key={i} style={styles.recipeIngredientRow}>
              <View style={styles.recipeIngredientDot} />
              <Text style={styles.recipeIngredientText}>{ing}</Text>
            </View>
          ))}
        </View>

        {/* Instructions */}
        <Text style={[styles.recipeSubHeading, { marginTop: 20 }]}>Instructions</Text>
        <View style={styles.recipeInstructionList}>
          {analysis.replatedRecipe.instructions.map((step, i) => (
            <View key={i} style={styles.recipeInstructionRow}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepNumber}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Celebration ── */}
      <View style={styles.celebrationBox}>
        <Text style={styles.celebrationEmoji}>🎉</Text>

        <View style={styles.celebrationStats}>
          {calSaved > 0 && (
            <View style={styles.celebStat}>
              <Text style={styles.celebStatNumber}>−{calSaved.toLocaleString()}</Text>
              <Text style={styles.celebStatLabel}>calories</Text>
            </View>
          )}
          {protGained > 0 && (
            <View style={styles.celebStat}>
              <Text style={[styles.celebStatNumber, { color: Colors.success }]}>+{protGained}g</Text>
              <Text style={styles.celebStatLabel}>protein</Text>
            </View>
          )}
          {fatReduced > 0 && (
            <View style={styles.celebStat}>
              <Text style={[styles.celebStatNumber, { color: Colors.success }]}>−{fatReduced}g</Text>
              <Text style={styles.celebStatLabel}>fat</Text>
            </View>
          )}
        </View>

        <Text style={styles.celebrationMessage}>{analysis.celebration.message}</Text>
      </View>

    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function SwapsScreen() {
  const [input, setInput] = useState('');
  const [analysis, setAnalysis] = useState<ReplatedAnalysis | null>(null);
  const [screenState, setScreenState] = useState<ScreenState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const canAnalyze = input.trim().length >= 15 && screenState !== 'loading';

  async function handleAnalyze() {
    if (!canAnalyze) return;
    setScreenState('loading');
    setAnalysis(null);
    setErrorMessage('');
    try {
      const result = await analyzeSwaps(input.trim());
      setAnalysis(result);
      setScreenState('results');
      setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: false }), 50);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setScreenState('error');
    }
  }

  function handleClear() {
    setInput('');
    setAnalysis(null);
    setScreenState('idle');
    setErrorMessage('');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <Text style={styles.title}>Replate It</Text>
            <Text style={styles.subtitle}>Paste a recipe and I'll rebuild it, healthier</Text>
          </View>

          {/* ── Input — hidden once results are shown ── */}
          {screenState !== 'results' && (
            <>
              <View style={[
                styles.textInputWrapper,
                screenState === 'loading' && styles.textInputDisabled,
              ]}>
                <TextInput
                  style={styles.textInput}
                  value={input}
                  onChangeText={setInput}
                  placeholder={
                    'Paste a recipe or list your ingredients...\n\nExample:\n1 cup butter\n1 cup white sugar\n2 eggs\n2 cups white flour\n1 tsp baking soda\n1 cup chocolate chips'
                  }
                  placeholderTextColor={Colors.gray400}
                  multiline
                  textAlignVertical="top"
                  editable={screenState !== 'loading'}
                  autoCorrect={false}
                  autoCapitalize="sentences"
                  blurOnSubmit={false}
                />
              </View>

              {input.trim().length > 0 && input.trim().length < 15 && (
                <Text style={styles.inputHint}>Add a bit more detail to get started</Text>
              )}

              <TouchableOpacity
                style={[styles.analyzeButton, !canAnalyze && styles.analyzeButtonDisabled]}
                onPress={handleAnalyze}
                disabled={!canAnalyze}
                activeOpacity={0.85}
              >
                <Text style={styles.analyzeButtonText}>
                  {screenState === 'loading' ? 'Analyzing…' : 'Replate this recipe →'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Loading ── */}
          {screenState === 'loading' && <LoadingView />}

          {/* ── Error ── */}
          {screenState === 'error' && (
            <View style={styles.errorCard}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorTitle}>Something went wrong</Text>
              <Text style={styles.errorMessage}>{errorMessage}</Text>
              <View style={styles.errorActions}>
                <TouchableOpacity style={styles.retryButton} onPress={handleAnalyze}>
                  <Text style={styles.retryText}>Try again</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.clearErrorButton} onPress={handleClear}>
                  <Text style={styles.clearErrorText}>Start over</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── Results ── */}
          {screenState === 'results' && analysis && (
            <ResultsDocument analysis={analysis} onClear={handleClear} />
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 60 },

  // Header
  header: { paddingTop: 16, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text.primary },
  subtitle: { fontSize: 13, color: Colors.text.muted, marginTop: 3 },

  // Input
  textInputWrapper: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    minHeight: 160,
    marginBottom: 6,
  },
  textInputDisabled: { opacity: 0.5 },
  textInput: {
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 22,
    minHeight: 130,
  },
  inputHint: {
    fontSize: 11,
    color: Colors.text.muted,
    marginBottom: 12,
    marginLeft: 2,
  },

  // Analyze button
  analyzeButton: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  analyzeButtonDisabled: { opacity: 0.45 },
  analyzeButtonText: { fontSize: 16, fontWeight: '700', color: Colors.white },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.accentLight + '35',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  loadingIcon: { fontSize: 34 },
  loadingStep: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingHint: {
    fontSize: 13,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 24,
  },

  // Error
  errorCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 16,
  },
  errorIcon: { fontSize: 32, marginBottom: 10 },
  errorTitle: { fontSize: 17, fontWeight: '700', color: Colors.text.primary, marginBottom: 6 },
  errorMessage: {
    fontSize: 13,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  errorActions: { flexDirection: 'row', gap: 10 },
  retryButton: {
    backgroundColor: Colors.accent,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: { fontSize: 14, fontWeight: '600', color: Colors.white },
  clearErrorButton: {
    backgroundColor: Colors.gray100,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  clearErrorText: { fontSize: 14, fontWeight: '600', color: Colors.text.secondary },

  // ── Document ─────────────────────────────────────────────────────────────

  document: { paddingTop: 4 },

  docHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  docHeaderLeft: { flex: 1, marginRight: 12 },
  docRecipeName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text.primary,
    lineHeight: 28,
    marginBottom: 4,
  },
  docMeta: { fontSize: 12, color: Colors.text.muted },
  clearButton: {
    backgroundColor: Colors.gray100,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  clearButtonText: { fontSize: 12, fontWeight: '600', color: Colors.text.secondary },

  introText: {
    fontSize: 15,
    color: Colors.text.secondary,
    lineHeight: 24,
    marginBottom: 4,
    fontStyle: 'italic',
  },

  sectionDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 22,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: Colors.text.muted,
    textTransform: 'uppercase',
    marginBottom: 18,
  },

  // ── Ingredient rows ───────────────────────────────────────────────────────

  ingredientRow: { paddingVertical: 2 },

  ingredientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  ingredientIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ingredientIndexText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.gray600,
  },
  ingredientOriginal: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
    flex: 1,
  },

  decisionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    paddingLeft: 32,
  },
  swapBadge: {
    backgroundColor: Colors.accent + '20',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.accent + '50',
  },
  swapBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.accent,
    letterSpacing: 0.6,
  },
  swapArrow: {
    fontSize: 14,
    color: Colors.gray400,
  },
  replacementText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent,
    flex: 1,
    flexWrap: 'wrap',
  },
  keepBadge: {
    backgroundColor: Colors.success + '18',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.success + '40',
  },
  keepBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.success,
    letterSpacing: 0.6,
  },

  whyText: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 21,
    paddingLeft: 32,
    marginBottom: 10,
  },

  macroDeltaRow: {
    flexDirection: 'row',
    gap: 6,
    paddingLeft: 32,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  macroPill: {
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  macroPillText: {
    fontSize: 11,
    fontWeight: '700',
  },

  rowDivider: {
    height: 1,
    backgroundColor: Colors.gray200,
    marginVertical: 16,
  },

  // ── Replated recipe ───────────────────────────────────────────────────────

  recipeSection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recipeTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 18,
    lineHeight: 26,
  },
  recipeSubHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
    color: Colors.text.muted,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  recipeIngredientList: { gap: 10 },
  recipeIngredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  recipeIngredientDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
    marginTop: 7,
    flexShrink: 0,
  },
  recipeIngredientText: {
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 22,
    flex: 1,
  },

  recipeInstructionList: { gap: 16 },
  recipeInstructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumber: { fontSize: 12, fontWeight: '800', color: Colors.white },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 22,
  },

  // ── Celebration ───────────────────────────────────────────────────────────

  celebrationBox: {
    marginTop: 22,
    backgroundColor: Colors.accent,
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
  },
  celebrationEmoji: {
    fontSize: 38,
    marginBottom: 16,
  },
  celebrationStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  celebStat: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  celebStatNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.white,
    marginBottom: 2,
  },
  celebStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  celebrationMessage: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 23,
    opacity: 0.95,
  },
});
