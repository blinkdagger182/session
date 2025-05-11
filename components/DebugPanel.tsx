import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { createSampleConversations } from '../stores/conversationStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Debug panel component for testing conversation functionality
 * This component provides buttons to create sample conversations and clear AsyncStorage
 */
const DebugPanel = () => {
  // Create sample conversations for testing
  const handleCreateSamples = () => {
    try {
      const { conversationId, questionId } = createSampleConversations();
      Alert.alert(
        'Sample Conversations Created',
        `Created regular conversation ID: ${conversationId.substring(0, 8)}...\nCreated question ID: ${questionId.substring(0, 8)}...`
      );
    } catch (error) {
      console.error('Error creating sample conversations:', error);
      Alert.alert('Error', 'Failed to create sample conversations');
    }
  };

  // Clear AsyncStorage for testing
  const handleClearStorage = async () => {
    try {
      await AsyncStorage.clear();
      Alert.alert(
        'Storage Cleared',
        'AsyncStorage has been cleared. Please restart the app to see changes.'
      );
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
      Alert.alert('Error', 'Failed to clear AsyncStorage');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug Tools</Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleCreateSamples}
      >
        <Text style={styles.buttonText}>Create Sample Conversations</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.dangerButton]} 
        onPress={handleClearStorage}
      >
        <Text style={styles.buttonText}>Clear Storage</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    margin: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e1e1e1',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 5,
  },
  dangerButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default DebugPanel;
