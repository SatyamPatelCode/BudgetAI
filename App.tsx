import React, { useEffect, useCallback, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import SignInScreen from './src/screens/SignInScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-expo';
import { tokenCache } from './cache';

const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.error('Missing Clerk Publishable Key in .env');
}

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [showSignUp, setShowSignUp] = useState(false);
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
          <HomeScreen />
        </SignedIn>
        <SignedOut>
          {showSignUp ? (
            <SignUpScreen onSignInPress={() => setShowSignUp(false)} />
          ) : (
            <SignInScreen onSignUpPress={() => setShowSignUp(true)} />
          )}
        </SignedOut>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </ClerkProvider>
  );
}
