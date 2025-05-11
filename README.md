# Mosaic - AI Chat Application 🤖💬

Mosaic is a powerful AI chat application built with React Native and Expo, featuring a modern interface and seamless conversation management. Interact with GPT-4o Mini through an intuitive chat interface and manage multiple conversations with ease.

## ✨ Features

- **AI-Powered Conversations**: Chat with OpenAI's GPT-4o Mini model
- **Conversation Management**: Create, view, and delete multiple chat threads
- **Markdown Support**: AI responses support rich markdown formatting
- **Persistent Storage**: All conversations are saved locally on your device
- **Dark Mode UI**: Sleek, modern dark-themed interface
- **Question & Chat Types**: Organize your interactions by type

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI
- OpenAI API Key

### Installation

1. Clone this repository

2. Install dependencies

   ```bash
   npm install
   # or
   npx expo install
   ```

3. Set up your environment variables
   - Copy `.env.example` to `.env`
   - Add your OpenAI API key to the `.env` file

4. Start the app

   ```bash
   npx expo start
   ```

**Note**: You will need to make a development build or run in development mode as some features do not work in Expo GO.

### Running on Devices/Simulators

In the output, you'll find options to open the app in:

- [Development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)

## 📱 App Structure

- **Conversations Management**: Create and manage multiple chat threads
- **Chat Interface**: Send messages to the AI and view responses with markdown support
- **Persistent Storage**: All conversations are saved using AsyncStorage

## 🛠️ Built With

- [React Native](https://reactnative.dev/) - Mobile app framework
- [Expo](https://expo.dev/) - React Native toolchain
- [OpenAI API](https://openai.com/api/) - AI chat capabilities
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [React Native Markdown Display](https://github.com/iamacup/react-native-markdown-display) - Markdown rendering

## 📝 Project Structure

The app uses a file-based routing system with Expo Router. Key directories include:

- `/app`: Main application screens and routing
- `/components`: Reusable UI components
- `/stores`: State management using Zustand
- `/assets`: Static assets like images and fonts

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📄 License

This project is available as open source under the terms of the MIT License.

