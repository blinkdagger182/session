import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  Text,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '@/store/sessionStore';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = 300;
const DRAG_THRESHOLD = 50;

type DrawerProps = {
  children: React.ReactNode;
};

const Drawer = ({ children }: DrawerProps) => {
  const { activeTab, setActiveTab } = useSessionStore();
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);

  // Handle drawer animation
  const animateDrawer = (open: boolean) => {
    Animated.spring(translateX, {
      toValue: open ? -DRAWER_WIDTH : 0,
      useNativeDriver: true,
      bounciness: 0,
      speed: 15,
    }).start();
    isOpen.current = open;
    
    // Provide haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Toggle drawer state
  const toggleDrawer = () => {
    animateDrawer(!isOpen.current);
  };

  // Create pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal gestures
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy * 3);
      },
      onPanResponderMove: (_, gestureState) => {
        let newX = isOpen.current ? -DRAWER_WIDTH + gestureState.dx : gestureState.dx;
        
        // Constrain the values
        if (newX > 0) newX = 0;
        if (newX < -DRAWER_WIDTH) newX = -DRAWER_WIDTH;
        
        translateX.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isOpen.current) {
          // If drawer is open, close if dragged right enough
          if (gestureState.dx > DRAG_THRESHOLD) {
            animateDrawer(false);
          } else {
            animateDrawer(true);
          }
        } else {
          // If drawer is closed, open if dragged left enough
          if (gestureState.dx < -DRAG_THRESHOLD) {
            animateDrawer(true);
          } else {
            animateDrawer(false);
          }
        }
      },
    })
  ).current;

  // Handle tab changes
  const handleTabPress = (tabId: 'markdown' | 'chatbot') => {
    setActiveTab(tabId);
    
    // Close drawer when changing tabs on smaller screens
    if (width < 768) {
      animateDrawer(false);
    }
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Main Content with Animation */}
      <Animated.View
        style={[
          styles.mainContent,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        {children}
        
        {/* Drawer Toggle Button */}
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={toggleDrawer}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isOpen.current ? "chevron-forward" : "menu"}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Drawer Content */}
      <View style={styles.drawer}>
        <SafeAreaView style={styles.drawerContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Session</Text>
          </View>
          
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'markdown' && styles.activeTab
              ]}
              onPress={() => handleTabPress('markdown')}
            >
              <Ionicons
                name="document-text"
                size={24}
                color={activeTab === 'markdown' ? '#fff' : '#999'}
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === 'markdown' && styles.activeTabLabel
                ]}
              >
                Markdown
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'chatbot' && styles.activeTab
              ]}
              onPress={() => handleTabPress('chatbot')}
            >
              <Ionicons
                name="chatbubble-ellipses"
                size={24}
                color={activeTab === 'chatbot' ? '#fff' : '#999'}
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === 'chatbot' && styles.activeTabLabel
                ]}
              >
                Copilot
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.footer}>
            <TouchableOpacity style={styles.footerButton}>
              <Ionicons name="help-circle-outline" size={22} color="#999" />
              <Text style={styles.footerButtonText}>Help</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#121212',
    zIndex: 1,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#1a1a1a',
    borderLeftWidth: 1,
    borderLeftColor: '#333',
    zIndex: 0,
  },
  drawerContent: {
    flex: 1,
    paddingTop: 20,
  },
  toggleButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(50, 50, 50, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabs: {
    flex: 1,
    paddingTop: 20,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 5,
  },
  activeTab: {
    backgroundColor: '#333',
  },
  tabLabel: {
    color: '#999',
    fontSize: 16,
    marginLeft: 15,
  },
  activeTabLabel: {
    color: '#fff',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerButtonText: {
    color: '#999',
    marginLeft: 10,
  },
});

export default Drawer;
