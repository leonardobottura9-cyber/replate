import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { VaultStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import {
  DISCOVER_RECIPES,
  CATEGORY_COLORS,
  RecipeIngredient,
  DiscoverRecipe,
} from '../../data/discoverRecipes';

type Props = NativeStackScreenProps<VaultStackParamList, 'DiscoverRecipeDetail'>;

type Version = 'original' | 'replated';

// ─── Delta helper ─────────────────────────────────────────────────────────────

function deltaColor(before: number, after: number, lowerIsBetter: boolean, neutral = false): string {
  if (neutral) return Colors.text.muted;
  const delta = after - before;
  if (delta === 0) return Colors.text.muted;
  return (lowerIsBetter ? delta < 0 : delta > 0) ? Colors.success : Colors.error;
}

function deltaText(before: number, after: number, unit: string): string {
  const delta = after - before;
  if (delta === 0) return '—';
  return `${delta > 0 ? '+' : ''}${delta}${unit}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MacroChip({ label, value, unit, highlight }: { label: string; value: number; unit: string; highlight?: boolean }) {
  return (
    <View style={[styles.macroChip, highlight && styles.macroChipHighlight]}>
      <Text style={styles.macroChipValue}>{value}{unit}</Text>
      <Text style={styles.macroChipLabel}>{label}</Text>
    </View>
  );
}

function MacroCompareRow({
  label, before, after, unit, lowerIsBetter, neutral,
}: {
  label: string; before: number; after: number; unit: string;
  lowerIsBetter?: boolean; neutral?: boolean;
}) {
  const color = deltaColor(before, after, lowerIsBetter ?? true, neutral);
  return (
    <View style={styles.compareRow}>
      <Text style={styles.compareLabel}>{label}</Text>
      <Text style={styles.compareBefore}>{before}{unit}</Text>
      <Text style={styles.compareArrow}>→</Text>
      <Text style={styles.compareAfter}>{after}{unit}</Text>
      <Text style={[styles.compareDelta, { color }]}>{deltaText(before, after, unit)}</Text>
    </View>
  );
}

function IngredientList({ ingredients }: { ingredients: RecipeIngredient[] }) {
  return (
    <View style={styles.ingredientList}>
      {ingredients.map((ing, i) => (
        <View key={i} style={styles.ingredientRow}>
          <View style={styles.ingredientBullet} />
          <Text style={styles.ingredientAmount}>{ing.amount}</Text>
          <Text style={styles.ingredientItem}>{ing.item}</Text>
        </View>
      ))}
    </View>
  );
}

function InstructionList({ steps }: { steps: string[] }) {
  return (
    <View style={styles.instructionList}>
      {steps.map((step, i) => (
        <View key={i} style={styles.instructionRow}>
          <View style={styles.stepCircle}>
            <Text style={styles.stepNumber}>{i + 1}</Text>
          </View>
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function DiscoverRecipeDetailScreen({ route, navigation }: Props) {
  const recipe = DISCOVER_RECIPES.find(r => r.id === route.params.recipeId);
  const [activeVersion, setActiveVersion] = useState<Version>('replated');

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Recipe not found.</Text>
      </SafeAreaView>
    );
  }

  const catColors = CATEGORY_COLORS[recipe.category];
  const version = activeVersion === 'original' ? recipe.original : recipe.replated;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Back bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backLabel}>Discover</Text>
        </TouchableOpacity>
        <View style={[styles.categoryBadge, { backgroundColor: catColors.bg }]}>
          <Text style={[styles.categoryBadgeText, { color: catColors.text }]}>
            {recipe.category}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Hero ── */}
        <View style={styles.hero}>
          <View style={styles.heroEmoji}>
            <Text style={styles.heroEmojiText}>{recipe.emoji}</Text>
          </View>
          <Text style={styles.heroName}>{recipe.name}</Text>
          <Text style={styles.heroDescription}>{recipe.description}</Text>
        </View>

        {/* ── Time & servings bar ── */}
        <View style={styles.metaBar}>
          <MetaItem icon="⏱" label="Prep" value={recipe.prepTime} />
          <View style={styles.metaDivider} />
          <MetaItem icon="🔥" label="Cook" value={recipe.cookTime} />
          <View style={styles.metaDivider} />
          <MetaItem icon="🍽" label="Serves" value={String(recipe.servings)} />
        </View>

        {/* ── Macro comparison ── */}
        <SectionHeader title="Macro Comparison" />
        <View style={styles.card}>
          <View style={styles.compareHeaderRow}>
            <Text style={[styles.compareLabel, { opacity: 0 }]}>{'Cal'}</Text>
            <Text style={styles.compareColHead}>BEFORE</Text>
            <Text style={[styles.compareColHead, { opacity: 0 }]}>→</Text>
            <Text style={styles.compareColHead}>AFTER</Text>
            <Text style={styles.compareColHead}>CHANGE</Text>
          </View>
          <View style={styles.cardDivider} />
          <MacroCompareRow label="Calories" before={recipe.original.macros.calories} after={recipe.replated.macros.calories} unit="" lowerIsBetter />
          <MacroCompareRow label="Protein" before={recipe.original.macros.protein} after={recipe.replated.macros.protein} unit="g" lowerIsBetter={false} />
          <MacroCompareRow label="Fat" before={recipe.original.macros.fat} after={recipe.replated.macros.fat} unit="g" lowerIsBetter />
          <MacroCompareRow label="Carbs" before={recipe.original.macros.carbs} after={recipe.replated.macros.carbs} unit="g" neutral />
        </View>

        {/* ── Key swaps + tip ── */}
        <SectionHeader title="Key Swaps" />
        <View style={styles.card}>
          <View style={styles.swapTagsRow}>
            {recipe.replated.keySwaps.map((swap, i) => (
              <View key={i} style={styles.swapTag}>
                <Text style={styles.swapTagText}>{swap}</Text>
              </View>
            ))}
          </View>
          <View style={styles.tipBox}>
            <Text style={styles.tipEmoji}>💡</Text>
            <Text style={styles.tipText}>{recipe.replated.tip}</Text>
          </View>
        </View>

        {/* ── Version toggle ── */}
        <SectionHeader title="How to Make It" />
        <View style={styles.versionToggle}>
          <VersionTab
            label="Original"
            subtitle={recipe.original.label}
            active={activeVersion === 'original'}
            onPress={() => setActiveVersion('original')}
          />
          <VersionTab
            label="Healthier"
            subtitle={recipe.replated.label}
            active={activeVersion === 'replated'}
            onPress={() => setActiveVersion('replated')}
            accentColor
          />
        </View>

        {/* ── Macro summary for selected version ── */}
        <View style={styles.macroRow}>
          <MacroChip label="Cal" value={version.macros.calories} unit="" highlight={activeVersion === 'replated'} />
          <MacroChip label="Protein" value={version.macros.protein} unit="g" highlight={activeVersion === 'replated'} />
          <MacroChip label="Fat" value={version.macros.fat} unit="g" highlight={activeVersion === 'replated'} />
          <MacroChip label="Carbs" value={version.macros.carbs} unit="g" highlight={activeVersion === 'replated'} />
        </View>

        {/* ── Ingredients ── */}
        <View style={styles.subSectionHeader}>
          <Text style={styles.subSectionTitle}>Ingredients</Text>
          <Text style={styles.subSectionMeta}>serves {recipe.servings}</Text>
        </View>
        <View style={styles.card}>
          <IngredientList ingredients={version.ingredients} />
        </View>

        {/* ── Instructions ── */}
        <View style={styles.subSectionHeader}>
          <Text style={styles.subSectionTitle}>Instructions</Text>
        </View>
        <View style={styles.card}>
          <InstructionList steps={version.instructions} />
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Helper sub-components ────────────────────────────────────────────────────

function MetaItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaIcon}>{icon}</Text>
      <Text style={styles.metaValue}>{value}</Text>
      <Text style={styles.metaLabel}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function VersionTab({
  label, subtitle, active, onPress, accentColor,
}: {
  label: string; subtitle: string; active: boolean;
  onPress: () => void; accentColor?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.versionTab, active && (accentColor ? styles.versionTabActiveAccent : styles.versionTabActiveGray)]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.versionTabLabel, active && (accentColor ? styles.versionTabLabelActiveAccent : styles.versionTabLabelActiveGray)]}>
        {label}
      </Text>
      <Text style={[styles.versionTabSub, active && styles.versionTabSubActive]} numberOfLines={1}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorText: {
    color: Colors.text.muted,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backArrow: {
    fontSize: 20,
    color: Colors.accent,
    lineHeight: 24,
  },
  backLabel: {
    fontSize: 15,
    color: Colors.accent,
    fontWeight: '600',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },

  scroll: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  // Hero
  hero: {
    alignItems: 'center',
    marginBottom: 20,
  },
  heroEmoji: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroEmojiText: {
    fontSize: 42,
  },
  heroName: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 6,
  },
  heroDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Meta bar
  metaBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
    overflow: 'hidden',
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  metaDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  metaIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  metaLabel: {
    fontSize: 10,
    color: Colors.text.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 2,
  },

  // Section headings
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 10,
    marginTop: 4,
  },
  subSectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 16,
  },
  subSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  subSectionMeta: {
    fontSize: 12,
    color: Colors.text.muted,
  },

  // Shared card
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },

  // Macro comparison table
  compareHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  compareColHead: {
    flex: 1,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.text.muted,
    textAlign: 'right',
    letterSpacing: 0.5,
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  compareLabel: {
    width: 62,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  compareBefore: {
    flex: 1,
    fontSize: 12,
    color: Colors.text.muted,
    textDecorationLine: 'line-through',
    textAlign: 'right',
  },
  compareArrow: {
    width: 20,
    textAlign: 'center',
    color: Colors.gray400,
    fontSize: 12,
  },
  compareAfter: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'right',
  },
  compareDelta: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },

  // Key swaps
  swapTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  swapTag: {
    backgroundColor: Colors.accentLight + '30',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  swapTagText: {
    fontSize: 12,
    color: Colors.accentDark,
    fontWeight: '500',
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.accentLight + '20',
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  tipEmoji: {
    fontSize: 14,
    marginTop: 1,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    fontStyle: 'italic',
    color: Colors.text.secondary,
    lineHeight: 19,
  },

  // Version toggle
  versionToggle: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  versionTab: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  versionTabActiveGray: {
    backgroundColor: Colors.gray100,
    borderColor: Colors.gray300,
  },
  versionTabActiveAccent: {
    backgroundColor: Colors.accentLight + '25',
    borderColor: Colors.accent,
  },
  versionTabLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.muted,
    marginBottom: 2,
  },
  versionTabLabelActiveGray: {
    color: Colors.text.primary,
  },
  versionTabLabelActiveAccent: {
    color: Colors.accent,
  },
  versionTabSub: {
    fontSize: 11,
    color: Colors.text.muted,
    lineHeight: 15,
  },
  versionTabSubActive: {
    color: Colors.text.secondary,
  },

  // Macro chips row
  macroRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  macroChip: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  macroChipHighlight: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight + '15',
  },
  macroChipValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  macroChipLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 2,
  },

  // Ingredients
  ingredientList: {
    gap: 10,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
    marginTop: 6,
  },
  ingredientAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
    width: 90,
    lineHeight: 20,
  },
  ingredientItem: {
    flex: 1,
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 20,
  },

  // Instructions
  instructionList: {
    gap: 14,
  },
  instructionRow: {
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
  stepNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.white,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 21,
  },

  bottomPad: {
    height: 40,
  },
});
