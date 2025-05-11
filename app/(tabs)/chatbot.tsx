import React from 'react';
import { StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import ConversationsScreen from '@/components/ConversationsScreen';

export default function ChatbotTab() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <ConversationsScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', 
  },
});
