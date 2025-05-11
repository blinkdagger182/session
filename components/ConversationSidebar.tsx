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
  
  // Force a re-render when the component mounts to ensure conversations are loaded
  const [, forceUpdate] = React.useState({});

  // Get conversations sorted by date and type
  const regularConversations = getAllConversations('conversation'); 
  const questionConversations = getAllConversations('question');
  
  // Debug: Log conversation counts to see if they're being retrieved
  console.log('Regular conversations:', regularConversations.length);
  console.log('Question conversations:', questionConversations.length);
  console.log('All conversations:', Object.keys(conversations).length);
  
  // Force a new conversation if none exist and set up a re-render interval
  React.useEffect(() => {
    // Create a conversation if none exist
    if (Object.keys(conversations).length === 0) {
      console.log('No conversations found, creating a new one');
      createNewConversation('conversation');
    }
    
    // Force a re-render to ensure conversations are displayed
    const timer = setTimeout(() => {
      forceUpdate({});
      console.log('Forced re-render of ConversationSidebar');
      console.log('Conversations after re-render:', Object.keys(conversations).length);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

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
      {/* Debug info */}
      <View style={styles.debugInfo}>
        <Text style={styles.debugText}>Total conversations: {Object.keys(conversations).length}</Text>
        <Text style={styles.debugText}>Regular: {getAllConversations('conversation').length}</Text>
        <Text style={styles.debugText}>Questions: {getAllConversations('question').length}</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.newChatButton} 
        onPress={() => {
          const newId = createNewConversation('conversation');
          console.log('Created new conversation with ID:', newId);
          // Force update to ensure the new conversation appears
          setTimeout(() => forceUpdate({}), 100);
        }}
      >
        <Ionicons name="add-circle-outline" size={20} color="#007AFF" style={{ marginRight: 8 }}/>
        <Text style={styles.newChatButtonText}>New Chat</Text>
      </TouchableOpacity>
      
      <View style={styles.listsContainer}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Match the dark theme
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#333',
    paddingTop: 10,
  },
  debugInfo: {
    backgroundColor: '#2a2a2a',
    padding: 8,
    margin: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3498db',
  },
  debugText: {
    color: '#3498db',
    fontSize: 12,
  },
  listsContainer: {
    flex: 1, // Take remaining space
    display: 'flex',
    flexDirection: 'column',
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginHorizontal: 10,
    marginBottom: 10,
  },
  newChatButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3498db',
  },
  sectionHeader: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e1e1e1',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  list: {
    flex: 1, // Use flex instead of fixed height to allow scrolling
    minHeight: 100, // Ensure minimum height
  },
  emptyListText: {
    padding: 15,
    color: '#777',
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
    borderBottomColor: '#333',
  },
  activeItemContainer: {
    backgroundColor: '#2a2a2a',
  },
  itemText: {
    fontSize: 14,
    color: '#e1e1e1',
    flex: 1, // Allow text to take available space before delete btn
    marginRight: 8,
  },
  activeItemText: {
    fontWeight: '600',
    color: '#fff',
  },
  deleteButton: {
     padding: 5, // Make it easier to tap
  },
});

export default ConversationSidebar;
