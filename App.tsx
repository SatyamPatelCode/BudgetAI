import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { supabase } from './src/lib/supabaseClient';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';

export default function App() {
  const [session, setSession] = useState<any | null>(undefined);
  const [showSignUp, setShowSignUp] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setSession((data as any)?.session ?? null);
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
    });

    return () => {
      try {
        (listener as any)?.subscription?.unsubscribe?.();
      } catch (e) {}
    };
  }, []);

  const refreshSession = async () => {
    const { data } = await supabase.auth.getSession();
    setSession((data as any)?.session ?? null);
  };

  if (session === undefined) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator />
        </View>
      </SafeAreaProvider>
    );
  }

  if (session) {
    return (
      <SafeAreaProvider>
        <HomeScreen />
      </SafeAreaProvider>
    );
  }

  // not signed in
  return (
    <SafeAreaProvider>
      {showSignUp ? (
        <SignUpScreen onSwitchToSignIn={() => setShowSignUp(false)} />
      ) : (
        <LoginScreen onSignIn={refreshSession} onSwitchToSignUp={() => setShowSignUp(true)} />
      )}
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
