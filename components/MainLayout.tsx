import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import Drawer from './Drawer';
import MarkdownViewerScreen from './MarkdownViewerScreen';
import ChatbotScreen from './ChatbotScreen';
import { useSessionStore } from '@/store/sessionStore';

const SettingsScreen = () => (
  <View style={{ flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' }}>
    {/* This is a placeholder for a future settings screen */}
  </View>
);

const MainLayout = () => {
  const { activeTab } = useSessionStore();

  // Render the appropriate screen based on the active tab
  const renderContent = () => {
    if (activeTab === 'chatbot') {
      return <ChatbotScreen />;
    } else if (activeTab === 'markdown') {
      return <MarkdownViewerScreen />;
    } else {
      // Default to markdown viewer
      return <MarkdownViewerScreen />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <Drawer>
        {renderContent()}
      </Drawer>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
});

export default MainLayout;
