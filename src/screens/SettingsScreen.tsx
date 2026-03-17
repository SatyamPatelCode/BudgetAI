import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SimpleLineIcons, Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface SettingsScreenProps {
  onNavigateHome: () => void;
  theme: any;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

export default function SettingsScreen({ onNavigateHome, theme, toggleTheme, isDarkMode }: SettingsScreenProps) {
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={onNavigateHome} style={styles.backButton}>
           <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Full Icon BW</Text>
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
  );
}

const styles = StyleSheet.create({
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
