import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  StatusBar,
  Dimensions,
  Image,
  TouchableOpacity,
  Animated,
  PanResponder,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';
import { SimpleLineIcons, Ionicons } from '@expo/vector-icons';
import { useUser, useClerk } from '@clerk/clerk-expo'; // Added Clerk hooks

const icon = require('../../assets/BudgetAI_BWTransparent.png');

// Mock Data for Transactions
const TRANSACTIONS = [
  { id: '1', name: 'Grocery Store', category: 'Food', amount: 45.50 },
  { id: '2', name: 'Uber Ride', category: 'Transport', amount: 12.25 },
  { id: '3', name: 'Netflix', category: 'Entertainment', amount: 15.00 },
  { id: '4', name: 'Coffee Shop', category: 'Food', amount: 5.75 },
  { id: '5', name: 'Gym Membership', category: 'Health', amount: 30.00 },
  { id: '6', name: 'Electric Bill', category: 'Bills', amount: 120.00 },
];

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75; 

interface HomeScreenProps {
  onNavigateToAdd?: () => void; // Made optional for now to avoid breaking existing calls
}

export default function HomeScreen({ onNavigateToAdd }: HomeScreenProps) {
  const { user } = useUser();
  const { signOut } = useClerk();
  
  const theme = Colors.light; 
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
        
        <Animated.View style={[styles.sidebarContainer, { transform: [{ translateX: sidebarAnim }], backgroundColor: theme.background }]}>
          <View style={[styles.sidebarHeader, { backgroundColor: theme.primary }]}>
             <TouchableOpacity style={styles.sidebarMenuButton} onPress={() => toggleSidebar(false)}>
                <SimpleLineIcons name='menu' size={24} color='black' />
             </TouchableOpacity>

             <View style={styles.sidebarLogoContainer}>
               <Image source={icon} style={styles.sidebarIcon} resizeMode='contain' />
             </View>
          </View>
          
          <View style={styles.sidebarContent}>
            {['Home', 'Recap', 'Settings', 'Log Out'].map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.sidebarButton, { backgroundColor: theme.primary }]}
                onPress={() => {
                  if (item === 'Log Out') {
                    signOut(); // Integrate Clerk SignOut
                  } else {
                    toggleSidebar(false);
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

  const renderTransaction = ({ item }: { item: typeof TRANSACTIONS[0] }) => (
    <View style={[styles.transactionRow, { borderColor: theme.secondary }]}>
      <TouchableOpacity style={styles.deleteButton}>
        <Ionicons name='close-circle' size={20} color={theme.error} />
      </TouchableOpacity>
      
      <View style={styles.colName}>
        <Text style={[styles.transactionText, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
      </View>
      
      <View style={styles.colCategory}>
        <Text style={[styles.transactionText, { color: theme.textSecondary }]} numberOfLines={1}>{item.category}</Text>
      </View>
      
      <View style={styles.colAmount}>
        <Text style={[styles.transactionText, { color: theme.text, fontWeight: 'bold' }]}>
          ${item.amount.toFixed(2)}
        </Text>
      </View>
    </View>
  );

  const Header = () => (
    <View style={styles.headerContainer}>
      <View style={styles.greetingContainer}>
        {/* Dynamic Name */}
        <Text style={[styles.greetingText, { color: theme.secondary }]}>
          Hello {user?.firstName || user?.username || 'User'},
        </Text>
        <Text style={[styles.subGreetingText, { color: theme.text }]}>Here is your spending overview</Text>
      </View>

      <View style={[styles.chartPlaceholder, { backgroundColor: '#E0E0E0' }]} />

      <View style={styles.listHeaderRow}>
        <Text style={[styles.sectionTitle, { color: theme.secondary }]}>Recent Transactions:</Text>
        <TouchableOpacity style={[styles.filterButton, { borderColor: theme.secondary }]}>
          <Text style={{ color: theme.secondary }}>Filter</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.columnHeaderRow, { borderColor: theme.secondary }]}>
        <Text style={[styles.columnHeaderText, { flex: 2, textAlign: 'center' }]}>Name</Text>
        <Text style={[styles.columnHeaderText, { flex: 2, textAlign: 'center' }]}>Category</Text>
        <Text style={[styles.columnHeaderText, { flex: 1, textAlign: 'center' }]}>Cost</Text>
      </View>
    </View>
  );
  
  const Footer = () => <View style={{ height: 80 }} />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.primary }} {...panResponder.panHandlers}>
      {renderSidebar()}
      
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <StatusBar barStyle='dark-content' />
        
        <View style={[styles.navBar, { backgroundColor: theme.primary }]}>
          <TouchableOpacity style={styles.menuButton} onPress={() => toggleSidebar(true)}>
            <SimpleLineIcons name='menu' size={24} color='black' />
          </TouchableOpacity>
          <Image source={icon} style={styles.navIcon} resizeMode='contain' />
          <View style={{ width: 24 }} /> 
        </View>

        <View style={{ flex: 1, backgroundColor: theme.background }}>
          <FlatList
            data={TRANSACTIONS}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={Header}
            ListFooterComponent={Footer} 
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

           <TouchableOpacity 
            style={[styles.fab, { backgroundColor: theme.secondary }]}
            onPress={onNavigateToAdd}
           >
            <Ionicons name='add' size={32} color='white' />
          </TouchableOpacity>

          <View style={[styles.bottomBar, { backgroundColor: theme.primary }]} />
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: { height: 80, marginTop: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, width: '100%' },
  menuButton: { padding: 5 },
  navIcon: { height: 60, width: 200 },
  listContent: { paddingBottom: 100 },
  headerContainer: { paddingHorizontal: 20, paddingTop: 20 },
  greetingContainer: { marginBottom: 20 },
  greetingText: { fontSize: 24, fontWeight: 'bold', fontFamily: 'Poppins_700Bold' },
  subGreetingText: { fontSize: 14, marginTop: 4 },
  chartPlaceholder: { height: 200, width: '100%', backgroundColor: '#D3D3D3', marginBottom: 20 },
  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', fontFamily: 'Poppins_700Bold' },
  filterButton: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 5 },
  columnHeaderRow: { flexDirection: 'row', paddingVertical: 10, borderWidth: 1, borderRadius: 12, marginBottom: 10, backgroundColor: 'white', alignItems: 'center' },
  columnHeaderText: { fontSize: 16, fontWeight: '600', color: 'black' },
  transactionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 10, marginHorizontal: 20, marginBottom: 10, borderRadius: 12, borderWidth: 1, backgroundColor: 'white' },
  deleteButton: { position: 'absolute', top: -10, right: -10, zIndex: 1, backgroundColor: 'white', borderRadius: 10 },
  colName: { flex: 2, alignItems: 'center' },
  colCategory: { flex: 2, alignItems: 'center' },
  colAmount: { flex: 1, alignItems: 'center' },
  transactionText: { fontSize: 14 },
  fab: { position: 'absolute', bottom: 50, right: 20, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', zIndex: 10, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  bottomBar: { height: 60, width: '100%', position: 'absolute', bottom: 0 },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'black' },
  sidebarContainer: { width: SIDEBAR_WIDTH, height: '100%', shadowColor: '#000', shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.25, shadowRadius: 5, elevation: 5, backgroundColor: 'white', position: 'absolute', left: 0 },
  sidebarHeader: { height: 120, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 40, paddingHorizontal: 20, backgroundColor: '#F5F5F5' },
  sidebarMenuButton: { position: 'absolute', left: 20, top: 55, zIndex: 10, padding: 10 },
  sidebarLogoContainer: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  sidebarIcon: { height: 60, width: 200 },
  sidebarContent: { flex: 1, padding: 20, backgroundColor: 'white' },
  sidebarButton: { paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
  sidebarButtonText: { fontSize: 18, fontWeight: 'bold', color: '#6B4EFF', fontFamily: 'Poppins_700Bold' },
});
