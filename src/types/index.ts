export type SubscriptionTier = 'free' | 'pro' | 'premium';

export interface User {
  id: string;
  email: string;
  name: string | null;
  subscription_tier: SubscriptionTier;
  created_at: string;
}

export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  source_url: string | null;
  image_url: string | null;
  ingredients: string[];
  instructions: string;
  description: string | null;
  created_at: string;
}

export interface Swap {
  id: string;
  recipe_id: string;
  original_ingredient: string;
  swapped_ingredient: string;
  original_macros: MacroInfo | null;
  swapped_macros: MacroInfo | null;
  created_at: string;
}

export interface MacroInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

export interface SwapSuggestion {
  original: {
    ingredient: string;
    macros: MacroInfo;
  };
  swap: {
    ingredient: string;
    macros: MacroInfo;
    reason: string;
  };
}

export interface SavedVideo {
  id: string;
  user_id: string;
  video_url: string;
  platform: 'youtube' | 'tiktok' | 'instagram' | 'other';
  title: string | null;
  thumbnail: string | null;
  created_at: string;
}

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  RecipeVault: undefined;
  Swaps: undefined;
  Videos: undefined;
  Profile: undefined;
};

export type VaultStackParamList = {
  RecipeVaultMain: undefined;
  DiscoverRecipeDetail: { recipeId: string };
};
