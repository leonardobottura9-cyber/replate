import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types';
import { Colors } from '../constants/colors';
import { VaultStackNavigator } from './VaultStackNavigator';
import { SwapsScreen } from '../screens/main/SwapsScreen';
import { VideosScreen } from '../screens/main/VideosScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  );
}

export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.tabBar,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 84,
          paddingBottom: 24,
          paddingTop: 10,
        },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="RecipeVault"
        component={VaultStackNavigator}
        options={{
          title: 'Vault',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🥘" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Swaps"
        component={SwapsScreen}
        options={{
          title: 'Swaps',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔄" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Videos"
        component={VideosScreen}
        options={{
          title: 'Videos',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎬" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
