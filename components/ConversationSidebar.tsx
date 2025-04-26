import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useConversationStore } from '../stores/conversationStore';
import { Ionicons } from '@expo/vector-icons'; // Assuming you use Expo vector icons

const ConversationSidebar = () => {
  const {
    conversations, // Direct access to the object
    activeConversationId,
    setActiveConversation,
    createNewConversation,
    deleteConversation,
    getAllConversations, // Use the selector to get sorted array
  } = useConversationStore();

  // Get conversations sorted by date and type
  const regularConversations = getAllConversations('conversation'); 
  const questionConversations = getAllConversations('question');

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      'Delete Conversation',
      `Are you sure you want to delete "${title}"? This cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: () => deleteConversation(id),
          style: 'destructive',
        },
      ]
    );
  };

  const renderConversationItem = ({ item }: { item: { id: string; title: string } }) => (
    <TouchableOpacity
      style={[
        styles.itemContainer,
        item.id === activeConversationId && styles.activeItemContainer, // Highlight active item
      ]}
      onPress={() => setActiveConversation(item.id)}
    >
      <Text
        style={[
          styles.itemText,
          item.id === activeConversationId && styles.activeItemText,
        ]}
        numberOfLines={1} // Prevent long titles from wrapping excessively
      >
        {item.title}
      </Text>
      <TouchableOpacity 
        onPress={() => handleDelete(item.id, item.title)} 
        style={styles.deleteButton}
      >
        <Ionicons name="trash-outline" size={18} color="#ff3b30" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.newChatButton} 
        onPress={() => createNewConversation('conversation')}
      >
        <Ionicons name="add-circle-outline" size={20} color="#007AFF" style={{ marginRight: 8 }}/>
        <Text style={styles.newChatButtonText}>New Chat</Text>
      </TouchableOpacity>
      
      {/* Regular conversations section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>Conversations</Text>
      </View>
      <FlatList
        data={regularConversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyListText}>No conversations yet</Text>
        }
      />
      
      {/* Questions section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>Questions</Text>
        <Text style={styles.sectionSubtitle}>From markdown selection</Text>
      </View>
      <FlatList
        data={questionConversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyListText}>No questions yet</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#ccc',
    paddingTop: 10, // Add some padding at the top
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9e9eb',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginHorizontal: 10,
    marginBottom: 10,
  },
  newChatButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  sectionHeader: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#e9e9eb',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  list: {
    maxHeight: 300, // Limit height so both sections can be seen
  },
  emptyListText: {
    padding: 15,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  activeItemContainer: {
    backgroundColor: '#e0e0e0',
  },
  itemText: {
    fontSize: 14,
    color: '#333',
    flex: 1, // Allow text to take available space before delete btn
    marginRight: 8,
  },
  activeItemText: {
    fontWeight: '600',
    color: '#000',
  },
  deleteButton: {
     padding: 5, // Make it easier to tap
  },
});

export default ConversationSidebar;
