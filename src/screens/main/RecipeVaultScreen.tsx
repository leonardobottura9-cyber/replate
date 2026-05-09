import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/colors';
import { Recipe } from '../../types';
import { EmptyState } from '../../components/recipes/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { DiscoverRecipeCard } from '../../components/recipes/DiscoverRecipeCard';
import {
  DISCOVER_RECIPES,
  CATEGORIES,
  type Category,
  type DiscoverRecipe,
} from '../../data/discoverRecipes';

type ActiveTab = 'saved' | 'discover';
type FilterCategory = Category | 'all';

// ─── Root screen ─────────────────────────────────────────────────────────────

export function RecipeVaultScreen() {
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('saved');
  const [discoverFilter, setDiscoverFilter] = useState<FilterCategory>('all');
  const discoverListRef = useRef<FlatList>(null);

  const fetchSavedRecipes = useCallback(async () => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .like('source_url', 'discover:%')
      .order('created_at', { ascending: false });

    if (!error && data) setSavedRecipes(data as Recipe[]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSavedRecipes();
    }, [fetchSavedRecipes])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSavedRecipes();
  }, [fetchSavedRecipes]);

  function handleCategoryChange(cat: FilterCategory) {
    setDiscoverFilter(cat);
    discoverListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }

  // Map saved Supabase rows back to DiscoverRecipe objects
  const savedDiscoverRecipes: DiscoverRecipe[] = savedRecipes
    .map(r => DISCOVER_RECIPES.find(d => r.source_url === `discover:${d.id}`))
    .filter((r): r is DiscoverRecipe => r !== undefined);

  const filteredDiscover =
    discoverFilter === 'all'
      ? DISCOVER_RECIPES
      : DISCOVER_RECIPES.filter(r => r.category === discoverFilter);

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Recipe Vault</Text>
          <Text style={styles.subtitle}>
            {activeTab === 'saved'
              ? `${savedDiscoverRecipes.length} saved recipe${savedDiscoverRecipes.length !== 1 ? 's' : ''}`
              : `${filteredDiscover.length} healthy recipes`}
          </Text>
        </View>
      </View>

      {/* ── Tab toggle ── */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'saved' && styles.tabPillActive]}
          onPress={() => setActiveTab('saved')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabPillText, activeTab === 'saved' && styles.tabPillTextActive]}>
            🥘  My Recipes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'discover' && styles.tabPillActive]}
          onPress={() => setActiveTab('discover')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabPillText, activeTab === 'discover' && styles.tabPillTextActive]}>
            ✨  Discover
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── My Recipes tab ── */}
      {activeTab === 'saved' && (
        <FlatList
          data={savedDiscoverRecipes}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.listContent,
            savedDiscoverRecipes.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="🥘"
              title="No saved recipes yet"
              subtitle="Browse Discover and tap 'Save to My Recipes' on any recipe to find it here."
            />
          }
          renderItem={({ item }) => <DiscoverRecipeCard recipe={item} />}
        />
      )}

      {/* ── Discover tab ── */}
      {activeTab === 'discover' && (
        <FlatList
          ref={discoverListRef}
          data={filteredDiscover}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <DiscoverHeader
              activeCategory={discoverFilter}
              onCategoryChange={handleCategoryChange}
              recipeCount={filteredDiscover.length}
            />
          }
          renderItem={({ item }) => <DiscoverRecipeCard recipe={item} />}
          ListEmptyComponent={
            <View style={styles.noResults}>
              <Text style={styles.noResultsEmoji}>🔍</Text>
              <Text style={styles.noResultsText}>No recipes in this category yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─── Discover section header ──────────────────────────────────────────────────

function DiscoverHeader({
  activeCategory,
  onCategoryChange,
  recipeCount,
}: {
  activeCategory: FilterCategory;
  onCategoryChange: (cat: FilterCategory) => void;
  recipeCount: number;
}) {
  return (
    <View style={styles.discoverHeader}>
      <View style={styles.discoverTagline}>
        <Text style={styles.discoverTaglineTitle}>Healthy Inspiration</Text>
        <Text style={styles.discoverTaglineBody}>
          Browse original recipes alongside their smarter Replated versions — with full macro comparisons.
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryPill, isActive && styles.categoryPillActive]}
              onPress={() => onCategoryChange(cat.id as FilterCategory)}
              activeOpacity={0.7}
            >
              <Text style={styles.categoryPillEmoji}>{cat.emoji}</Text>
              <Text style={[styles.categoryPillLabel, isActive && styles.categoryPillLabelActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <Text style={styles.discoverCount}>
        {recipeCount} recipe{recipeCount !== 1 ? 's' : ''}
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  header: {
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

  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  tabPill: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillActive: {
    backgroundColor: Colors.accent,
  },
  tabPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  tabPillTextActive: {
    color: Colors.white,
  },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  listContentEmpty: {
    flexGrow: 1,
  },

  discoverHeader: {
    paddingBottom: 12,
  },
  discoverTagline: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  discoverTaglineTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  discoverTaglineBody: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 19,
  },
  categoryScroll: {
    paddingRight: 4,
    gap: 8,
    flexDirection: 'row',
    marginBottom: 12,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 5,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  categoryPillActive: {
    backgroundColor: Colors.accentLight + '25',
    borderColor: Colors.accent,
  },
  categoryPillEmoji: {
    fontSize: 15,
  },
  categoryPillLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  categoryPillLabelActive: {
    color: Colors.accent,
  },
  discoverCount: {
    fontSize: 12,
    color: Colors.text.muted,
    marginBottom: 4,
  },

  noResults: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  noResultsEmoji: {
    fontSize: 36,
    marginBottom: 12,
  },
  noResultsText: {
    fontSize: 15,
    color: Colors.text.muted,
  },
});
