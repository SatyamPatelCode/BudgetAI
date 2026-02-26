import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import { StatusBar } from 'expo-status-bar';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-expo';
import { tokenCache } from './cache';
import SignInScreen from './src/screens/SignInScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import { View } from 'react-native';

const PUBLISHABLE_KEY =
  (process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY as string) ||
  (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY as string) ||
  '';

if (!PUBLISHABLE_KEY) {
  console.warn('Missing Clerk publishable key. Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env');
}

export default function App() {
  const [showSignUp, setShowSignUp] = useState(false);

  return (
    <SafeAreaProvider>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} tokenCache={tokenCache}>
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
      </ClerkProvider>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
