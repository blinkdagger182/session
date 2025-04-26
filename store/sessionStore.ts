import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SessionState {
  markdown: string | null;
  highlightContext: string | null;
  activeTab: 'markdown' | 'chatbot';
  setMarkdown: (md: string) => void;
  setHighlightContext: (text: string) => void;
  setActiveTab: (tab: 'markdown' | 'chatbot') => void;
  loadSessionFromStorage: () => Promise<void>;
  saveSessionToStorage: () => Promise<void>;
}

const STORAGE_KEY = '@session_markdown';
const LAST_SESSION_PATH_KEY = '@session_last_path';

export const useSessionStore = create<SessionState>((set, get) => ({
  markdown: null,
  highlightContext: null,
  activeTab: 'markdown',
  
  setMarkdown: (md: string) => {
    set({ markdown: md });
    // Save to storage when markdown is updated
    get().saveSessionToStorage();
  },
  
  setHighlightContext: (text: string) => set({ 
    highlightContext: text,
    // Automatically switch to chatbot tab when highlight context is set
    activeTab: 'chatbot'
  }),
  
  setActiveTab: (tab: 'markdown' | 'chatbot') => set({ activeTab: tab }),
  
  loadSessionFromStorage: async () => {
    try {
      const storedMarkdown = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedMarkdown) {
        set({ markdown: storedMarkdown });
        return;
      }
      // If no markdown found, set to null
      set({ markdown: null });
    } catch (error) {
      console.error('Failed to load session from storage:', error);
      set({ markdown: null });
    }
  },
  
  saveSessionToStorage: async () => {
    try {
      const { markdown } = get();
      if (markdown) {
        await AsyncStorage.setItem(STORAGE_KEY, markdown);
      }
    } catch (error) {
      console.error('Failed to save session to storage:', error);
    }
  },
}));

// Helper functions for session path management
export const saveLastSessionPath = async (path: string) => {
  try {
    await AsyncStorage.setItem(LAST_SESSION_PATH_KEY, path);
  } catch (error) {
    console.error('Failed to save last session path:', error);
  }
};

export const getLastSessionPath = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(LAST_SESSION_PATH_KEY);
  } catch (error) {
    console.error('Failed to get last session path:', error);
    return null;
  }
};
