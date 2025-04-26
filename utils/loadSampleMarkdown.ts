import * as FileSystem from 'expo-file-system';
import { useSessionStore } from '@/store/sessionStore';

/**
 * Loads the sample markdown content
 * This is used to provide an initial experience for users
 */
export const loadSampleMarkdown = async (): Promise<string | null> => {
  try {
    // Instead of loading from an asset, we'll just return a hardcoded sample
    return SAMPLE_MARKDOWN;
  } catch (error) {
    console.error('Failed to load sample markdown:', error);
    return null;
  }
};

// Sample markdown content as a string
const SAMPLE_MARKDOWN = `# Session: Developer Copilot

Welcome to Session, your markdown-based developer copilot!

## Features

- **Markdown Viewer**: View and interact with your development notes
- **Syntax Highlighting**: Support for \`python\`, \`diff\`, \`bash\`, and \`json\`
- **AI Copilot**: Ask questions about your code
- **Git Tree**: Visualize your project structure

## Code Examples

Here are some examples of code that Session can highlight:

### Python

\`\`\`python
def fibonacci(n):
    """Calculate the Fibonacci sequence up to n"""
    a, b = 0, 1
    result = []
    while a < n:
        result.append(a)
        a, b = b, a + b
    return result

# Example usage
fib_sequence = fibonacci(100)
print(fib_sequence)
\`\`\`

### Bash

\`\`\`bash
#!/bin/bash
# Simple script to check system info

echo "System Information:"
echo "-------------------"
echo "Hostname: $(hostname)"
echo "Kernel: $(uname -r)"
echo "CPU: $(grep 'model name' /proc/cpuinfo | head -1 | cut -d ':' -f 2 | sed 's/^ *//')"
echo "Memory: $(free -h | grep Mem | awk '{print $2}')"
\`\`\`

### JSON

\`\`\`json
{
  "app": "Session",
  "version": "1.0.0",
  "features": [
    "Markdown Viewer",
    "Syntax Highlighting",
    "AI Copilot",
    "Git Tree"
  ],
  "settings": {
    "theme": "dark",
    "autoSave": true,
    "highlightOnSelection": true
  }
}
\`\`\`

### Diff

\`\`\`diff
diff --git a/app.js b/app.js
index 123456..789012 100644
--- a/app.js
+++ b/app.js
@@ -10,7 +10,7 @@ class App extends Component {
   render() {
     return (
       <View style={styles.container}>
-        <Text>Welcome to React Native!</Text>
+        <Text>Welcome to Session!</Text>
         <StatusBar style="auto" />
       </View>
     );
\`\`\`

## How to Use

1. **View Markdown**: Load your development journal or notes
2. **Highlight Text**: Select any text to analyze
3. **Ask Copilot**: Click the floating button to ask questions
4. **Navigate**: Use the bottom tabs to switch between views

## Development Notes

The app is built with:
- React Native
- Expo
- Zustand for state management
- React Navigation

Happy coding! 🚀`;

/**
 * Utility function to initialize the app with sample markdown
 * if no previous session exists
 */
export const initializeWithSampleMarkdown = async (): Promise<void> => {
  const { markdown, setMarkdown } = useSessionStore.getState();
  
  // Only load sample if no markdown exists
  if (!markdown) {
    const sampleContent = await loadSampleMarkdown();
    if (sampleContent) {
      setMarkdown(sampleContent);
    }
  }
};
