import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { VaultStackParamList } from '../types';
import { RecipeVaultScreen } from '../screens/main/RecipeVaultScreen';
import { DiscoverRecipeDetailScreen } from '../screens/main/DiscoverRecipeDetailScreen';

const Stack = createNativeStackNavigator<VaultStackParamList>();

export function VaultStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RecipeVaultMain" component={RecipeVaultScreen} />
      <Stack.Screen name="DiscoverRecipeDetail" component={DiscoverRecipeDetailScreen} />
    </Stack.Navigator>
  );
}
