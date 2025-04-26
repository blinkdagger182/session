import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
  Platform,
  TextInput,
} from 'react-native';
import Markdown, { MarkdownProps } from 'react-native-markdown-display';
import * as Haptics from 'expo-haptics';
import { useSessionStore } from '@/store/sessionStore';
import { Ionicons } from '@expo/vector-icons';
// Using expo-file-system instead of document picker to avoid native module issues
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveLastSessionPath } from '@/store/sessionStore';
import { loadSampleMarkdown } from '@/utils/loadSampleMarkdown';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

// Git tree component for displaying file structure
const GitTree = ({ markdown }: { markdown: string | null }) => {
  const [expanded, setExpanded] = useState(false);
  const [files, setFiles] = useState<string[]>([]);

  useEffect(() => {
    if (markdown) {
      // Simple regex to extract filenames from markdown code blocks
      // This looks for patterns like ```python filename.py or # filename.py
      const fileRegex = /(?:```\w+\s+|#\s+)([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)/g;
      const matches = [...markdown.matchAll(fileRegex)];
      const uniqueFiles = [...new Set(matches.map(match => match[1]))];
      setFiles(uniqueFiles);
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
  onPress 
}: { 
  isVisible: boolean; 
  onPress: () => void;
}) => {
  if (!isVisible) return null;
  
  return (
    <Animated.View 
      style={styles.floatingButtonContainer}
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
  const scrollViewRef = useRef<ScrollView>(null);

  // No need to load from storage here as it's handled in the main index component

  // Handle text selection
  const handleSelectionChange = (
    event: NativeSyntheticEvent<TextInputSelectionChangeEventData>
  ) => {
    const { selection } = event.nativeEvent;
    
    if (selection.start !== selection.end && markdown) {
      // Text is selected
      const selected = markdown.substring(selection.start, selection.end);
      setSelectedText(selected);
      setShowFloatingButton(true);
    } else {
      setSelectedText('');
      setShowFloatingButton(false);
    }
  };

  // Handle asking copilot about selected text
  const handleAskCopilot = () => {
    if (selectedText) {
      setHighlightContext(selectedText);
      setActiveTab('chatbot');
    }
  };

  // Import markdown file - simplified approach for demo purposes
  const handleImportMarkdown = async () => {
    try {
      // Get the sample markdown content directly
      const sampleContent = await loadSampleMarkdown();
      
      if (sampleContent) {
        // Save the markdown content directly to state
        setMarkdown(sampleContent);
        
        // Provide haptic feedback for success
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error importing markdown:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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

  // Custom markdown rules for syntax highlighting
  const markdownRules: MarkdownProps['rules'] = {
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
          <Text style={styles.codeText}>{node.content}</Text>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Session</Text>
        <Text style={styles.headerSubtitle}>Markdown Viewer</Text>
      </View>
      {markdown ? (
        <>
          <GitTree markdown={markdown} />
          
          <TextInput
            style={{ height: 0, width: 0, position: 'absolute' }}
            multiline
            value={markdown}
            onSelectionChange={handleSelectionChange}
          />
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <Markdown
              style={markdownStyles}
              rules={markdownRules}
            >
              {markdown}
            </Markdown>
          </ScrollView>
          
          <FloatingActionButton 
            isVisible={showFloatingButton} 
            onPress={handleAskCopilot} 
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
});

export default MarkdownViewerScreen;
