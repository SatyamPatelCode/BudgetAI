import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Image,
  ScrollView,
  StatusBar,
  Animated,
  PanResponder,
  TouchableWithoutFeedback,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SimpleLineIcons, Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

const logo = require('../../assets/BudgetAI_BWTransparent.png');

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;

interface AddTransactionScreenProps {
  onNavigateHome: () => void;
}

export default function AddTransactionScreen({ onNavigateHome }: AddTransactionScreenProps) {
  const theme = Colors.light;
  const [useAI, setUseAI] = useState(false);
  const [showAIInfo, setShowAIInfo] = useState(false);
  const [name, setName] = useState('');
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
          
          <View style={styles.sidebarContent}>
            {['Home', 'Recap', 'Settings', 'Log Out'].map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.sidebarButton, { backgroundColor: theme.primary }]}
                onPress={() => {
                   if (item === 'Home') {
                       toggleSidebar(false);
                       onNavigateHome();
                   }
                }}
              >
                <Text style={styles.sidebarButtonText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    );
  };

  const [cost, setCost] = useState('');
  const [category, setCategory] = useState('');

  // Placeholder data to match the screenshot layout
  // 1 filled item (header-like), 3 empty items
  const recentItems = [
    { id: '1', name: 'Name', category: 'Category', cost: 'Cost', isHeader: true },
    { id: '2', name: '', category: '', cost: '', isHeader: false },
    { id: '3', name: '', category: '', cost: '', isHeader: false },
    { id: '4', name: '', category: '', cost: '', isHeader: false },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.primary }}>
      {renderSidebar()}
      {/* We attach panHandlers to a container View that fills the draggable area */}
      <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers} pointerEvents="box-none" />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />
        
        {/* Header - Green Background */}
        <View style={[styles.navBar, { backgroundColor: theme.primary }]}>
          <TouchableOpacity onPress={() => toggleSidebar(true)} style={styles.menuButton}>
            <SimpleLineIcons name="menu" size={24} color="black" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={onNavigateHome}>
            <Image source={logo} style={styles.navIcon} resizeMode="contain" />
          </TouchableOpacity>
          
          <View style={{ width: 24 }} /> 
        </View>

        {/* Content - White Background */}
        <View style={styles.contentContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            
            <Text style={[styles.sectionTitle, { color: theme.secondary }]}>
              Add a transaction:
            </Text>

            {/* Input Fields */}
            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.input, { borderColor: theme.secondary }]}
                placeholder="Name"
                placeholderTextColor={theme.secondary}
                value={name}
                onChangeText={setName}
              />
              
              <TextInput
                style={[styles.input, { borderColor: theme.secondary }]}
                placeholder="Cost"
                placeholderTextColor={theme.secondary}
                value={cost}
                onChangeText={setCost}
                keyboardType="numeric"
              />
              
              <View style={styles.rowInputContainer}>
                <TextInput
                  style={[
                    styles.input, 
                    { flex: 1, marginRight: 10, borderColor: theme.secondary },
                    useAI && styles.categoryDisabled
                  ]}
                  placeholder="Category"
                  placeholderTextColor={useAI ? "#CCC" : theme.secondary}
                  value={category}
                  onChangeText={setCategory}
                  editable={!useAI}
                />
                
                <View style={styles.aiCheckboxContainer}>
                  <TouchableOpacity 
                    style={[styles.checkbox, { borderColor: theme.secondary }]}
                    onPress={() => {
                      const nextState = !useAI;
                      setUseAI(nextState);
                      if (nextState) setCategory('');
                    }}
                  >
                    {useAI && <View style={{ width: 10, height: 10, backgroundColor: theme.secondary }} />}
                  </TouchableOpacity>
                  <Text style={{ color: theme.secondary, marginHorizontal: 5 }}>Use AI</Text>
                  <TouchableOpacity onPress={() => setShowAIInfo(!showAIInfo)}>
                     <Ionicons name="information-circle-outline" size={16} color="gray" />
                  </TouchableOpacity>
                </View>
              </View>

              {showAIInfo && (
                <View style={styles.aiInfoCard}>
                  <Text style={styles.aiInfoText}>
                    Our AI will analyze your transaction details to automatically select the best category for you.
                  </Text>
                </View>
              )}

              <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.secondary }]}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* Recent Transactions Section */}
            <Text style={[styles.sectionTitle, { color: theme.secondary, marginTop: 20 }]}>
              Recent Transactions:
            </Text>

            {recentItems.map((item) => (
              <View key={item.id} style={[styles.recentItemContainer, { borderColor: theme.secondary }]}>
                {item.isHeader ? (
                  <View style={styles.recentItemContent}>
                    <Text style={styles.recentItemText}>Name</Text>
                    <Text style={styles.recentItemText}>Category</Text>
                    <Text style={styles.recentItemText}>Cost</Text>
                  </View>
                ) : (
                  <View style={styles.recentItemContent} />
                )}
                
                {!item.isHeader && (
                  <TouchableOpacity style={styles.deleteCircle}>
                     <Ionicons name="close" size={12} color="white" />
                  </TouchableOpacity>
                )}
              </View>
            ))}

          </ScrollView>

          {/* Bottom Green Bar */}
          <View style={[styles.bottomBar, { backgroundColor: theme.primary }]} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    height: 80,
    marginTop: 0, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    width: '100%',
  },
  menuButton: {
    padding: 5,
  },
  navIcon: {
    height: 60,
    width: 200, 
  },
  contentContainer: {
    flex: 1,
    backgroundColor: 'white',
    width: '100%',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 80, 
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    fontFamily: 'Poppins_700Bold', 
  },
  inputGroup: {
    gap: 15,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: 'black',
    backgroundColor: 'white', // Ensure opaque background if border is colored
  },
  rowInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  addButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  recentItemContainer: {
    borderWidth: 1,
    borderRadius: 12,
    height: 50,
    marginBottom: 10,
    justifyContent: 'center',
    position: 'relative',
  },
  recentItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  recentItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'black',
  },
  deleteCircle: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF453A', // Error color
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'white',
    zIndex: 1,
  },
  bottomBar: {
    height: 60,
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
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
    backgroundColor: 'white',
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
    color: '#6B4EFF', 
    fontFamily: 'Poppins_700Bold',
  },
  categoryDisabled: {
    backgroundColor: '#F0F0F0',
    color: '#A0A0A0',
  },
  aiInfoCard: {
    padding: 10,
    backgroundColor: '#E6E6FA', 
    borderRadius: 8,
    marginTop: 5,
    marginBottom: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#6B4EFF',
  },
  aiInfoText: {
    fontSize: 12,
    color: '#333',
    fontStyle: 'italic',
  },
});
