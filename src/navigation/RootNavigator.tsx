import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { MainNavigator } from './MainNavigator';

// AUTH BYPASSED — restore before launch:
// import { useAuth } from '../hooks/useAuth';
// import { AuthNavigator } from './AuthNavigator';
// import { LoadingSpinner } from '../components/ui/LoadingSpinner';
// ... then swap back to the session-gated navigator

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="Main" component={MainNavigator} />
    </Stack.Navigator>
  );
}
