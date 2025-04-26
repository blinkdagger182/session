import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '@/store/sessionStore';
import * as Haptics from 'expo-haptics';

type SidebarItem = {
  id: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
};

const sidebarItems: SidebarItem[] = [
  { id: 'markdown', icon: 'document-text', label: 'Markdown' },
  { id: 'chatbot', icon: 'chatbubble-ellipses', label: 'Copilot' },
];

const Sidebar = () => {
  const { activeTab, setActiveTab } = useSessionStore();

  const handleItemPress = (itemId: string) => {
    setActiveTab(itemId as 'markdown' | 'chatbot');
    
    // Provide haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Session</Text>
      </View>
      
      <View style={styles.itemsContainer}>
        {sidebarItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.item,
              activeTab === item.id && styles.activeItem
            ]}
            onPress={() => handleItemPress(item.id)}
          >
            <Ionicons
              name={item.icon}
              size={24}
              color={activeTab === item.id ? '#fff' : '#999'}
            />
            <Text
              style={[
                styles.itemLabel,
                activeTab === item.id && styles.activeItemLabel
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerButton}>
          <Ionicons name="help-circle-outline" size={22} color="#999" />
          <Text style={styles.footerButtonText}>Help</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 80,
    height: '100%',
    backgroundColor: '#1a1a1a',
    borderRightWidth: 1,
    borderRightColor: '#333',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  header: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemsContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingTop: 20,
  },
  item: {
    width: '100%',
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  activeItem: {
    backgroundColor: '#333',
  },
  itemLabel: {
    color: '#999',
    fontSize: 12,
    marginTop: 5,
  },
  activeItemLabel: {
    color: '#fff',
  },
  footer: {
    paddingBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  footerButton: {
    alignItems: 'center',
    padding: 10,
  },
  footerButtonText: {
    color: '#999',
    fontSize: 12,
    marginTop: 5,
  },
});

export default Sidebar;
