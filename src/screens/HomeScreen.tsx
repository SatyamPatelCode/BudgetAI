import React, { useRef, useState } from 'react';
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
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { SimpleLineIcons, Ionicons } from '@expo/vector-icons';

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

export default function HomeScreen() {
  const theme = Colors.light; // Hardcoded to light for now, or use useColorScheme

  const renderTransaction = ({ item }: { item: typeof TRANSACTIONS[0] }) => (
    <View style={[styles.transactionRow, { borderColor: theme.secondary }]}>
      <TouchableOpacity style={styles.deleteButton}>
        <Ionicons name="close-circle" size={20} color={theme.error} />
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
      
      {/* Hello User Section */}
      <View style={styles.greetingContainer}>
        <Text style={[styles.greetingText, { color: theme.secondary }]}>Hello User,</Text>
        <Text style={[styles.subGreetingText, { color: theme.text }]}>Here is your spending overview</Text>
      </View>

      {/* Chart Placeholder */}
      <View style={[styles.chartPlaceholder, { backgroundColor: '#E0E0E0' }]}>
        {/* Placeholder for chart content */}
      </View>

      {/* List Title & Filter */}
      <View style={styles.listHeaderRow}>
        <Text style={[styles.sectionTitle, { color: theme.secondary }]}>Recent Transactions:</Text>
        <TouchableOpacity style={[styles.filterButton, { borderColor: theme.secondary }]}>
          <Text style={{ color: theme.secondary }}>Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Column Headers */}
      <View style={[styles.columnHeaderRow, { borderColor: theme.secondary }]}>
        <Text style={[styles.columnHeaderText, { flex: 2, textAlign: 'center' }]}>Name</Text>
        <Text style={[styles.columnHeaderText, { flex: 2, textAlign: 'center' }]}>Category</Text>
        <Text style={[styles.columnHeaderText, { flex: 1, textAlign: 'center' }]}>Cost</Text>
      </View>
    </View>
  );

  const Footer = () => (
    <View style={{ height: 80 }} /> // Spacer to prevent list content from being hidden behind FAB/BottomBar
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.primary }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />
        
        {/* Custom Nav Bar with Green Background */}
        <View style={[styles.navBar, { backgroundColor: theme.primary }]}>
          <TouchableOpacity style={styles.menuButton}>
            <SimpleLineIcons name="menu" size={24} color="black" />
          </TouchableOpacity>
          <Image source={icon} style={styles.navIcon} resizeMode="contain" />
          <View style={{ width: 24 }} /> 
        </View>

        <View style={{ flex: 1, backgroundColor: theme.background }}>
          <FlatList
            data={TRANSACTIONS}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={Header}
            ListFooterComponent={Footer} // Just a spacer if needed, footer bar is static outside list
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

           {/* Floating Action Button */}
       <TouchableOpacity 
        style={[styles.fab, { backgroundColor: theme.secondary }]}
        onPress={() => console.log('Navigate to Add Transaction')}
       >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

          {/* Bottom Green Bar */}
          <View style={[styles.bottomBar, { backgroundColor: theme.primary }]} />
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  listContent: {
    paddingBottom: 100, // Space for FAB
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  greetingContainer: {
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Poppins_700Bold', // Use Bold Poppins
  },
  subGreetingText: {
    fontSize: 14,
    marginTop: 4,
  },
  chartPlaceholder: {
    height: 200,
    width: '100%',
    borderRadius: 0, // Rectangular as per image? Or specific radius. Image looks rectangular.
    backgroundColor: '#D3D3D3',
    marginBottom: 20,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Poppins_700Bold', // Use Bold Poppins
  },
  filterButton: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  columnHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  columnHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 10,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'white',
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.1,
    // shadowRadius: 2,
    // elevation: 2,
  },
  deleteButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    zIndex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  colName: {
    flex: 2,
    alignItems: 'center',
  },
  colCategory: {
    flex: 2,
    alignItems: 'center',
  },
  colAmount: {
    flex: 1,
    alignItems: 'center',
  },
  transactionText: {
    fontSize: 14, 
  },
  fab: {
    position: 'absolute',
    bottom: 50, // Raised from 30
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  bottomBar: {
    height: 60,
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
  placeholderText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  footerContainer: {
    // Empty
  },
});
