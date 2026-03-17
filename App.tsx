import React, { useEffect, useCallback, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import SignInScreen from './src/screens/SignInScreen';
import SignUpScreen from './src/screens/SignUpScreen';
// @ts-ignore: Could not find a declaration file for module
import SettingsScreen from './src/screens/SettingsScreen';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';import Colors from './src/constants/Colors';import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-expo';
import { tokenCache } from './cache';
import AddTransactionScreen from './src/screens/AddTransactionScreen';
import TransactionsScreen from './src/screens/TransactionsScreen'; // Import new screen

const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.error('Missing Clerk Publishable Key in .env');
}

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [showSignUp, setShowSignUp] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'Home' | 'AddTransaction' | 'History'>('Home'); // Updated state
  const [themeName, setThemeName] = useState<'light' | 'dark'>('dark');
  const theme = Colors[themeName];
  const isDarkMode = themeName === 'dark';

  const toggleTheme = () => {
    setThemeName(prev => prev === 'light' ? 'dark' : 'light');
  };

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY!} tokenCache={tokenCache}>
      <SafeAreaProvider onLayout={onLayoutRootView}>
        <SignedIn>
          {/* Simple navigation switch */}
          {currentScreen === 'Home' ? (
             <HomeScreen 
               onNavigateToAdd={() => setCurrentScreen('AddTransaction')} 
               onNavigateToHistory={() => setCurrentScreen('History')}
             />
          ) : currentScreen === 'AddTransaction' ? (
             <AddTransactionScreen 
               onNavigateHome={() => setCurrentScreen('Home')} 
               onNavigateToHistory={() => setCurrentScreen('History')}
             />
          ) : (
             <TransactionsScreen 
               onNavigateHome={() => setCurrentScreen('Home')} 
               onNavigateToAdd={() => setCurrentScreen('AddTransaction')}
             />
          )}
        </SignedIn>
        <SignedOut>
          {showSignUp ? (
            <SignUpScreen onSignInPress={() => setShowSignUp(false)} theme={theme} />
          ) : (
            <SignInScreen onSignUpPress={() => setShowSignUp(true)} theme={theme} />
          )}
        </SignedOut>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
      </SafeAreaProvider>
    </ClerkProvider>
  );
}
