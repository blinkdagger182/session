import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import MainLayout from '@/components/MainLayout';
import { useSessionStore } from '@/store/sessionStore';
import { loadSampleMarkdown } from '@/utils/loadSampleMarkdown';

export default function IndexScreen() {
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

  return <MainLayout />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
});
