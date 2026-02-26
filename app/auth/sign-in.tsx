import React, { useState } from 'react'
import { View, Text, TextInput, Button, StyleSheet } from 'react-native'
import { useSignIn } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
import ClerkAuthScreen from '../../src/screens/ClerkAuthScreen'

export default function SignInRoute() {
  return <ClerkAuthScreen />
}

export function SignInScreen() {
  const router = useRouter()
  const { isLoaded, signIn } = useSignIn()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const handleSignIn = async () => {
    if (!isLoaded) return
    setMessage(null)
    try {
      // Attempt to create a sign-in with email and password
      await signIn.create({ identifier: email, password })

      // On success, navigate to home
      router.replace('/')
    } catch (err: any) {
      setMessage(err?.message || 'Sign in failed')
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />

      <Button title="Sign in" onPress={handleSignIn} />

      <View style={{ marginTop: 12 }}>
        <Button title="Create an account" onPress={() => router.push('/auth/sign-up')} />
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  message: {
    marginTop: 12,
    textAlign: 'center',
    color: 'red',
  },
})
