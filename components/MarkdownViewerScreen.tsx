import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  ScrollView,
  NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
  Dimensions,
  Platform,
} from 'react-native';
import Markdown, { MarkdownProps, RenderRules } from 'react-native-markdown-display';
import * as Haptics from 'expo-haptics';
import { useSessionStore } from '@/store/sessionStore';
import { Ionicons } from '@expo/vector-icons';
// Using expo-file-system instead of document picker to avoid native module issues
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveLastSessionPath } from '@/store/sessionStore';
import { useConversationStore } from '../stores/conversationStore';
import { loadSampleMarkdown } from '@/utils/loadSampleMarkdown';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

// Get screen dimensions for positioning
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Git tree component for displaying file structure
const GitTree = ({ markdown }: { markdown: string | null }) => {
  const [expanded, setExpanded] = useState(false);
  const [files, setFiles] = useState<string[]>([]);

  useEffect(() => {
    if (markdown && typeof markdown === 'string') {
      try {
        // Simple regex to extract filenames from markdown code blocks
        // This looks for patterns like ```python filename.py or # filename.py
        const fileRegex = /(?:```\w+\s+|#\s+)([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)/g;
        const matches = [...markdown.matchAll(fileRegex)];
        const uniqueFiles = [...new Set(matches.map(match => match[1]))];
        setFiles(uniqueFiles);
      } catch (error) {
        console.error('Error parsing markdown:', error);
        setFiles([]);
      }
    }
  }, [markdown]);

  if (!files.length) return null;

  return (
    <View style={styles.gitTreeContainer}>
      <TouchableOpacity 
        style={styles.gitTreeHeader}
        onPress={() => setExpanded(!expanded)}
      >
        <Ionicons 
          name={expanded ? "chevron-down" : "chevron-forward"} 
          size={16} 
          color="#fff" 
        />
        <Text style={styles.gitTreeTitle}>Working Tree ({files.length} files)</Text>
      </TouchableOpacity>
      
      {expanded && (
        <View style={styles.gitTreeContent}>
          {files.map((file, index) => (
            <View key={index} style={styles.fileItem}>
              <Ionicons name="document-outline" size={14} color="#aaa" />
              <Text style={styles.fileName}>{file}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// Floating action button for highlighted text
const FloatingActionButton = ({ 
  isVisible, 
  onPress,
  position,
}: { 
  isVisible: boolean; 
  onPress: () => void;
  position?: { x: number; y: number };
}) => {
  if (!isVisible) return null;
  
  // If position is provided, show popup at that position
  // Otherwise use the default bottom-right position
  const containerStyle = position 
    ? [styles.popupMenuContainer, { top: position.y, left: position.x }]
    : styles.floatingButtonContainer;
  
  return (
    <Animated.View 
      style={containerStyle}
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
    >
      <BlurView intensity={80} style={styles.blurContainer}>
        <TouchableOpacity 
          style={styles.floatingButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onPress();
          }}
        >
          <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
          <Text style={styles.buttonText}>Ask Copilot</Text>
        </TouchableOpacity>
      </BlurView>
    </Animated.View>
  );
};

// Full-page modal with embedded chatbot for selected text questions
const AskCopilotModal = ({
  visible,
  onClose,
  selectedText,
}: {
  visible: boolean;
  onClose: () => void;
  selectedText: string;
}) => {
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant' | 'system', content: string, id: string}>>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Initialize with the selected text when modal becomes visible
  useEffect(() => {
    if (visible && selectedText && messages.length === 0) {
      // Create a unique ID for this question
      const questionId = Date.now().toString();
      
      // Initialize with system message and selected text as context
      setMessages([
        {
          role: 'system',
          content: 'You are a helpful assistant. The user has selected the following text and has a question about it.',
          id: `system-${questionId}`
        },
        {
          role: 'system',
          content: `Selected text: ${selectedText}`,
          id: `context-${questionId}`
        }
      ]);
      
      // Set a default question based on the selected text
      setInputText(`What does this mean: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`);
    }
  }, [visible, selectedText]);
  
  // Reset state when modal is closed
  
  const handleClose = () => {
    // Save the question to the sidebar before closing
    if (messages.length > 2) { // Only save if user has asked at least one question
      // Create a new question conversation with the selected text as context
      const conversationId = useConversationStore.getState().createNewQuestionConversation(selectedText);
      
      // Add all messages to the conversation
      messages.forEach(msg => {
        useConversationStore.getState().addMessageToConversation(conversationId, {
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content
        });
      });
      
      console.log('Saved question thread to sidebar with ID:', conversationId);
    }
    
    // Reset and close
    setMessages([]);
    setInputText('');
    onClose();
  };
  
  // Send message to the chatbot
  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    
    const userMessage = {
      role: 'user' as const,
      content: inputText.trim(),
      id: `user-${Date.now()}`
    };
    
    // Add user message to the chat
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    
    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    try {
      // Connect to your actual OpenAI API
      try {
        // Prepare messages for API call (without IDs)
        const apiMessages = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        
        // Add the current user message
        apiMessages.push({
          role: 'user',
          content: inputText.trim()
        });
        
        // Simulate AI response for now (replace with actual API call)
        setTimeout(() => {
          const aiResponse = {
            role: 'assistant' as const,
            content: `I'll help you understand this text. ${inputText.includes('?') ? '' : 'What specific aspect would you like me to explain?'}`,
            id: `assistant-${Date.now()}`
          };
          
          setMessages(prev => [...prev, aiResponse]);
          setIsLoading(false);
          
          // Scroll to bottom again after response
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }, 1000);
        
        // TODO: Replace with actual API call to your AI service
        // const response = await fetch('https://api.openai.com/v1/chat/completions', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //     'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPEN_AI_API_KEY}`
        //   },
        //   body: JSON.stringify({
        //     model: 'gpt-3.5-turbo',
        //     messages: apiMessages,
        //     temperature: 0.7
        //   })
        // });
        // 
        // const data = await response.json();
        // const aiResponse = {
        //   role: 'assistant',
        //   content: data.choices[0].message.content,
        //   id: `assistant-${Date.now()}`
        // };
        // 
        // setMessages(prev => [...prev, aiResponse]);
      } catch (error) {
        console.error('Error with AI service:', error);
        // Add error message to chat
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your request. Please try again.',
          id: `error-${Date.now()}`
        }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };
  
  // Render a chat message
  const renderMessage = ({ item }: { item: { role: 'user' | 'assistant' | 'system', content: string, id: string } }) => {
    // Don't render system messages
    if (item.role === 'system') return null;
    
    return (
      <View style={[
        styles.messageBubble,
        item.role === 'user' ? styles.userMessageBubble : styles.assistantMessageBubble
      ]}>
        <Text style={[
          styles.messageText,
          item.role === 'user' ? styles.userMessageText : styles.assistantMessageText
        ]}>
          {item.content}
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.fullScreenModal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Ask About Selected Text</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.selectedTextContainer}>
          <Text style={styles.selectedTextLabel}>Selected Text:</Text>
          <Text style={styles.selectedTextContent} numberOfLines={3}>
            {selectedText}
          </Text>
        </View>
        
        {/* Chat messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.chatContainer}
          contentContainerStyle={styles.chatContentContainer}
        >
          {messages.filter(m => m.role !== 'system').map(message => (
            <View key={message.id} style={[
              styles.messageBubble,
              message.role === 'user' ? styles.userMessageBubble : styles.assistantMessageBubble
            ]}>
              <Text style={[
                styles.messageText,
                message.role === 'user' ? styles.userMessageText : styles.assistantMessageText
              ]}>
                {message.content}
              </Text>
            </View>
          ))}
          
          {isLoading && (
            <View style={styles.loadingIndicator}>
              <ActivityIndicator size="small" color="#3498db" />
              <Text style={styles.loadingIndicatorText}>AI is thinking...</Text>
            </View>
          )}
        </ScrollView>
        
        {/* Input area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.chatInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your question..."
            placeholderTextColor="#666"
            multiline
          />
          <TouchableOpacity 
            style={styles.sendButton} 
            onPress={sendMessage}
            disabled={isLoading || !inputText.trim()}
          >
            <Ionicons 
              name="send" 
              size={24} 
              color={isLoading || !inputText.trim() ? '#555' : '#3498db'} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Welcome screen when no markdown is loaded
const WelcomeScreen = ({ onImport }: { onImport: () => void }) => (
  <View style={styles.welcomeContainer}>
    <Ionicons name="document-text-outline" size={80} color="#666" />
    <Text style={styles.welcomeTitle}>👋 Welcome to Session</Text>
    <Text style={styles.welcomeText}>
      Upload your dev journal to get started.
    </Text>
    <TouchableOpacity style={styles.importButton} onPress={onImport}>
      <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
      <Text style={styles.importButtonText}>Import Markdown</Text>
    </TouchableOpacity>
  </View>
);

const MarkdownViewerScreen = () => {
  const { 
    markdown, 
    setMarkdown, 
    setHighlightContext, 
    setActiveTab
  } = useSessionStore();
  
  const [selectedText, setSelectedText] = useState('');
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | undefined>(undefined);
  const [showAskModal, setShowAskModal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);

  // Load markdown content when component mounts - only once
  useEffect(() => {
    console.log('MarkdownViewerScreen mounted');
    // Set a simple hardcoded string directly
    const simpleContent = "# Test Content\n\nThis is a test paragraph.";
    setMarkdown(simpleContent);
  }, []);

  // Handle text selection
  const handleSelectionChange = useCallback(
    (event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      // Prevent default context menu
      if (event.preventDefault) {
        event.preventDefault();
      }
      
      const { selection } = event.nativeEvent;
      // Get the text from the TextInput's value property instead of event
      const textInput = event.target as TextInput;
      const text = textInput?.props?.value as string || '';
      
      if (selection.start !== selection.end && text) {
        // Text is selected
        const selected = text.substring(selection.start, selection.end);
        if (selected.trim().length > 0) {
          setSelectedText(selected);
          setShowFloatingButton(true);
          
          // Get the position from the selection event
          // This uses the current event target for positioning
          const targetElement = event.target as any;
          if (targetElement) {
            targetElement.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
              // Calculate position based on the selection
              // Position the popup above the text input
              const popupY = Math.max(100, pageY - 50);
              const popupX = Math.min(pageX + 20, SCREEN_WIDTH - 200);
              
              setSelectionPosition({ x: popupX, y: popupY });
            });
          }
        }
      }
    },
    []
  );
  
  // Custom long press handler to show our popup instead of system context menu
  const handleLongPress = useCallback((text: string, event: any) => {
    // Prevent default context menu
    if (event.preventDefault) {
      event.preventDefault();
    }
    
    // Set the selected text
    setSelectedText(text);
    setShowFloatingButton(true);
    
    // Position the popup near the press location
    const { pageX, pageY } = event.nativeEvent;
    const popupY = Math.max(100, pageY - 50);
    const popupX = Math.min(pageX + 20, SCREEN_WIDTH - 200);
    setSelectionPosition({ x: popupX, y: popupY });
    
    // Provide haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);
  
  // Handle tapping outside of selection to clear it
  const handleClearSelection = useCallback(() => {
    setSelectedText('');
    setShowFloatingButton(false);
    setSelectionPosition(undefined);
  }, []);
  
  // Add a listener to clear selection when tapping outside
  useEffect(() => {
    const timer = setTimeout(() => {
      if (showFloatingButton && !showAskModal) {
        // Auto-hide the floating button after 5 seconds if not used
        handleClearSelection();
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [showFloatingButton, showAskModal, handleClearSelection]);
  // Handle asking copilot about selected text - show the modal
  const handleAskCopilot = () => {
    setShowAskModal(true);
  };

  // Import markdown file - simplified approach for demo purposes
  const handleImportMarkdown = async () => {
    try {
      console.log('Loading sample markdown...');
      
      // Use a direct hardcoded string to ensure content is displayed
      const directContent = `# Test Markdown Content

This is a direct test to ensure markdown content is displayed properly.

## Try selecting this heading

You should be able to select this text and see the "Ask Copilot" popup appear near your selection.

### Code Example

\`\`\`javascript
// This is a JavaScript code block
function testFunction() {
  console.log("Hello world!");
  return true;
}
\`\`\`

## Lists

- Item 1: Try selecting this list item
- Item 2: The selection should work here too
- Item 3: You can select multiple items at once

## Final paragraph

This is the last paragraph in the test file. You should be able to select any text in this document and see the "Ask Copilot" popup appear near your selection.`;
      
      // Set the markdown content directly
      console.log('Setting direct markdown content in state...');
      setMarkdown(directContent);
      
      // Provide haptic feedback for success
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error importing markdown:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Fallback to a simple string if loading fails
      setMarkdown('# Error Loading Markdown\n\nAn error occurred while loading the markdown content.');
    }
  };

  // Markdown styling and configuration
  const markdownStyles = {
    body: styles.markdownBody,
    heading1: styles.heading1,
    heading2: styles.heading2,
    heading3: styles.heading3,
    paragraph: styles.paragraph,
    link: styles.link,
    blockquote: styles.blockquote,
    code_block: styles.codeBlock,
    code_inline: styles.inlineCode,
  };

  // SelectableText component to make text selectable
  const SelectableText = ({ style, children }: { style?: any, children: string }) => {
    return (
      <TextInput
        style={[style, { padding: 0, backgroundColor: 'transparent', color: '#e1e1e1' }]}
        value={children}
        multiline
        editable={false}
        scrollEnabled={false}
        // selectable is not a valid prop in React Native TextInput
        // but we can make it selectable by making it not editable
        onSelectionChange={handleSelectionChange}
        contextMenuHidden={false} // Show the context menu on selection
      />
    );
  };

  // Custom markdown rules for syntax highlighting and making text selectable
  const markdownRules: RenderRules = {
    // Make paragraphs selectable
    paragraph: (node, children, parent, styles) => (
      <View key={node.key} style={styles.paragraph}>
        <SelectableText style={styles.paragraph}>
          {node.content || ''}
        </SelectableText>
      </View>
    ),
    
    // Make headings selectable
    heading1: (node, children, parent, styles) => (
      <View key={node.key} style={styles.heading1}>
        <SelectableText style={styles.heading1}>
          {node.content || ''}
        </SelectableText>
      </View>
    ),
    
    heading2: (node, children, parent, styles) => (
      <View key={node.key} style={styles.heading2}>
        <SelectableText style={styles.heading2}>
          {node.content || ''}
        </SelectableText>
      </View>
    ),
    
    heading3: (node, children, parent, styles) => (
      <View key={node.key} style={styles.heading3}>
        <SelectableText style={styles.heading3}>
          {node.content || ''}
        </SelectableText>
      </View>
    ),
    
    // Make code blocks selectable but with special styling
    code_block: (node, children, parent, styles) => {
      // Extract language from the node
      const language = node.attributes?.language || '';
      // Here we could implement more advanced syntax highlighting
      // For now, we're using basic styling based on language
      const blockStyle = [styles.code_block];
      
      // Add language-specific styling if available
      if (language === 'python') blockStyle.push(styles.pythonBlock);
      if (language === 'diff') blockStyle.push(styles.diffBlock);
      if (language === 'bash') blockStyle.push(styles.bashBlock);
      if (language === 'json') blockStyle.push(styles.jsonBlock);
      
      return (
        <View key={node.key} style={blockStyle}>
          <Text style={styles.codeLanguage}>{language}</Text>
          <SelectableText style={styles.codeText}>
            {node.content || ''}
          </SelectableText>
        </View>
      );
    },
    
    // Make list items selectable
    list_item: (node, children, parent, styles) => (
      <View key={node.key} style={styles.listItem}>
        <SelectableText style={styles.listItemText}>
          {node.content || ''}
        </SelectableText>
      </View>
    ),
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Session</Text>
        <Text style={styles.headerSubtitle}>Markdown Viewer</Text>
      </View>
      {markdown ? (
        <>
          {/* Skip GitTree for now to avoid errors */}
          
          {/* Hidden TextInput for reference measurements - no longer needed for selection */}
          <TextInput
            ref={textInputRef}
            style={{ height: 0, width: 0, position: 'absolute' }}
            multiline
            value={''}
          />
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={{padding: 10}}>
              <Text style={styles.heading1}>Test Content</Text>
              <TouchableOpacity 
                onLongPress={(event) => handleLongPress("This is a direct test of text selection. Try selecting this text.", event)}
                delayLongPress={500}
              >
                <Text style={styles.paragraph}>
                  This is a direct test of text selection. Try LONG PRESSING this text.
                </Text>
              </TouchableOpacity>
              
              <Text style={styles.heading2}>Selection Test</Text>
              
              <TextInput
                style={[styles.paragraph, {backgroundColor: 'transparent', color: '#e1e1e1', borderWidth: 1, borderColor: '#444', padding: 10, marginVertical: 10}]}
                value="This is a TextInput that should be selectable. Try selecting this text to see if the popup appears."
                multiline
                editable={false}
                scrollEnabled={false}
                onSelectionChange={handleSelectionChange}
                contextMenuHidden={true} // Hide the default context menu
                selectTextOnFocus={true} // Select all text when focused
              />
              
              <TouchableOpacity 
                onLongPress={(event) => handleLongPress("If you can select this text, the selection feature is working correctly. Try selecting this text to see if the 'Ask Copilot' popup appears.", event)}
                delayLongPress={500}
                style={{marginTop: 20, backgroundColor: '#333', padding: 10}}
              >
                <Text style={styles.paragraph}>
                  If you can LONG PRESS this text, the selection feature is working correctly.
                  Try long pressing this text to see if the "Ask Copilot" popup appears.
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          
          <FloatingActionButton 
            isVisible={showFloatingButton} 
            onPress={handleAskCopilot} 
            position={selectionPosition}
          />
          
          <AskCopilotModal
            visible={showAskModal}
            onClose={() => setShowAskModal(false)}
            selectedText={selectedText}
          />
        </>
      ) : (
        <WelcomeScreen onImport={handleImportMarkdown} />
      )}
      
      {/* Import button always visible if markdown is loaded */}
      {markdown && (
        <TouchableOpacity 
          style={styles.fabImport}
          onPress={handleImportMarkdown}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    height: 80,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#999',
    fontSize: 14,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  markdownBody: {
    color: '#e1e1e1',
    fontSize: 16,
    lineHeight: 24,
  },
  heading1: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 16,
  },
  heading2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 12,
  },
  heading3: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 8,
  },
  paragraph: {
    marginVertical: 8,
    color: '#e1e1e1',
  },
  link: {
    color: '#3498db',
    textDecorationLine: 'underline',
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: '#666',
    paddingLeft: 16,
    marginLeft: 8,
    opacity: 0.8,
  },
  codeBlock: {
    backgroundColor: '#1e1e1e',
    padding: 12,
    borderRadius: 6,
    marginVertical: 8,
    overflow: 'hidden',
  },
  pythonBlock: {
    backgroundColor: '#263238',
  },
  diffBlock: {
    backgroundColor: '#0d2818',
  },
  bashBlock: {
    backgroundColor: '#1a1a1a',
  },
  jsonBlock: {
    backgroundColor: '#1e2a35',
  },
  // Add these to styles to make them available to the markdown renderer
  code_block: {
    backgroundColor: '#1e1e1e',
    padding: 12,
    borderRadius: 6,
    marginVertical: 8,
    overflow: 'hidden',
  },
  codeLanguage: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
  },
  codeText: {
    color: '#e1e1e1',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
  },
  inlineCode: {
    backgroundColor: '#2a2a2a',
    color: '#e1e1e1',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    zIndex: 100,
  },
  popupMenuContainer: {
    position: 'absolute',
    zIndex: 100,
    // Position is set dynamically
  },
  blurContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  floatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 30,
  },
  importButton: {
    flexDirection: 'row',
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  importButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  fabImport: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  gitTreeContainer: {
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  gitTreeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  gitTreeTitle: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  gitTreeContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  fileName: {
    color: '#ccc',
    marginLeft: 8,
    fontSize: 14,
  },
  listItem: {
    marginVertical: 4,
  },
  listItemText: {
    color: '#e1e1e1',
    fontSize: 16,
  },
  // Modal styles
  // Full-screen modal styles
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#121212',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  selectedTextContainer: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  selectedTextLabel: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 4,
  },
  selectedTextContent: {
    color: '#e1e1e1',
    fontSize: 15,
  },
  // Chat styles
  chatContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  chatContentContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    marginVertical: 6,
    maxWidth: '80%',
  },
  userMessageBubble: {
    backgroundColor: '#0084ff',
    alignSelf: 'flex-end',
    marginLeft: '20%',
  },
  assistantMessageBubble: {
    backgroundColor: '#333',
    alignSelf: 'flex-start',
    marginRight: '20%',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  assistantMessageText: {
    color: '#e1e1e1',
  },
  loadingIndicator: {
    alignItems: 'center',
    padding: 12,
    marginVertical: 8,
  },
  loadingIndicatorText: {
    color: '#999',
    marginTop: 8,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 12,
    padding: 8,
  },
  // Main loading container for the screen
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingScreenText: {
    color: '#e1e1e1',
    fontSize: 16,
    marginTop: 10,
  },
});

export default MarkdownViewerScreen;
