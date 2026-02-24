import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-expo';
import HomeScreen from './src/screens/HomeScreen';
import ClerkAuthScreen from './src/screens/ClerkAuthScreen';
import * as Linking from 'expo-linking';


const PUBLISHABLE_KEY =
  (process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY as string) ||
  (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY as string) ||
  '';

if (!PUBLISHABLE_KEY) {
  console.warn('Missing Clerk publishable key. Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env');
}

export default function App() {
  useEffect(() => {
    // debug deep link handling
    (async () => {
      const initialUrl = await Linking.getInitialURL();
      console.log('initial deep link:', initialUrl);
    })();

    const onUrl = (event: { url: string }) => {
      console.log('incoming deep link:', event.url);
    };
    const sub = Linking.addEventListener('url', onUrl as any);

    return () => {
      try { sub.remove(); } catch (e) {}
    };
  }, []);

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <SafeAreaProvider>
        <SignedIn>
          <HomeScreen />
        </SignedIn>

        <SignedOut>
          <ClerkAuthScreen />
        </SignedOut>

        <StatusBar style="auto" />
      </SafeAreaProvider>
    </ClerkProvider>
  );
}
