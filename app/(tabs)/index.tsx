import React, { useEffect } from 'react';
import { StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import MarkdownViewerScreen from '@/components/MarkdownViewerScreen';
import { useSessionStore } from '@/store/sessionStore';
import { loadSampleMarkdown } from '@/utils/loadSampleMarkdown';

export default function MarkdownScreen() {
  const { loadSessionFromStorage } = useSessionStore();

  // Load session data when the app starts
  useEffect(() => {
    const initApp = async () => {
      // First try to load from storage
      await loadSessionFromStorage();
      
      // Check if we have markdown content after loading from storage
      const { markdown } = useSessionStore.getState();
      
      // If no markdown was loaded from storage, initialize with sample
      if (!markdown) {
        const sampleContent = await loadSampleMarkdown();
        if (sampleContent) {
          useSessionStore.getState().setMarkdown(sampleContent);
        }
      }
    };
    
    initApp();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <MarkdownViewerScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
});
