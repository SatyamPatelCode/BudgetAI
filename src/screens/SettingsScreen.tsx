import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar,
  Dimensions,
  Image,
  Animated,
  PanResponder,
  TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SimpleLineIcons, Ionicons } from '@expo/vector-icons';
import { useClerk } from '@clerk/clerk-expo';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;

interface SettingsScreenProps {
  onNavigateHome: () => void;
  theme: any;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

export default function SettingsScreen({ onNavigateHome, theme, toggleTheme, isDarkMode }: SettingsScreenProps) {
  const { signOut } = useClerk();
  const sidebarAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current; 
  const isSidebarOpenRef = useRef(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);

  const toggleSidebar = (toOpen: boolean) => {
    if (toOpen) setIsOverlayVisible(true);
    Animated.timing(sidebarAnim, {
      toValue: toOpen ? 0 : -SIDEBAR_WIDTH,
      duration: 300,
      useNativeDriver: true, 
    }).start(({ finished }) => {
      if (finished) {
        isSidebarOpenRef.current = toOpen;
        if (!toOpen) setIsOverlayVisible(false);
      }
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx, dy, moveX } = gestureState;
        const isEdgeSwipe = !isSidebarOpenRef.current && moveX < 50 && dx > 10;
        const isOpenDrag = isSidebarOpenRef.current && Math.abs(dx) > 10;
        return (isEdgeSwipe || isOpenDrag) && Math.abs(dx) > Math.abs(dy);
      },
      onPanResponderGrant: () => {
        const startValue = isSidebarOpenRef.current ? 0 : -SIDEBAR_WIDTH;
        sidebarAnim.setOffset(startValue);
        sidebarAnim.setValue(0);
        setIsOverlayVisible(true); 
      },
      onPanResponderMove: (evt, gestureState) => {
        const { dx } = gestureState;
        const startPos = isSidebarOpenRef.current ? 0 : -SIDEBAR_WIDTH;
        const currentTotal = startPos + dx;
        if (currentTotal > 0 || currentTotal < -SIDEBAR_WIDTH) {
             sidebarAnim.setValue(currentTotal - startPos); 
        } else {
            sidebarAnim.setValue(dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        sidebarAnim.flattenOffset();
        const { vx, dx } = gestureState;
        const isFling = Math.abs(vx) > 0.3;
        let shouldOpen = isSidebarOpenRef.current;
        
        if (isFling) {
            if (vx > 0.3) shouldOpen = true; 
            else if (vx < -0.3) shouldOpen = false;
        } else {
             if (dx > SIDEBAR_WIDTH / 3) shouldOpen = true;
             else if (dx < -SIDEBAR_WIDTH / 3) shouldOpen = false;
             else {
                 shouldOpen = isSidebarOpenRef.current;
                 if (!isSidebarOpenRef.current && dx > 80) shouldOpen = true; 
                 if (isSidebarOpenRef.current && dx < -80) shouldOpen = false;
             }
        }
        toggleSidebar(shouldOpen);
      },
    })
  ).current;

  const renderSidebar = () => {
    if (!isOverlayVisible) return null;

    return (
      <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]} pointerEvents='box-none'>
        <TouchableWithoutFeedback onPress={() => toggleSidebar(false)}>
          <Animated.View style={[styles.modalBackdrop, { 
             opacity: sidebarAnim.interpolate({
                inputRange: [-SIDEBAR_WIDTH, 0],
                outputRange: [0, 0.5],
                extrapolate: 'clamp'
             }) 
          }]} />
        </TouchableWithoutFeedback>
        
        <Animated.View 
          style={[
            styles.sidebarContainer, 
            { transform: [{ translateX: sidebarAnim }], backgroundColor: theme.background }
          ]}
        >
          <View style={[styles.sidebarHeader, { backgroundColor: theme.primary }]}>
             <TouchableOpacity 
               style={styles.sidebarMenuButton} 
               onPress={() => toggleSidebar(false)}
             >
                <SimpleLineIcons name='menu' size={24} color='black' />
             </TouchableOpacity>

             <View style={styles.sidebarLogoContainer}>
               <Image 
                 source={require('../../assets/BudgetAI_BWTransparent.png')} 
                 style={styles.sidebarIcon} 
                 resizeMode='contain' 
               />
             </View>
          </View>
          
          <View style={[styles.sidebarContent, { backgroundColor: theme.background }]}>
            {['Home', 'Recap', 'Settings', 'Log Out'].map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.sidebarButton, { backgroundColor: theme.primary }]}
                onPress={() => {
                  if (item === 'Home') {
                    toggleSidebar(false);
                    onNavigateHome();
                  } else if (item === 'Log Out') {
                    signOut();
                  } else {
                    toggleSidebar(false);
                  }
                }}
              >
                <Text style={[styles.sidebarButtonText, { color: '#5E5CE6' }]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    );
  };
  
  return (
    <View style={{ flex: 1, backgroundColor: theme.primary }}>
      {renderSidebar()}
      <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers} pointerEvents="box-none" />

      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top', 'left', 'right']}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <TouchableOpacity onPress={() => toggleSidebar(true)} style={styles.backButton}>
             <SimpleLineIcons name="menu" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onNavigateHome}>
            <Image source={require('../../assets/BudgetAI_BWTransparent.png')} style={styles.navIcon} resizeMode="contain" />
          </TouchableOpacity>
          <View style={{ width: 24 }} /> 
        </View>

      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: theme.secondary }]}>Settings:</Text>

        <View style={styles.buttonsContainer}>
          {/* Light/Dark Mode Toggle */}
          <TouchableOpacity 
            style={[
              styles.button, 
              { 
                backgroundColor: theme.secondary,
                borderColor: theme.secondary, 
                borderWidth: 1 
              }
            ]}
            onPress={toggleTheme}
          >
            <Text style={[
              styles.buttonText, 
              { color: '#FFF' }
            ]}>
              {isDarkMode ? 'Dark Mode' : 'Light Mode'}
            </Text>
          </TouchableOpacity>
          
           {/* Dummy Buttons from image */}
           <TouchableOpacity style={[styles.button, { borderColor: theme.secondary, borderWidth: 1 }]}>
            <Text style={[styles.buttonText, { color: theme.secondary }]}>Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, { borderColor: theme.secondary, borderWidth: 1 }]}>
             <Text style={[styles.buttonText, { color: theme.secondary }]}>Change Password</Text>
          </TouchableOpacity>

        </View>
      </View>
    </SafeAreaView>
  </View>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black', 
  },
  sidebarContainer: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
    backgroundColor: 'white',
    position: 'absolute', 
    left: 0,
  },
  sidebarHeader: {
    height: 120, 
    width: '100%',
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingTop: 40, 
    paddingHorizontal: 20,
    backgroundColor: '#F5F5F5',
  },
  sidebarMenuButton: {
    position: 'absolute',
    left: 20,
    top: 55, 
    zIndex: 10,
    padding: 10,
  },
  sidebarLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  sidebarIcon: {
    height: 60,  
    width: 200,  
  },
  sidebarContent: {
    flex: 1,
    padding: 20,
  },
  sidebarButton: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  sidebarButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Poppins_700Bold',
  },
  navIcon: {
    height: 60,
    width: 200, 
  },
  header: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_400Regular',
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    fontFamily: 'Poppins_700Bold',
  },
  buttonsContainer: {
    gap: 15,
  },
  button: {
    width: '100%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'flex-start', // Left align text as per image
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
  }
});
