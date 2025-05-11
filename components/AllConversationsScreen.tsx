import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConversationStore } from '../stores/conversationStore';
import { createSampleConversations } from '../stores/conversationStore';

/**
 * A simple standalone screen to view all conversations
 */
const AllConversationsScreen = () => {
  const {
    conversations,
    deleteConversation,
    getAllConversations,
  } = useConversationStore();

  // Get conversations sorted by date and type
  const regularConversations = getAllConversations('conversation');
  const questionConversations = getAllConversations('question');
  
  // Create sample conversations if none exist
  useEffect(() => {
    if (Object.keys(conversations).length === 0) {
      const { conversationId, questionId } = createSampleConversations();
      Alert.alert(
        'Sample Conversations Created',
        `Created regular conversation ID: ${conversationId.substring(0, 8)}...\nCreated question ID: ${questionId.substring(0, 8)}...`
      );
    }
  }, []);

  const renderConversationItem = ({ item }) => (
    <View style={styles.conversationItem}>
      <View style={styles.conversationInfo}>
        <Text style={styles.conversationTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.conversationDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        <Text style={styles.messageCount}>
          Messages: {item.messages.length}
        </Text>
        {item.type === 'question' && item.context && (
          <Text style={styles.context} numberOfLines={2}>
            Context: {item.context}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteConversation(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#ff3b30" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <View style={styles.header}>
        <Text style={styles.title}>All Conversations</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => {
            const { conversationId } = createSampleConversations();
            Alert.alert('New Conversation Created', `ID: ${conversationId.substring(0, 8)}...`);
          }}
        >
          <Ionicons name="add-circle" size={24} color="#3498db" />
          <Text style={styles.createButtonText}>Create Sample</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.debugInfo}>
        <Text style={styles.debugText}>
          Total Conversations: {Object.keys(conversations).length}
        </Text>
        <Text style={styles.debugText}>
          Regular Conversations: {regularConversations.length}
        </Text>
        <Text style={styles.debugText}>
          Questions: {questionConversations.length}
        </Text>
      </View>
      
      {/* Regular Conversations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Regular Conversations</Text>
        <FlatList
          data={regularConversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No conversations yet</Text>
          }
        />
      </View>
      
      {/* Question Conversations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Questions from Markdown</Text>
        <FlatList
          data={questionConversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No questions yet</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#3498db',
    marginLeft: 8,
    fontWeight: '500',
  },
  debugInfo: {
    backgroundColor: '#1a1a1a',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  debugText: {
    color: '#3498db',
    fontSize: 14,
    marginBottom: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e1e1e1',
    marginBottom: 10,
  },
  list: {
    maxHeight: 300,
  },
  conversationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 15,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginBottom: 10,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  conversationDate: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  messageCount: {
    fontSize: 14,
    color: '#3498db',
    marginBottom: 4,
  },
  context: {
    fontSize: 14,
    color: '#e1e1e1',
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 5,
    marginLeft: 10,
  },
  emptyText: {
    padding: 15,
    color: '#777',
    fontStyle: 'italic',
    textAlign: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
});

export default AllConversationsScreen;
