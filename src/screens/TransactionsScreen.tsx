import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
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
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';
import { SimpleLineIcons, Ionicons } from '@expo/vector-icons';
import { useUser, useClerk, useAuth } from '@clerk/clerk-expo';
import { createAuthenticatedSupabaseClient } from '../lib/supabase';

const icon = require('../../assets/BudgetAI_BWTransparent.png');
const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75; 

interface TransactionsScreenProps {
  onNavigateHome: () => void;
  onNavigateToAdd?: () => void; // Added prop for navigation
  onNavigateToSettings?: () => void;
  theme: any;
}

export default function TransactionsScreen({ onNavigateHome, onNavigateToAdd, onNavigateToSettings, theme }: TransactionsScreenProps) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterOption, setFilterOption] = useState<'none' | 'amountAsc' | 'amountDesc' | 'nameAsc' | 'nameDesc' | 'dateNew' | 'dateOld'>('none');
  const [minAmount, setMinAmount] = useState<string>('');

  const sidebarAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current; 
  const isSidebarOpenRef = useRef(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) return;

      const supabase = createAuthenticatedSupabaseClient(token);
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Derived, filtered + sorted list
  const displayTransactions = useMemo(() => {
    let list = [...transactions];

    // apply minAmount filter if provided
    const min = parseFloat(minAmount);
    if (!isNaN(min)) {
      list = list.filter(t => Number(t.amount) >= min);
    }

    // apply sorting
    switch (filterOption) {
      case 'amountAsc':
        list.sort((a,b) => Number(a.amount) - Number(b.amount));
        break;
      case 'amountDesc':
        list.sort((a,b) => Number(b.amount) - Number(a.amount));
        break;
      case 'nameAsc':
        list.sort((a,b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'nameDesc':
        list.sort((a,b) => (b.name || '').localeCompare(a.name || ''));
        break;
      case 'dateNew':
        list.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'dateOld':
        list.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      default:
        // default keep original order (server-provided)
        break;
    }

    return list;
  }, [transactions, filterOption, minAmount]);

  const applyFilterAndClose = () => {
    setFilterModalVisible(false);
  };

  const resetFilters = () => {
    setFilterOption('none');
    setMinAmount('');
  };

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

  // Simplified PanResponder for sidebar
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
          
          <View style={[styles.sidebarContent, { backgroundColor: theme.background }]}>
             {/* Sidebar Menu Items */}
            {['Home', 'History', 'Recap', 'Settings', 'Log Out'].map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.sidebarButton, { backgroundColor: theme.primary }]}
                onPress={() => {
                   if (item === 'Home') {
                       toggleSidebar(false);
                       onNavigateHome();
                   } else if (item === 'Settings') {
                       toggleSidebar(false);
                       onNavigateToSettings?.();
                   } else if (item === 'Log Out') {
                       signOut();
                   } else {
                       toggleSidebar(false);
                   }
                }}
              >
                <Text style={styles.sidebarButtonText}>{item}</Text>
              </TouchableOpacity>
            ))}

            {/* Credits Section */}
            <View style={{ marginTop: 'auto', alignItems: 'center', paddingBottom: 20 }}>
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 4 }}>Created by Satyam Patel & Emmanuel Usman</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: 'bold' }}>A RCOS Project</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    );
  };

  const handleDelete = async (id: string) => {
    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) return;
      
      const supabase = createAuthenticatedSupabaseClient(token);
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      
      if (error) throw error;
      
      // Optimistic update
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      Alert.alert('Error', 'Failed to delete transaction');
    }
  };

  const renderTransaction = ({ item }: { item: any }) => (
    <View style={[styles.transactionRow, { borderColor: theme.secondary, backgroundColor: theme.card }]}>
      <View style={styles.colName}>
        <Text style={[styles.transactionText, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
      </View>
      <View style={styles.colCategory}>
        <Text style={[styles.transactionText, { color: theme.textSecondary }]} numberOfLines={1}>{item.category}</Text>
      </View>
      <View style={styles.colAmount}>
        <Text style={[styles.transactionText, { color: theme.text, fontWeight: 'bold' }]}>
          ${typeof item.amount === 'number' ? item.amount.toFixed(2) : item.amount}
        </Text>
      </View>
      
      <TouchableOpacity style={[styles.deleteCircle, { borderColor: theme.card }]} onPress={() => handleDelete(item.id)}>
         <Ionicons name="close" size={12} color="white" />
      </TouchableOpacity>
    </View>
  );

  const Footer = () => (
    <View style={{ height: 40 }} />
  );

  const Header = () => (
    <View style={styles.headerContainer}>
      <View style={styles.listHeaderRow}>
        <Text style={[styles.sectionTitle, { color: theme.secondary }]}>All Transactions</Text>
        <TouchableOpacity style={[styles.filterButton, { borderColor: theme.secondary }]} onPress={() => setFilterModalVisible(true)}>
          <Text style={{ color: theme.secondary }}>Filter</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.columnHeaderRow, { borderColor: theme.secondary }]}>
        <Text style={[styles.columnHeaderText, { flex: 2, textAlign: 'center', color: theme.secondary }]}>Name</Text>
        <Text style={[styles.columnHeaderText, { flex: 2, textAlign: 'center', color: theme.secondary }]}>Category</Text>
        <Text style={[styles.columnHeaderText, { flex: 1, textAlign: 'center', color: theme.secondary }]}>Cost</Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.primary }} {...panResponder.panHandlers}>
      {renderSidebar()}
      
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <StatusBar barStyle='dark-content' />
        
        <View style={[styles.navBar, { backgroundColor: theme.primary }]}>
          <TouchableOpacity style={styles.menuButton} onPress={() => toggleSidebar(true)}>
            <SimpleLineIcons name='menu' size={24} color='black' />
          </TouchableOpacity>
          <TouchableOpacity onPress={onNavigateHome}>
             <Image source={icon} style={styles.navIcon} resizeMode='contain' />
          </TouchableOpacity>
          <View style={{ width: 24 }} /> 
        </View>

        <View style={{ flex: 1, backgroundColor: theme.background }}>
          <FlatList
            data={displayTransactions}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={Header}
            ListFooterComponent={Footer} 
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTransactions(); }} />
            }
          />

          {/* Filter Modal */}
          <Modal visible={filterModalVisible} animationType='slide' transparent onRequestClose={() => setFilterModalVisible(false)}>
            <TouchableWithoutFeedback onPress={() => setFilterModalVisible(false)}>
              <View style={styles.modalBackdrop} />
            </TouchableWithoutFeedback>
            
            <View style={[styles.modalContainer, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.secondary, padding: 16 }]}>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)} style={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}>
                <Ionicons name="close" size={24} color={theme.secondary} />
              </TouchableOpacity>
              
              <Text style={[styles.modalTitle, { color: theme.secondary, fontSize: 20, textAlign: 'center', marginBottom: 5 }]}>Filter Transactions</Text>

                <Text style={{ color: theme.secondary, marginTop: 8, fontWeight: '700', fontSize: 16 }}>Sort By</Text>
                {[
                  { key: 'none', label: 'None' },
                  { key: 'amountAsc', label: 'Amount: Low → High' },
                  { key: 'amountDesc', label: 'Amount: High → Low' },
                  { key: 'nameAsc', label: 'Name: A → Z' },
                  { key: 'nameDesc', label: 'Name: Z → A' },
                  { key: 'dateNew', label: 'Date: Newest First' },
                  { key: 'dateOld', label: 'Date: Oldest First' }
                ].map(opt => (
                  <TouchableOpacity key={opt.key} style={[styles.modalOption, filterOption === opt.key ? { backgroundColor: theme.secondary } : null, { borderWidth: 1, borderColor: theme.secondary }]} onPress={() => setFilterOption(opt.key as any)}>
                    <Text style={{ color: filterOption === opt.key ? 'white' : theme.primary, fontWeight: filterOption === opt.key ? 'bold' : 'normal' }}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}

                <Text style={{ color: theme.secondary, marginTop: 16, fontWeight: '700', fontSize: 16 }}>Minimum Amount (optional)</Text>
                <TextInput
                  value={minAmount}
                  onChangeText={setMinAmount}
                  placeholder="$0.00"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType='numeric'
                  style={[styles.input, { marginTop: 8, borderColor: theme.secondary, color: theme.primary, backgroundColor: theme.background, fontWeight: 'bold' }]}
                />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                  <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.secondary }]} onPress={() => { resetFilters(); applyFilterAndClose(); }}>
                    <Text style={{ color: theme.secondary, fontWeight: '600' }}>Reset</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.secondary }]} onPress={() => applyFilterAndClose()}>
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
          </Modal>

          <TouchableOpacity 
            style={[styles.fab, { backgroundColor: theme.secondary }]}
            onPress={onNavigateToAdd}
           >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>

          <View style={[styles.bottomBar, { backgroundColor: theme.primary }]} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: { height: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, width: '100%' },
  menuButton: { padding: 5 },
  navIcon: { height: 60, width: 200 },
  listContent: { paddingBottom: 100 },
  headerContainer: { paddingHorizontal: 20, paddingTop: 20 },
  greetingContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
  },
  subGreetingText: {
    fontSize: 13,
    color: '#6b7280',
  },
  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 24, fontWeight: 'bold', fontFamily: 'Poppins_700Bold' },
  filterButton: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 5 },
  columnHeaderRow: { flexDirection: 'row', paddingVertical: 10, borderWidth: 1, borderRadius: 12, marginBottom: 10, backgroundColor: 'transparent', alignItems: 'center' },
  columnHeaderText: { fontSize: 16, fontWeight: '600' },
  transactionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 10, marginHorizontal: 20, marginBottom: 10, borderRadius: 12, borderWidth: 1, backgroundColor: 'white' },
  colName: { flex: 2, alignItems: 'center' },
  colCategory: { flex: 2, alignItems: 'center' },
  colAmount: { flex: 1, alignItems: 'center' },
  transactionText: { fontSize: 14 },
  deleteCircle: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF453A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  fab: { position: 'absolute', bottom: 80, right: 20, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', zIndex: 10, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  bottomBar: { height: 60, width: '100%', position: 'absolute', bottom: 0 },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  sidebarContainer: { width: SIDEBAR_WIDTH, height: '100%', shadowColor: '#000', shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.25, shadowRadius: 5, elevation: 5, backgroundColor: 'white', position: 'absolute', left: 0 },
  sidebarHeader: { height: 120, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 40, paddingHorizontal: 20, backgroundColor: '#F5F5F5' },
  sidebarMenuButton: { position: 'absolute', left: 20, top: 55, zIndex: 10, padding: 10 },
  sidebarLogoContainer: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  sidebarIcon: { height: 60, width: 200 },
  sidebarContent: { flex: 1, padding: 20, backgroundColor: 'white' },
  sidebarButton: { paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
  sidebarButtonText: { fontSize: 18, fontWeight: 'bold', color: '#5E5CE6', fontFamily: 'Poppins_700Bold' },
  modalContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 6,
  },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  modalOption: { padding: 12, borderRadius: 8, marginTop: 8 },
  modalButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  input: { borderWidth: 1, padding: 10, borderRadius: 8 },
});
