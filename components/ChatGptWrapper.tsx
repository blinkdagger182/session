import React, { ReactNode } from 'react';
// Note: We're using a custom wrapper to handle the ChatGPT integration
// This is a simplified implementation for the Session app

interface ChatGptWrapperProps {
  children: ReactNode;
}

// This is a mock implementation for demonstration purposes
// In a real app, you would use the actual ChatGptProvider from react-native-chatgpt
const ChatGptWrapper = ({ children }: ChatGptWrapperProps) => {
  return (
    <>{children}</>
  );
};

export default ChatGptWrapper;
