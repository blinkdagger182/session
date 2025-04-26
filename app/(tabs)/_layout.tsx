import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Tabs, router } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

// Simple TabBarIcon component
const TabBarIcon = ({ name, color }: { name: React.ComponentProps<typeof Ionicons>['name']; color: string }) => {
  return <Ionicons size={24} name={name} color={color} />;
};
import { Colors } from '@/constants/Colors';
import { useSessionStore } from '@/store/sessionStore';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { activeTab, setActiveTab } = useSessionStore();

  // We'll handle tab changes through the tab press listeners instead of automatic navigation

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'dark'].tint,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#121212',
          borderTopColor: '#333',
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Markdown',
          tabBarIcon: ({ color }) => <TabBarIcon name="document-text" color={color} />,
        }}
        listeners={{
          tabPress: () => setActiveTab('markdown'),
        }}
      />
      <Tabs.Screen
        name="chatbot"
        options={{
          title: 'Copilot',
          tabBarIcon: ({ color }) => <TabBarIcon name="chatbubble-ellipses" color={color} />,
        }}
        listeners={{
          tabPress: () => setActiveTab('chatbot'),
        }}
      />
    </Tabs>
  );
}
