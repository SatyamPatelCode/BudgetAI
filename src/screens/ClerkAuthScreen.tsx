import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Button, Linking } from 'react-native';
import * as ClerkExpo from '@clerk/clerk-expo';

console.log('ClerkExpo exports:', Object.keys(ClerkExpo));

export default function ClerkAuthScreen() {
  useEffect(() => {
    // helpful runtime log
    console.log('ClerkExpo runtime exports:', Object.keys(ClerkExpo));
  }, []);

  const SignInButton = (ClerkExpo as any).SignInButton;
  const SignUpButton = (ClerkExpo as any).SignUpButton;
  const UserButton = (ClerkExpo as any).UserButton;

  const openClerkWeb = () => {
    // fallback: open Clerk hosted sign-in page (adjust to your Clerk app URL if needed)
    Linking.openURL('https://clerk.com/sign-in');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in or Create an account</Text>

      <View style={{ height: 16 }} />

      {SignInButton ? (
        <SignInButton />
      ) : (
        <Button title="Open Clerk Sign In (web)" onPress={openClerkWeb} />
      )}

      <View style={{ height: 12 }} />

      {SignUpButton ? (
        <SignUpButton />
      ) : (
        <Button title="Open Clerk Sign Up (web)" onPress={openClerkWeb} />
      )}

      <View style={{ height: 20 }} />
      <Text style={{ textAlign: 'center' }}>After signing in, open the account menu:</Text>
      <View style={{ height: 12 }} />

      {UserButton ? (
        <UserButton />
      ) : (
        <Text style={{ textAlign: 'center', marginTop: 8 }}>User menu not available in this SDK build</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
});