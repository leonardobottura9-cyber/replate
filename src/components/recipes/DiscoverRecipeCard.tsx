import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { DiscoverRecipe, CATEGORY_COLORS } from '../../data/discoverRecipes';
import { VaultStackParamList } from '../../types';

type NavProp = NativeStackNavigationProp<VaultStackParamList, 'RecipeVaultMain'>;

// ─── Collapsed macro summary stat ────────────────────────────────────────────

function SummaryStat({ label, before, after, unit, lowerIsBetter }: {
  label: string; before: number; after: number; unit: string; lowerIsBetter: boolean;
}) {
  const delta = after - before;
  const isImprovement = lowerIsBetter ? delta < 0 : delta > 0;
  const color = delta === 0 ? Colors.text.muted : isImprovement ? Colors.success : Colors.error;
  const prefix = delta > 0 ? '+' : '';

  return (
    <View style={styles.summaryStat}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryBefore}>{before}{unit}</Text>
      <Text style={[styles.summaryDelta, { color }]}>{prefix}{delta}{unit}</Text>
    </View>
  );
}

// ─── Category badge ───────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: DiscoverRecipe['category'] }) {
  const EMOJIS: Record<DiscoverRecipe['category'], string> = {
    breakfast: '🍳', lunch: '🥗', dinner: '🌙', snacks: '🍎',
  };
  const { bg, text } = CATEGORY_COLORS[category];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: text }]}>{EMOJIS[category]} {category}</Text>
    </View>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

interface Props {
  recipe: DiscoverRecipe;
}

export function DiscoverRecipeCard({ recipe }: Props) {
  const navigation = useNavigation<NavProp>();

  function handlePress() {
    navigation.navigate('DiscoverRecipeDetail', { recipeId: recipe.id });
  }

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={handlePress}>
      {/* ── Header ── */}
      <View style={styles.cardHeader}>
        <View style={styles.emojiContainer}>
          <Text style={styles.recipeEmoji}>{recipe.emoji}</Text>
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.recipeName}>{recipe.name}</Text>
          <Text style={styles.recipeDescription} numberOfLines={1}>{recipe.description}</Text>
          <Text style={styles.prepTime}>⏱ {recipe.prepTime}  🔥 {recipe.cookTime}</Text>
        </View>
        <View style={styles.badgeColumn}>
          <CategoryBadge category={recipe.category} />
          <Text style={styles.chevron}>›</Text>
        </View>
      </View>

      {/* ── Macro summary row ── */}
      <View style={styles.summaryRow}>
        <SummaryStat label="Cal"   before={recipe.original.macros.calories} after={recipe.replated.macros.calories} unit=""  lowerIsBetter={true}  />
        <SummaryStat label="Prot"  before={recipe.original.macros.protein}  after={recipe.replated.macros.protein}  unit="g" lowerIsBetter={false} />
        <SummaryStat label="Fat"   before={recipe.original.macros.fat}      after={recipe.replated.macros.fat}      unit="g" lowerIsBetter={true}  />
        <SummaryStat label="Carbs" before={recipe.original.macros.carbs}    after={recipe.replated.macros.carbs}    unit="g" lowerIsBetter={true}  />
      </View>

      <Text style={styles.tapHint}>Tap for full recipe  →</Text>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },

  // Header
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  emojiContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recipeEmoji: {
    fontSize: 26,
  },
  titleBlock: {
    flex: 1,
    marginRight: 8,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  recipeDescription: {
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 17,
    marginBottom: 3,
  },
  prepTime: {
    fontSize: 11,
    color: Colors.text.muted,
  },
  badgeColumn: {
    alignItems: 'flex-end',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'capitalize',
  },
  chevron: {
    fontSize: 18,
    color: Colors.text.muted,
    fontWeight: '300',
  },

  // Macro summary
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: Colors.gray100,
    borderRadius: 10,
    padding: 10,
    gap: 4,
    marginBottom: 10,
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Colors.text.muted,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  summaryBefore: {
    fontSize: 12,
    color: Colors.text.secondary,
    textDecorationLine: 'line-through',
    textDecorationColor: Colors.gray400,
    marginBottom: 1,
  },
  summaryDelta: {
    fontSize: 12,
    fontWeight: '700',
  },

  tapHint: {
    fontSize: 11,
    color: Colors.accent,
    fontWeight: '600',
    textAlign: 'right',
  },
});
