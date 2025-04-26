import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput as RNTextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Mock implementation of useChatGpt hook for demonstration purposes
import { useSessionStore } from '@/store/sessionStore';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// Message component for chat bubbles
const Message = ({ content, isUser }: { content: string; isUser: boolean }) => (
  <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble]}>
    <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>
      {content}
    </Text>
  </View>
);

// Typing indicator for streaming responses
const TypingIndicator = () => (
  <View style={styles.typingIndicator}>
    <View style={styles.dot} />
    <View style={[styles.dot, { marginHorizontal: 4 }]} />
    <View style={styles.dot} />
  </View>
);

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
}

const ChatbotScreen = () => {
  const { highlightContext, setHighlightContext } = useSessionStore();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Mock implementation of the ChatGPT hook
  const sendMessage = async ({ message, onAccumulatedResponse }: { message: string, onAccumulatedResponse: (text: string) => void }) => {
    // Simulate a streaming response
    const responses = [
      "I'm analyzing your code...",
      "I'm analyzing your code... Looking at the structure.",
      "I'm analyzing your code... Looking at the structure. This appears to be a React component.",
      "I'm analyzing your code... Looking at the structure. This appears to be a React component that handles state management.",
      "I'm analyzing your code... Looking at the structure. This appears to be a React component that handles state management and UI rendering.",
      "Based on my analysis, this code is implementing a React component with state management using hooks. It's rendering a UI with conditional logic based on the current state. The component follows React best practices for state updates and side effects."
    ];
    
    // Simulate streaming with delays
    for (const response of responses) {
      await new Promise(resolve => setTimeout(resolve, 500));
      onAccumulatedResponse(response);
    }
    
    return responses[responses.length - 1];
  };

  // Set initial message based on highlight context
  useEffect(() => {
    if (highlightContext && messages.length === 0) {
      setInput(
        `Help me understand this code:\n\n${highlightContext}`
      );
    }
  }, [highlightContext, messages.length]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isTyping]);

  // Handle sending a message
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: input,
      isUser: true,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    
    // Provide haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      // Clear highlight context after first message
      if (highlightContext) {
        setHighlightContext('');
      }
      
      // Get streaming response
      let responseContent = '';
      setIsLoading(true);
      
      await sendMessage({
        message: input,
        onAccumulatedResponse: (accumulatedResponse) => {
          // Convert the response to string if needed
          responseContent = typeof accumulatedResponse === 'string' 
            ? accumulatedResponse 
            : JSON.stringify(accumulatedResponse);
            
          // Update the bot's message in real-time as it streams in
          setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (!lastMessage.isUser) {
              // Update the existing bot message
              return prev.map(msg => 
                msg.id === lastMessage.id 
                  ? { ...msg, content: responseContent } 
                  : msg
              );
            } else {
              // Add a new bot message
              return [
                ...prev, 
                { 
                  id: 'bot-' + Date.now().toString(), 
                  content: responseContent, 
                  isUser: false 
                }
              ];
            }
          });
        },
      });
      
      setIsLoading(false);
      setIsTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          id: 'error-' + Date.now().toString(),
          content: 'Sorry, there was an error processing your request. Please try again.',
          isUser: false,
        },
      ]);
      
      setIsLoading(false);
      setIsTyping(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Clear chat history
  const handleClearChat = () => {
    setMessages([]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Chat header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Session</Text>
          <Text style={styles.headerSubtitle}>AI Copilot</Text>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity onPress={handleClearChat} style={styles.clearButton}>
            <Ionicons name="trash-outline" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Chat messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyChat}>
            <Ionicons name="chatbubble-ellipses-outline" size={60} color="#555" />
            <Text style={styles.emptyChatText}>
              Ask Copilot about your code or development questions
            </Text>
          </View>
        ) : (
          messages.map(message => (
            <Animated.View 
              key={message.id}
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
            >
              <Message content={message.content} isUser={message.isUser} />
            </Animated.View>
          ))
        )}
        
        {isTyping && (
          <Animated.View entering={FadeIn.duration(300)}>
            <View style={[styles.messageBubble, styles.botBubble]}>
              <TypingIndicator />
            </View>
          </Animated.View>
        )}
      </ScrollView>
      
      {/* Input area */}
      <View style={styles.inputContainer}>
        <RNTextInput
          style={[styles.input, { maxHeight: 100 }]}
          value={input}
          onChangeText={setInput}
          placeholder="Ask Copilot a question..."
          placeholderTextColor="#777"
          multiline
        />
        <TouchableOpacity 
          style={[
            styles.sendButton,
            (!input.trim() || isLoading) && styles.disabledButton
          ]}
          onPress={handleSend}
          disabled={!input.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    height: 80,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    color: '#999',
    fontSize: 14,
    marginTop: 4,
  },
  clearButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    marginBottom: 12,
  },
  userBubble: {
    backgroundColor: '#0b93f6',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#333',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  botText: {
    color: '#f1f1f1',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  input: {
    flex: 1,
    backgroundColor: '#222',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    paddingRight: 40,
    color: '#fff',
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#0b93f6',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#333',
    opacity: 0.7,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyChatText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
    paddingHorizontal: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#aaa',
    opacity: 0.8,
  },
});

export default ChatbotScreen;
