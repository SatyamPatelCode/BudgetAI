import React, { useState } from 'react'
import { View, Text, TextInput, Button, StyleSheet } from 'react-native'
import { useSignUp } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'

export default function SignUpScreen() {
  const router = useRouter()
  const { isLoaded, signUp } = useSignUp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [stage, setStage] = useState<'form' | 'verify'>('form')
  const [message, setMessage] = useState<string | null>(null)

  const handleSignUp = async () => {
    if (!isLoaded) return
    setMessage(null)
    try {
      // Create the user with email and password
      await signUp.create({ emailAddress: email, password })

      // Send an email code for verification
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })

      setStage('verify')
      setMessage('Verification code sent to your email.')
    } catch (err: any) {
      setMessage(err?.message || 'Sign up failed')
    }
  }

  const handleVerify = async () => {
    if (!isLoaded) return
    setMessage(null)
    try {
      // Attempt verification with the code user received
      await signUp.attemptEmailAddressVerification({ code })

      // On success, redirect to home (you may want to set active session here)
      router.replace('/')
    } catch (err: any) {
      setMessage(err?.message || 'Verification failed')
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>

      {stage === 'form' ? (
        <>
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

          <Button title="Create account" onPress={handleSignUp} />
        </>
      ) : (
        <>
          <TextInput
            placeholder="Verification code"
            value={code}
            onChangeText={setCode}
            style={styles.input}
          />

          <Button title="Verify email" onPress={handleVerify} />
        </>
      )}

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
