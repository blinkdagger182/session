import React from 'react';
import { StyleSheet, SafeAreaView, StatusBar, View } from 'react-native';
import ChatbotScreen from '@/components/ChatbotScreen';
import ConversationSidebar from '@/components/ConversationSidebar'; 

export default function ChatbotTab() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <View style={styles.mainLayout}> 
        <View style={styles.sidebarContainer}> 
          <ConversationSidebar />
        </View>
        <View style={styles.chatContainer}> 
          <ChatbotScreen />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', 
  },
  mainLayout: {
    flex: 1,
    flexDirection: 'row', 
    backgroundColor: '#f0f0f0', 
  },
  sidebarContainer: {
    width: 250, 
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#ccc',
  },
  chatContainer: {
    flex: 1, 
  },
});
