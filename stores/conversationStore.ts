import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values'; // Required for uuid
import { v4 as uuidv4 } from 'uuid';

// Define the structure for a single message
export interface Message {
  id: string; // Make ID mandatory
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Define the structure for a single conversation
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number; // Timestamp for sorting
  type: 'conversation' | 'question'; // Type to distinguish regular chats from markdown questions
  context?: string; // Optional context (e.g., selected text for questions)
}

// Define the structure of the store's state
interface ConversationState {
  conversations: Record<string, Conversation>; // Store conversations as an object with ID keys
  activeConversationId: string | null;
  // --- Actions --- 
  createNewConversation: (type?: 'conversation' | 'question') => string; // Returns the ID of the new conversation
  createNewQuestionConversation: (selectedText: string) => string; // Create a question conversation with context
  setActiveConversation: (id: string | null) => void;
  addMessageToConversation: (conversationId: string | null, messageContent: Omit<Message, 'id'>) => void;
  getConversationById: (id: string) => Conversation | undefined;
  getAllConversations: (type?: 'conversation' | 'question') => Conversation[]; // Filter by type
  deleteConversation: (id: string) => void;
  updateConversationTitle: (id: string, title: string) => void;
}

// Create the Zustand store with persistence
export const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => ({
      conversations: {},
      activeConversationId: null,

      // Action: Create a new conversation
      createNewConversation: (type = 'conversation') => {
        const newId = uuidv4();
        const newConversation: Conversation = {
          id: newId,
          title: type === 'conversation' ? 'New Chat' : 'New Question',
          messages: [],
          createdAt: Date.now(),
          type, // Set the conversation type
        };
        set((state) => ({
          conversations: { ...state.conversations, [newId]: newConversation },
          activeConversationId: newId, // Automatically activate the new chat
        }));
        return newId;
      },
      
      // Action: Create a new question conversation with selected text context
      createNewQuestionConversation: (selectedText) => {
        const newId = uuidv4();
        const truncatedText = selectedText.length > 50 
          ? `${selectedText.substring(0, 50)}...` 
          : selectedText;
        
        const newConversation: Conversation = {
          id: newId,
          title: `Question: ${truncatedText}`,
          messages: [],
          createdAt: Date.now(),
          type: 'question',
          context: selectedText, // Store the full selected text as context
        };
        
        set((state) => ({
          conversations: { ...state.conversations, [newId]: newConversation },
          // Don't set as active conversation since we're in the markdown viewer
        }));
        
        return newId;
      },

      // Action: Set the currently active conversation
      setActiveConversation: (id) => {
        set({ activeConversationId: id });
      },

      // Action: Add a message to a specific conversation (generating ID)
      addMessageToConversation: (conversationId, messageContent) => {
        set((state) => {
          // Ensure we have an active conversation ID
          const targetConversationId = conversationId ?? state.activeConversationId;
          if (!targetConversationId) {
            console.error('Cannot add message, no active conversation ID');
            return {}; // Or handle error appropriately
          }

          const conversation = state.conversations[targetConversationId];
          if (!conversation) return {}; // Or handle error

          // Create the full message object with a unique ID
          const newMessage: Message = {
            id: uuidv4(), // Generate unique ID here
            role: messageContent.role,
            content: messageContent.content,
          };

          // Simple title update: Use first user message as title if it's 'New Chat'
          let newTitle = conversation.title;
          if (
            conversation.title === 'New Chat' &&
            newMessage.role === 'user' &&
            newMessage.content.trim().length > 0
          ) {
            newTitle = newMessage.content.substring(0, 30); // Use first 30 chars
          }

          return {
            conversations: {
              ...state.conversations,
              [targetConversationId]: {
                ...conversation,
                title: newTitle,
                messages: [...conversation.messages, newMessage], // Add the full message object
              },
            },
          };
        });
      },

      // Helper: Get a specific conversation by its ID
      getConversationById: (id) => get().conversations[id],

      // Helper: Get all conversations sorted by creation date (newest first)
      // Optionally filter by type (conversation or question)
      getAllConversations: (type) => {
        const allConversations = Object.values(get().conversations);
        
        // Filter by type if specified
        const filteredConversations = type 
          ? allConversations.filter(conv => conv.type === type)
          : allConversations;
          
        // Sort by creation date (newest first)
        return filteredConversations.sort(
          (a, b) => b.createdAt - a.createdAt
        );
      },

      // Action: Delete a conversation
      deleteConversation: (id) => {
        set((state) => {
          const newConversations = { ...state.conversations };
          delete newConversations[id];

          // If the deleted conversation was active, clear the active ID
          const newActiveId = state.activeConversationId === id ? null : state.activeConversationId;

          // If activeId becomes null, try setting it to the most recent remaining chat
          let finalActiveId = newActiveId;
          if (finalActiveId === null) {
            const remainingConversations = Object.values(newConversations).sort(
              (a, b) => b.createdAt - a.createdAt
            );
            if (remainingConversations.length > 0) {
              finalActiveId = remainingConversations[0].id;
            }
          }

          return {
            conversations: newConversations,
            activeConversationId: finalActiveId,
          };
        });
      },
      
      // Action: Update conversation title (manual override if needed)
      updateConversationTitle: (id, title) => {
         set((state) => {
           const conversation = state.conversations[id];
           if (!conversation) return {};
           return {
             conversations: {
               ...state.conversations,
               [id]: { ...conversation, title },
             },
           };
         });
      },
    }),
    {
      name: 'conversation-storage', // Unique name for storage
      storage: createJSONStorage(() => AsyncStorage), // Use AsyncStorage for persistence
    }
  )
);

// Initialize: Ensure there's at least one conversation when the app loads
const initialState = useConversationStore.getState();
if (Object.keys(initialState.conversations).length === 0) {
  initialState.createNewConversation('conversation');
} else {
  // Update any existing conversations to include the type field if missing
  const updatedConversations = { ...initialState.conversations };
  let needsUpdate = false;
  
  Object.keys(updatedConversations).forEach(id => {
    if (!updatedConversations[id].type) {
      updatedConversations[id].type = 'conversation';
      needsUpdate = true;
    }
  });
  
  if (needsUpdate) {
    useConversationStore.setState({ conversations: updatedConversations });
  }
  
  // If active ID is invalid or null, set it to the most recent conversation (not question)
  if (initialState.activeConversationId === null || !initialState.conversations[initialState.activeConversationId]) {
    const sortedConversations = initialState.getAllConversations('conversation');
    if (sortedConversations.length > 0) {
      initialState.setActiveConversation(sortedConversations[0].id);
    }
  }
}
