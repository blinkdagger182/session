import React from 'react';
import { registerRootComponent } from 'expo';
import AllConversationsScreen from './components/AllConversationsScreen';

// Simple standalone app to view all conversations
export default function ConversationsViewer() {
  return <AllConversationsScreen />;
}

// Register as the main component
registerRootComponent(ConversationsViewer);
