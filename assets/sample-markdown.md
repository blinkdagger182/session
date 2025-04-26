# Session: Developer Copilot

Welcome to Session, your markdown-based developer copilot!

## Features

- **Markdown Viewer**: View and interact with your development notes
- **Syntax Highlighting**: Support for `python`, `diff`, `bash`, and `json`
- **AI Copilot**: Ask questions about your code
- **Git Tree**: Visualize your project structure

## Code Examples

Here are some examples of code that Session can highlight:

### Python

```python
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
```

### Bash

```bash
#!/bin/bash
# Simple script to check system info

echo "System Information:"
echo "-------------------"
echo "Hostname: $(hostname)"
echo "Kernel: $(uname -r)"
echo "CPU: $(grep 'model name' /proc/cpuinfo | head -1 | cut -d ':' -f 2 | sed 's/^ *//')"
echo "Memory: $(free -h | grep Mem | awk '{print $2}')"
```

### JSON

```json
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
```

### Diff

```diff
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
```

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

Happy coding! 🚀
