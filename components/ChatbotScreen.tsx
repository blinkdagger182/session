import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import OpenAI from 'openai';
import Markdown from 'react-native-markdown-display'; // Import Markdown
import { useConversationStore, Message } from '../stores/conversationStore';

const PRELOADED_API_KEY = process.env.EXPO_PUBLIC_OPEN_AI_API_KEY;

let openai: OpenAI | null = null;
if (PRELOADED_API_KEY) {
  openai = new OpenAI({
    apiKey: PRELOADED_API_KEY,
    dangerouslyAllowBrowser: true,
  });
  console.log('OpenAI Client Initialized');
} else {
  console.error('PRELOADED_API_KEY is missing!');
  Alert.alert('Error', 'API Key is missing in the code.');
}

const ChatbotScreen = () => {
  const { 
    activeConversationId, 
    addMessageToConversation, 
    getConversationById 
  } = useConversationStore();

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList<Message>>(null); // Correct ref type for FlatList

  const currentConversation = activeConversationId ? getConversationById(activeConversationId) : null;
  const messages = currentConversation ? currentConversation.messages : [];

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!activeConversationId) {
      console.error("Cannot send message, no active conversation selected.");
      return; 
    }

    const userMessageContent = inputText.trim();
    if (!userMessageContent || isLoading || !openai) return;

    addMessageToConversation(activeConversationId, { role: 'user', content: userMessageContent });

    setInputText('');
    setIsLoading(true);

    try {
      const currentMessagesForApi = useConversationStore.getState().getConversationById(activeConversationId)?.messages ?? [];
      const apiMessages = currentMessagesForApi.map(({ role, content }) => ({ role, content }));

      const completion = await openai.chat.completions.create({
        messages: apiMessages,
        model: 'gpt-4o-mini',
      });

      const assistantMessageContent = completion.choices[0]?.message?.content?.trim();

      if (assistantMessageContent) {
        addMessageToConversation(activeConversationId, { role: 'assistant', content: assistantMessageContent });
      } else {
        console.error('No content received from OpenAI');
        addMessageToConversation(activeConversationId, { role: 'system', content: 'Error: Could not get response from AI.' });
      }
    } catch (error) {
      console.error('Error sending message to OpenAI:', error);
      addMessageToConversation(activeConversationId, { role: 'system', content: 'Error connecting to AI. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    // Skip rendering system messages visually in the chat list
    if (item.role === 'system') {
      return null;
    }

    const bubbleStyle =
      item.role === 'user' ? styles.userMessageBubble :
      item.role === 'assistant' ? styles.assistantMessageBubble :
      null; // Fallback/error style if needed, though system is filtered

    const textStyle =
      item.role === 'user' ? styles.userMessageText :
      item.role === 'assistant' ? styles.assistantMessageText :
      null; // Fallback/error style if needed

    // Return null if styles are somehow not determined (shouldn't happen with the filter)
    if (!bubbleStyle || !textStyle) {
      return null;
    }

    return (
      <View style={[styles.messageBubble, bubbleStyle]}>
        {item.role === 'assistant' ? (
          // Apply base text style to Markdown body
          <Markdown style={{ body: textStyle }}>{item.content}</Markdown>
        ) : ( // User messages are plain text
          <Text style={textStyle}>{item.content}</Text>
        )}
        {/* Optionally add timestamp or other info here */} 
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      {/* Use FlatList for optimized message rendering */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage} // Use the renderMessage function defined below
        keyExtractor={(item) => item.id} // Use unique message ID as key
        style={styles.chatContainer} // Reuse chatContainer style for FlatList
        contentContainerStyle={styles.listContentContainer} // For padding etc.
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />
      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message..."
          editable={!isLoading}
        />
        <Button
          title="Send"
          onPress={sendMessage}
          disabled={isLoading || !inputText.trim()}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0', // Slightly different background
  },
  chatContainer: {
    flex: 1, // Takes up available space above input
  },
  listContentContainer: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 15,
    marginBottom: 10,
    maxWidth: '80%',
  },
  userMessageBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  assistantMessageBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
  },
  systemMessageBubble: {
    alignSelf: 'center',
    backgroundColor: '#cccccc',
    fontStyle: 'italic',
    paddingVertical: 5,
  },
  userMessageText: {
    color: '#fff',
  },
  assistantMessageText: {
    color: '#000',
  },
  systemMessageText: {
    color: '#333',
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ccc',
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    fontSize: 16,
    maxHeight: 100,
  },
});

export default ChatbotScreen;
