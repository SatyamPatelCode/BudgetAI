import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useUser, useClerk } from '@clerk/clerk-expo';
import { Button } from 'react-native';

export default function HomeScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to BudgetAI</Text>
      <Text style={styles.email}>Signed in as: {user?.primaryEmailAddress?.emailAddress}</Text>
      <Button title="Sign Out" onPress={() => signOut()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  email: {
    fontSize: 16,
    marginBottom: 20,
  },
});
