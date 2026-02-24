import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { supabase } from '../lib/supabaseClient.js'; // keep supabase for DB
import { TouchableOpacity } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';

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
  const theme = Colors.light;
  const { signOut } = useAuth();

  // 🔌 Supabase connection test
  useEffect(() => {
    (async () => {
      console.log('▶️ testing supabase...');
      const { data, error } = await supabase
        .from('transactions') // ⬅️ replace with your real table name
        .select('*')
        .limit(1);

      console.log('✅ supabase result:', { data, error });
    })();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (e) {
      console.warn('Clerk signOut error', e);
      // fallback to supabase sign out
      try { await supabase.auth.signOut(); } catch (err) {}
    }
  };

  const renderTransaction = ({ item }: { item: typeof TRANSACTIONS[0] }) => (
    <View style={[styles.transactionRow, { backgroundColor: theme.card }]}>
      <View style={styles.transactionInfo}>
        <Text style={[styles.transactionName, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.transactionCategory, { color: theme.textSecondary }]}>{item.category}</Text>
      </View>
      <Text style={[styles.transactionAmount, { color: theme.text }]}>
        ${item.amount.toFixed(2)}
      </Text>
    </View>
  );

  const Header = () => (
    <View style={styles.headerContainer}>
      <View style={styles.greetingContainer}>
        <Text style={[styles.greetingText, { color: theme.text }]}>Hello Satyam,</Text>
        <Text style={[styles.subGreetingText, { color: theme.textSecondary }]}>
          Here is your spending overview
        </Text>
      </View>

      <View style={[styles.chartPlaceholder, { backgroundColor: theme.card }]}>
        <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
          [ Current Spending Chart ]
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Recent Transactions
      </Text>
    </View>
  );

  const Footer = () => (
    <View style={styles.footerContainer}>
      <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
        [ Footer Placeholder ]
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['right', 'left']}
    >
      <StatusBar barStyle="dark-content" />

      <View style={[styles.navBar, { borderBottomColor: '#e0e0e0' }]}
      >
        <Text style={[styles.navTitle, { color: theme.text }]}>BudgetAI</Text>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={{ color: theme.textSecondary }}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={TRANSACTIONS}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={Header}
        ListFooterComponent={Footer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
    marginTop: 30,
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'left',
  },
  signOutButton: {
    padding: 8,
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 40,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  greetingContainer: {
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subGreetingText: {
    fontSize: 16,
    marginTop: 4,
  },
  chartPlaceholder: {
    height: 200,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionCategory: {
    fontSize: 14,
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeholderText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  footerContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
});
