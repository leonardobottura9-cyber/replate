import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
} from '../../data/discoverRecipes';

type ActiveTab = 'vault' | 'discover';
type FilterCategory = Category | 'all';

// ─── Root screen ─────────────────────────────────────────────────────────────

export function RecipeVaultScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('vault');
  const [discoverFilter, setDiscoverFilter] = useState<FilterCategory>('all');
  const discoverListRef = useRef<FlatList>(null);

  const fetchRecipes = useCallback(async () => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setRecipes(data as Recipe[]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRecipes();
  }, [fetchRecipes]);

  function handleTabChange(tab: ActiveTab) {
    setActiveTab(tab);
  }

  function handleCategoryChange(cat: FilterCategory) {
    setDiscoverFilter(cat);
    discoverListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }

  const filteredDiscover =
    discoverFilter === 'all'
      ? DISCOVER_RECIPES
      : DISCOVER_RECIPES.filter((r) => r.category === discoverFilter);

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Shared header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Recipe Vault</Text>
          <Text style={styles.subtitle}>
            {activeTab === 'vault'
              ? `${recipes.length} saved recipe${recipes.length !== 1 ? 's' : ''}`
              : `${filteredDiscover.length} healthy recipes`}
          </Text>
        </View>
        {activeTab === 'vault' && (
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Tab toggle ── */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'vault' && styles.tabPillActive]}
          onPress={() => handleTabChange('vault')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabPillText, activeTab === 'vault' && styles.tabPillTextActive]}>
            🥘  My Vault
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'discover' && styles.tabPillActive]}
          onPress={() => handleTabChange('discover')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabPillText, activeTab === 'discover' && styles.tabPillTextActive]}>
            ✨  Discover
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── My Vault tab ── */}
      {activeTab === 'vault' && (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            recipes.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.accent}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="🥘"
              title="Your vault is empty"
              subtitle="Save your favourite recipes here and access them anytime, even offline."
              actionLabel="Add First Recipe"
              onAction={() => {}}
            />
          }
          renderItem={({ item }) => <RecipeCard recipe={item} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* ── Discover tab ── */}
      {activeTab === 'discover' && (
        <FlatList
          ref={discoverListRef}
          data={filteredDiscover}
          keyExtractor={(item) => item.id}
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

// ─── Discover section header (category pills) ─────────────────────────────────

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
      {/* Tagline */}
      <View style={styles.discoverTagline}>
        <Text style={styles.discoverTaglineTitle}>Healthy Inspiration</Text>
        <Text style={styles.discoverTaglineBody}>
          Browse original recipes alongside their smarter Replated versions — with full macro comparisons.
        </Text>
      </View>

      {/* Category pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryPill, isActive && styles.categoryPillActive]}
              onPress={() => onCategoryChange(cat.id as FilterCategory)}
              activeOpacity={0.7}
            >
              <Text style={styles.categoryPillEmoji}>{cat.emoji}</Text>
              <Text
                style={[
                  styles.categoryPillLabel,
                  isActive && styles.categoryPillLabelActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Result count */}
      <Text style={styles.discoverCount}>
        {recipeCount} recipe{recipeCount !== 1 ? 's' : ''}
      </Text>
    </View>
  );
}

// ─── My Vault recipe card ─────────────────────────────────────────────────────

function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.75}>
      {recipe.image_url ? (
        <Image source={{ uri: recipe.image_url }} style={styles.cardImage} />
      ) : (
        <View style={styles.cardImagePlaceholder}>
          <Text style={styles.cardImageEmoji}>🍽</Text>
        </View>
      )}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>{recipe.title}</Text>
        {recipe.description && (
          <Text style={styles.cardDescription} numberOfLines={2}>{recipe.description}</Text>
        )}
        {recipe.source_url && (
          <Text style={styles.cardSource} numberOfLines={1}>
            {new URL(recipe.source_url).hostname.replace('www.', '')}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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

  // Tab toggle
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

  // Lists
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  separator: {
    height: 12,
  },

  // Discover header
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

  // No results
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

  // My Vault card
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardImage: {
    width: 100,
    height: 100,
  },
  cardImagePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImageEmoji: {
    fontSize: 36,
  },
  cardContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
    lineHeight: 20,
  },
  cardDescription: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  cardSource: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '500',
  },
});
