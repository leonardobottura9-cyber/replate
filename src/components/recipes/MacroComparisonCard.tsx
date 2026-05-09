import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { SwapSuggestion } from '../../types';

interface MacroRowProps {
  label: string;
  before: number;
  after: number;
  unit: string;
  /** If true, a decrease is shown as green (improvement). If false, an increase is green. */
  lowerIsBetter?: boolean;
  /** Neutral rows always use muted color regardless of direction (e.g., carbs). */
  neutral?: boolean;
}

function MacroRow({ label, before, after, unit, lowerIsBetter = true, neutral = false }: MacroRowProps) {
  const delta = after - before;

  let deltaColor: string = Colors.text.muted;
  if (!neutral && delta !== 0) {
    const isImprovement = lowerIsBetter ? delta < 0 : delta > 0;
    deltaColor = isImprovement ? Colors.success : Colors.error;
  }

  const prefix = delta > 0 ? '+' : '';
  const deltaText = `${prefix}${delta}${unit}`;

  return (
    <View style={styles.macroRow}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>{before}{unit}</Text>
      <Text style={styles.macroValue}>{after}{unit}</Text>
      <Text style={[styles.macroDelta, { color: deltaColor }]}>{deltaText}</Text>
    </View>
  );
}

interface Props {
  swap: SwapSuggestion;
}

export function MacroComparisonCard({ swap }: Props) {
  return (
    <View style={styles.card}>
      {/* Ingredient names */}
      <View style={styles.ingredientsRow}>
        <View style={styles.ingredientSide}>
          <Text style={styles.ingredientTag}>ORIGINAL</Text>
          <Text style={styles.ingredientName} numberOfLines={3}>{swap.original.ingredient}</Text>
        </View>

        <View style={styles.arrowContainer}>
          <Text style={styles.arrow}>→</Text>
        </View>

        <View style={styles.ingredientSide}>
          <Text style={[styles.ingredientTag, styles.swapTag]}>SWAP</Text>
          <Text style={[styles.ingredientName, styles.swapName]} numberOfLines={3}>
            {swap.swap.ingredient}
          </Text>
        </View>
      </View>

      {/* Reason */}
      <View style={styles.reasonBox}>
        <Text style={styles.reasonText}>"{swap.swap.reason}"</Text>
      </View>

      {/* Table header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.macroLabel, styles.invisible]}>{'Cal'}</Text>
        <Text style={styles.colHeader}>BEFORE</Text>
        <Text style={styles.colHeader}>AFTER</Text>
        <Text style={styles.colHeader}>CHANGE</Text>
      </View>

      <View style={styles.divider} />

      {/* Macro rows */}
      <MacroRow
        label="Cal"
        before={swap.original.macros.calories}
        after={swap.swap.macros.calories}
        unit=""
        lowerIsBetter={true}
      />
      <MacroRow
        label="Protein"
        before={swap.original.macros.protein}
        after={swap.swap.macros.protein}
        unit="g"
        lowerIsBetter={false}
      />
      <MacroRow
        label="Fat"
        before={swap.original.macros.fat}
        after={swap.swap.macros.fat}
        unit="g"
        lowerIsBetter={true}
      />
      <MacroRow
        label="Carbs"
        before={swap.original.macros.carbs}
        after={swap.swap.macros.carbs}
        unit="g"
        neutral={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  // Ingredients
  ingredientsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ingredientSide: {
    flex: 1,
  },
  ingredientTag: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: Colors.text.muted,
    marginBottom: 4,
  },
  swapTag: {
    color: Colors.accent,
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    lineHeight: 20,
  },
  swapName: {
    color: Colors.accent,
  },
  arrowContainer: {
    paddingTop: 16,
    paddingHorizontal: 10,
  },
  arrow: {
    fontSize: 18,
    color: Colors.gray400,
  },

  // Reason
  reasonBox: {
    backgroundColor: Colors.gray100,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  reasonText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: Colors.text.secondary,
    lineHeight: 18,
  },

  // Table
  tableHeader: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  colHeader: {
    flex: 1,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: Colors.text.muted,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 8,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  macroLabel: {
    width: 52,
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  macroValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'right',
  },
  macroDelta: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },

  // Utility
  invisible: {
    opacity: 0,
  },
});
