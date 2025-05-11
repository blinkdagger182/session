import React, { useEffect, useState } from 'react';
import type { Conversation } from '../stores/conversationStore';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConversationStore } from '../stores/conversationStore';
import ChatbotScreen from './ChatbotScreen';

/**
 * A dedicated screen to view and manage conversations
 */
const ConversationsScreen = () => {
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    createNewConversation,
    deleteConversation,
    getAllConversations,
  } = useConversationStore();

  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  
  // Get conversations sorted by date and type
  const regularConversations = getAllConversations('conversation');
  const questionConversations = getAllConversations('question');
  
  // Log conversation counts for debugging
  useEffect(() => {
    console.log('Regular conversations:', regularConversations.length);
    console.log('Question conversations:', questionConversations.length);
    console.log('All conversations:', Object.keys(conversations).length);
    
    // Create a sample conversation if none exist
    if (Object.keys(conversations).length === 0) {
      console.log('Creating sample conversation');
      const newId = createNewConversation('conversation');
      setActiveConversation(newId);
    }
  }, []);
  
  // Set the active conversation when a conversation is selected
  useEffect(() => {
    if (activeConversationId) {
      setSelectedConversation(activeConversationId);
    } else if (regularConversations.length > 0) {
      setActiveConversation(regularConversations[0].id);
      setSelectedConversation(regularConversations[0].id);
    }
  }, [activeConversationId, regularConversations]);

  const handleNewConversation = () => {
    const newId = createNewConversation('conversation');
    setActiveConversation(newId);
    setSelectedConversation(newId);
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={[
        styles.conversationItem,
        item.id === selectedConversation && styles.selectedConversation,
      ]}
      onPress={() => {
        setActiveConversation(item.id);
        setSelectedConversation(item.id);
      }}
    >
      <View style={styles.conversationInfo}>
        <Text style={styles.conversationTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.conversationDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteConversation(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#ff3b30" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <View style={styles.layout}>
        {/* Conversations Sidebar */}
        <View style={styles.sidebar}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>Conversations</Text>
            <TouchableOpacity
              style={styles.newButton}
              onPress={handleNewConversation}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {/* Debug Info */}
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>
              Total: {Object.keys(conversations).length}
            </Text>
            <Text style={styles.debugText}>
              Regular: {regularConversations.length}
            </Text>
            <Text style={styles.debugText}>
              Questions: {questionConversations.length}
            </Text>
          </View>
          
          {/* Regular Conversations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chats</Text>
            <FlatList
              data={regularConversations}
              renderItem={renderConversationItem}
              keyExtractor={(item) => item.id}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No conversations yet</Text>
              }
            />
          </View>
          
          {/* Question Conversations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Questions</Text>
            <FlatList
              data={questionConversations}
              renderItem={renderConversationItem}
              keyExtractor={(item) => item.id}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No questions yet</Text>
              }
            />
          </View>
        </View>
        
        {/* Chat Area */}
        <View style={styles.chatArea}>
          {selectedConversation ? (
            <ChatbotScreen />
          ) : (
            <View style={styles.emptyChatArea}>
              <Text style={styles.emptyChatText}>
                Select a conversation or create a new one
              </Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleNewConversation}
              >
                <Text style={styles.createButtonText}>New Conversation</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  layout: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 300,
    backgroundColor: '#1a1a1a',
    borderRightWidth: 1,
    borderRightColor: '#333',
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  newButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugInfo: {
    padding: 10,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  debugText: {
    fontSize: 12,
    color: '#3498db',
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  list: {
    maxHeight: 300,
  },
  listContent: {
    paddingBottom: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  selectedConversation: {
    backgroundColor: '#2a2a2a',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  conversationDate: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    padding: 5,
  },
  emptyText: {
    padding: 15,
    color: '#777',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  chatArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  emptyChatArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChatText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default ConversationsScreen;
