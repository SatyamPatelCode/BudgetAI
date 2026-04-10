import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Dimensions,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SimpleLineIcons, Ionicons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Colors from '../constants/Colors';
import { useAuth, useUser, useClerk } from '@clerk/clerk-expo';
import { createAuthenticatedSupabaseClient } from '../lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

const logo = require('../../assets/BudgetAI_BWTransparent.png');

const { width } = Dimensions.get('window');   
const SIDEBAR_WIDTH = width * 0.75;

interface AddTransactionScreenProps {
  onNavigateHome: () => void;
  onNavigateToHistory?: () => void;
  onNavigateToSettings?: () => void;
  theme: any;
  aiSpecificity: 'Broad' | 'Normal' | 'Specific';
}

export default function AddTransactionScreen({ onNavigateHome, onNavigateToHistory, onNavigateToSettings, theme, aiSpecificity }: AddTransactionScreenProps) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  
  const [useAI, setUseAI] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [showAIInfo, setShowAIInfo] = useState(false);
  const [name, setName] = useState('');
  const sidebarAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current; 
  const isSidebarOpenRef = useRef(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [cost, setCost] = useState('');
  const [category, setCategory] = useState('');

  const fetchRecentTransactions = useCallback(async () => {
    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) return;

      const supabase = createAuthenticatedSupabaseClient(token);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4); // Changed from 5 to 4 to match HomeScreen

      if (error) throw error;
      setRecentTransactions(data || []);
    } catch (err) {
      console.error('Error fetching recent transactions:', err);
    }
  }, [getToken]);

  useEffect(() => {
    fetchRecentTransactions();
  }, [fetchRecentTransactions]);

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
            {['Home', 'History', 'Recap', 'Settings', 'Log Out'].map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.sidebarButton, { backgroundColor: theme.primary }]}
                onPress={() => {
                   if (item === 'Home') {
                       toggleSidebar(false);
                       onNavigateHome();
                   } else if (item === 'History') {
                       toggleSidebar(false);
                       onNavigateToHistory?.();
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
      setRecentTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      Alert.alert('Error', 'Failed to delete transaction');
    }
  };

  const handleAddTransaction = async () => {
    if (!name || !cost || (!category && !useAI)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const token = await getToken({ template: 'supabase' });
      if (!token) {
        Alert.alert('Error', 'Could not authenticate with database');
        return;
      }
      
      const supabase = createAuthenticatedSupabaseClient(token);
      
      let finalCategory = category;

      // 🤖 --- AI CATEGORIZATION LOGIC --- 🤖
      if (useAI) {
        try {
          // 1. Fetch user's existing unique categories for context
          const { data: existingData } = await supabase
            .from('transactions')
            .select('category');
          
          const existingCategories = existingData 
            ? [...new Set(existingData.map(t => t.category).filter(Boolean))] 
            : [];

          // 2. Formulate the strict prompt so Gemini knows exactly what to do
          const specificityInstructions = 
            aiSpecificity === 'Broad' ? "Create a very broad, general category (e.g., 'Food', 'Transportation', 'Entertainment')." :
            aiSpecificity === 'Specific' ? "Create a very specific, detailed category based on the exact item or store (e.g., 'Fast Food', 'Gas Station', 'Movie Tickets')." :
            "Create a moderately specific category that balances general grouping with some detail.";

          const prompt = `You are a financial categorizer. The user just purchased "${name}" for $${cost}. Their existing financial categories are: [${existingCategories.join(', ')}]. 
          Task: Pick the best matching existing category from the list. If none perfectly fit, generate a new, concise category name (maximum 2-3 words, Title Case). 
          Specificity Preference: ${specificityInstructions}
          Constraint: Reply ONLY with the exact exact category name string, no punctuation, no conversational filler.`;

          // 3. Call Gemini using a raw fetch request (Bypasses React Native SDK polyfill issues)
          const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
          
          if (!apiKey) {
             throw new Error("Missing Gemini API Key");
          }

          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: prompt }]
              }],
              generationConfig: {
                temperature: 0.2
              }
            })
          });

          const aiData = await response.json();
          
          if (aiData.error) {
             throw new Error(aiData.error.message || "Unknown Gemini Error");
          }

          const generatedCategory = aiData.candidates[0].content.parts[0].text.replace(/["'\n]/g, "").trim();
          
          finalCategory = generatedCategory || 'Uncategorized';
        } catch (aiError: any) {
          console.error("AI Error:", aiError);
          // Alert the user so they can see the exact error if it fails again
          Alert.alert("AI Categorization Failed", aiError.message);
          finalCategory = 'Manual Review Required'; 
        }
      }

      const { error } = await supabase.from('transactions').insert({
         user_id: user?.id,
         name,
         amount: parseFloat(cost),
         category: finalCategory,
      });

      if (error) {
        throw error;
      }

      // Refresh the list and clear inputs
      await fetchRecentTransactions();
      
      setName('');
      setCost('');
      setCategory('');
      
      // Optional: Inform user briefly or just show it in the list
      // Alert.alert('Success', 'Transaction added'); 

    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleCameraScan = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera access is required to scan receipts.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
         mediaTypes: 'images',
         allowsEditing: true,
         quality: 0.7,
         base64: true
      });

      if (result.canceled || !result.assets || !result.assets[0].base64) {
         return;
      }

      setCameraLoading(true);

      const base64Image = result.assets[0].base64;
      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      
      if (!apiKey) {
         throw new Error("Missing Gemini API Key");
      }

      // Call Gemini for Image Analysis
      const prompt = `You are a receipt extraction AI. Analyze the image to find any purchased items and their prices.
      If it's a receipt with multiple items, return a JSON array of objects, EACH with a 'name', 'amount' (number), and a generated 'category' (string).
      If it's a single item with a price tag, return a JSON array with one object containing 'name', 'amount', and 'category'.
      If you CANNOT find an identifiable object with a price or a receipt, return {"error": "Could not identify an item or price from the image."}.
      DO NOT return markdown code blocks, ONLY valid JSON.
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            contents: [{
               parts: [
                  { text: prompt },
                  { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
               ]
            }],
            generationConfig: { temperature: 0.1 }
         })
      });

      const aiData = await response.json();
      if (aiData.error) {
         throw new Error(aiData.error.message || "Unknown Gemini Error");
      }

      let rawText = aiData.candidates[0].content.parts[0].text;
      // Strip markdown codeblocks if Gemini added them
      rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      
      let parsedData;
      try {
         parsedData = JSON.parse(rawText);
      } catch (e) {
         throw new Error("AI returned invalid data format.");
      }

      if (parsedData.error) {
         throw new Error(parsedData.error);
      }

      const items = Array.isArray(parsedData) ? parsedData : [parsedData];
      
      if (!items.length || !items[0].name || items[0].amount === undefined) {
         throw new Error("Could not extract valid item and price data from image.");
      }

      const token = await getToken({ template: 'supabase' });
      if (!token) throw new Error("Could not authenticate with database.");
      
      const supabase = createAuthenticatedSupabaseClient(token);

      for (const item of items) {
         const { error } = await supabase.from('transactions').insert({
            user_id: user?.id,
            name: item.name,
            amount: parseFloat(item.amount),
            category: item.category || 'Uncategorized',
         });
         if (error) throw error;
      }

      Alert.alert('Scan Complete', `Successfully added ${items.length} transaction(s).`);
      await fetchRecentTransactions();

    } catch (error: any) {
       console.error("Camera Scan Error:", error);
       Alert.alert("Scan Error", error.message || "An error occurred while scanning.");
    } finally {
       setCameraLoading(false);
    }
  };

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

        {/* Content */}
        <View style={[styles.contentContainer, { backgroundColor: theme.background }]}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            
            <Text style={[styles.sectionTitle, { color: theme.secondary }]}>
              Add a transaction:
            </Text>

            {/* Input Fields */}
            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.input, { borderColor: theme.secondary, color: theme.text, backgroundColor: theme.card }]}
                placeholder="Name"
                placeholderTextColor={theme.secondary}
                value={name}
                onChangeText={setName}
              />
              
              <TextInput
                style={[styles.input, { borderColor: theme.secondary, color: theme.text, backgroundColor: theme.card }]}
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
                    { flex: 1, marginRight: 10, borderColor: theme.secondary, color: theme.text, backgroundColor: theme.card },
                    useAI && [styles.categoryDisabled, { backgroundColor: theme.background, color: theme.textSecondary }]
                  ]}
                  placeholder="Category"
                  placeholderTextColor={useAI ? theme.textSecondary : theme.secondary}
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
                  <Text style={[styles.aiInfoText, { marginTop: 4, fontStyle: 'italic' }]}>
                    Customize in Settings
                  </Text>
                </View>
              )}

              <View style={styles.actionRowContainer}>
                <TouchableOpacity 
                  style={[styles.cameraButton, { backgroundColor: 'transparent', borderColor: theme.secondary }]}
                  onPress={handleCameraScan}
                  disabled={cameraLoading}
                >
                  {cameraLoading ? (
                     <ActivityIndicator color={theme.secondary} />
                  ) : (
                     <Feather name="camera" size={24} color={theme.text} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.addButton, { backgroundColor: theme.secondary, flex: 1, marginLeft: 15 }]}
                  onPress={handleAddTransaction}
                  disabled={loading}
                >
                  {loading ? (
                     <ActivityIndicator color="white" />
                  ) : (
                     <Text style={styles.addButtonText}>Add</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Recent Transactions Section */}
            <View style={styles.listHeaderRow}>
               <Text style={[styles.sectionTitle, { color: theme.secondary, marginTop: 20 }]}>
                 Recent Transactions:
               </Text>
               <TouchableOpacity 
                   style={[styles.filterButton, { borderColor: theme.secondary, marginTop: 15 }]}
                   onPress={onNavigateToHistory}
                >
                  <Text style={{ color: theme.secondary }}>View More</Text>
                </TouchableOpacity>
            </View>

            {/* Header Row */}
             <View style={[styles.recentItemContainer, { borderColor: theme.secondary, backgroundColor: theme.card }]}>
                  <View style={styles.recentItemContent}>
                    <Text style={[styles.recentItemText, { fontWeight: 'bold', color: theme.text }]}>Name</Text>
                    <Text style={[styles.recentItemText, { fontWeight: 'bold', color: theme.text }]}>Category</Text>
                    <Text style={[styles.recentItemText, { fontWeight: 'bold', color: theme.text }]}>Cost</Text>
                  </View>
             </View>

            {/* Dynamic Data Rows */}
            {recentTransactions.map((item) => (
              <View key={item.id} style={[styles.recentItemContainer, { borderColor: theme.secondary, backgroundColor: theme.card }]}>
                  <View style={styles.recentItemContent}>
                    <Text style={[styles.recentItemText, { flex: 1, color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={[styles.recentItemText, { flex: 1, textAlign: 'center', color: theme.text }]} numberOfLines={1}>{item.category || '-'}</Text>
                    <Text style={[styles.recentItemText, { flex: 1, textAlign: 'right', color: theme.text }]}>${item.amount?.toFixed(2)}</Text>
                  </View>
                
                  <TouchableOpacity style={[styles.deleteCircle, { borderColor: theme.card }]} onPress={() => handleDelete(item.id)}>
                     <Ionicons name="close" size={12} color="white" />
                  </TouchableOpacity>
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
  actionRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  cameraButton: {
    width: 60,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterButton: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 5,
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
    color: '#5E5CE6', 
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
