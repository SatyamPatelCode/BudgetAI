import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-expo';
import { Slot } from 'expo-router';
import { tokenCache } from '../cache';
import SignInScreen from '../src/screens/SignInScreen';
import SignUpScreen from '../src/screens/SignUpScreen';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key');
}

export default function RootLayout() {
  const [showSignUp, setShowSignUp] = useState(false);

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <SafeAreaProvider>
        <SignedIn>
          <Slot />
        </SignedIn>
        <SignedOut>
           {showSignUp ? (
            <SignUpScreen onSignInPress={() => setShowSignUp(false)} />
          ) : (
             <SignInScreen onSignUpPress={() => setShowSignUp(true)} />
          )}
        </SignedOut>
      </SafeAreaProvider>
    </ClerkProvider>
  );
}
