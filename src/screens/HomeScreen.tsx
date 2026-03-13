import React, { useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Dimensions, 
  Animated, 
  TouchableOpacity,
  TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';
import { useUser, useClerk } from '@clerk/clerk-expo';

const TRANSACTIONS = [
  { id: '1', name: 'Grocery Store', category: 'Food', amount: 45.50, date: 'Today' },
  { id: '2', name: 'Uber Ride', category: 'Transport', amount: 12.25, date: 'Yesterday' },
  { id: '3', name: 'Netflix', category: 'Entertainment', amount: 15.00, date: 'Yesterday' },
  { id: '4', name: 'Coffee Shop', category: 'Food', amount: 5.75, date: 'Feb 24' },
  { id: '5', name: 'Gym Membership', category: 'Health', amount: 30.00, date: 'Feb 20' },
  { id: '6', name: 'Electric Bill', category: 'Bills', amount: 120.00, date: 'Feb 15' },
];

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75; 

export default function HomeScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  // Use the Colors object directly, assuming light mode preference or hook
  const theme = Colors.light; 

  // Sidebar Animations
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

  const renderTransaction = ({ item }: { item: typeof TRANSACTIONS[0] }) => (
    <View style={[styles.transactionCard, { backgroundColor: theme.card }]}>
      <View style={[styles.iconPlaceholder, { backgroundColor: theme.background }]}>
        <Text style={[styles.iconText, { color: theme.secondary }]}>{item.category[0]}</Text>
      </View>
      <View style={styles.transactionDetails}>
        <Text style={[styles.transactionTitle, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.transactionCategory, { color: theme.textSecondary }]}>{item.category}</Text>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[styles.transactionAmount, { color: theme.text }]}>-${item.amount.toFixed(2)}</Text>
        <Text style={[styles.transactionDate, { color: theme.textSecondary }]}>{item.date}</Text>
      </View>
    </View>
  );

  const Header = () => (
    <View style={styles.headerContainer}>
      <View style={styles.greetingContainer}>
        <Text style={[styles.greetingText, { color: theme.text }]}>Hello, {user?.firstName || user?.username || 'User'}</Text>
        <Text style={[styles.subGreetingText, { color: theme.textSecondary }]}>Here is your spending overview</Text>
      </View>

      <View style={[styles.chartPlaceholder, { backgroundColor: theme.card }]}>
        <Text style={{ color: theme.textSecondary }}>[ Spending Chart ]</Text>
      </View>

      <View style={styles.listHeaderRow}>
         <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Transactions</Text>
         <TouchableOpacity style={[styles.filterButton, { backgroundColor: theme.card, borderColor: theme.background }]}>
            <Text style={{ color: theme.textSecondary }}>Filter</Text>
         </TouchableOpacity>
      </View>
    </View>
  );

  const SidebarContent = () => (
    <View style={styles.sidebarContent}>
      <View style={styles.sidebarHeader}>
         <Text style={[styles.sidebarTitle, { color: theme.text }]}>Menu</Text>
      </View>
      <TouchableOpacity style={styles.sidebarButton}>
        <Text style={[styles.sidebarButtonText, { color: theme.text }]}>Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.sidebarButton}>
        <Text style={[styles.sidebarButtonText, { color: theme.text }]}>Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.sidebarButton, { marginTop: 'auto' }]} onPress={() => signOut()}>
        <Text style={[styles.sidebarButtonText, { color: theme.error }]}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
       <View style={[styles.navBar, { backgroundColor: theme.card, borderBottomColor: theme.background }]}>
          <TouchableOpacity onPress={() => toggleSidebar(true)} style={styles.menuButton}>
             <Text style={{ fontSize: 24, color: theme.text }}>☰</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.primary }}>BudgetAI</Text>
          <View style={{ width: 24 }} /> 
       </View>

       <FlatList
        data={TRANSACTIONS}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={Header}
        contentContainerStyle={styles.listContent}
       />

       {/* Sidebar Overlay */}
       {isOverlayVisible && (
        <TouchableWithoutFeedback onPress={() => toggleSidebar(false)}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>
      )}

      {/* Sidebar Panel */}
      <Animated.View style={[styles.sidebarContainer, { transform: [{ translateX: sidebarAnim }], backgroundColor: theme.card }]}>
         <SidebarContent />
      </Animated.View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1 },
  menuButton: { padding: 5 },
  listContent: { paddingBottom: 100 },
  headerContainer: { padding: 20 },
  greetingContainer: { marginBottom: 20 },
  greetingText: { fontSize: 24, fontFamily: 'Poppins_700Bold' },
  subGreetingText: { fontSize: 14, fontFamily: 'Poppins_400Regular' },
  chartPlaceholder: { height: 200, borderRadius: 16, marginBottom: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  sectionTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold' },
  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  
  transactionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginHorizontal: 20,
  },
  iconPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins_400Regular',
  },
  transactionCategory: {
    fontSize: 14,
    marginTop: 2,
    fontFamily: 'Poppins_400Regular',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins_400Regular',
  },
  transactionDate: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Poppins_400Regular',
  },

  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10 },
  sidebarContainer: { position: 'absolute', left: 0, top: 0, bottom: 0, width: SIDEBAR_WIDTH, zIndex: 20, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 5, elevation: 5 },
  sidebarContent: { flex: 1, padding: 20 },
  sidebarHeader: { marginBottom: 30, marginTop: 40 },
  sidebarTitle: { fontSize: 24, fontFamily: 'Poppins_700Bold' },
  sidebarButton: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  sidebarButtonText: { fontSize: 16, fontFamily: 'Poppins_400Regular' }
});
