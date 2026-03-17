import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import Colors from '../constants/Colors';

export default function SignUpScreen({ onSignInPress, theme }: { onSignInPress: () => void, theme: typeof Colors.light }) {
  const { isLoaded, signUp, setActive } = useSignUp();
  
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    setErrorMessage('');

    try {
      await signUp.create({
        emailAddress,
        password,
        username,
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      const msg = err.errors ? err.errors[0].message : err.message;
      setErrorMessage(msg);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) return;
    setErrorMessage('');

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({ code });
      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
      } else {
        setErrorMessage('Verification failed. Please try again.');
      }
    } catch (err: any) {
      const msg = err.errors ? err.errors[0].message : err.message;
      setErrorMessage(msg);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {!pendingVerification && (
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Sign up to get started with BudgetAI</Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Username</Text>
              <TextInput
                autoCapitalize="none"
                value={username}
                placeholder="Choose a username"
                placeholderTextColor={theme.textSecondary}
                onChangeText={(username) => setUsername(username)}
                style={[styles.input, { backgroundColor: theme.card, borderColor: theme.secondary, color: theme.text }]}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Email</Text>
              <TextInput
                autoCapitalize="none"
                value={emailAddress}
                placeholder="Enter your email"
                placeholderTextColor={theme.textSecondary}
                onChangeText={(email) => setEmailAddress(email)}
                style={[styles.input, { backgroundColor: theme.card, borderColor: theme.secondary, color: theme.text }]}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Password</Text>
              <TextInput
                value={password}
                placeholder="Create a password"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry={true}
                onChangeText={(password) => setPassword(password)}
                style={[styles.input, { backgroundColor: theme.card, borderColor: theme.secondary, color: theme.text }]}
              />
            </View>

            {errorMessage ? (
              <View style={[styles.errorContainer, { borderColor: theme.error, backgroundColor: theme.card }]}>
                <Text style={[styles.errorText, { color: theme.error }]}>{errorMessage}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={onSignUpPress}>
              <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>
            
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.textSecondary }]}>Already have an account?</Text>
              <TouchableOpacity onPress={onSignInPress}>
                <Text style={[styles.footerLink, { color: theme.primary }]}>Sign In</Text>
              </TouchableOpacity>
            </View>
            {Platform.OS === 'web' && <View nativeID="clerk-captcha" />}
          </View>
        )}

        {pendingVerification && (
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Verify Email</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>We've sent a verification code to your email.</Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Verification Code</Text>
              <TextInput
                value={code}
                placeholder="Enter 6-digit code"
                placeholderTextColor={theme.textSecondary}
                onChangeText={(code) => setCode(code)}
                style={[styles.input, { backgroundColor: theme.card, borderColor: theme.secondary, color: theme.text }]}
                keyboardType="number-pad"
              />
            </View>

            {errorMessage ? (
              <View style={[styles.errorContainer, { borderColor: theme.error, backgroundColor: theme.card }]}>
                <Text style={[styles.errorText, { color: theme.error }]}>{errorMessage}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={onPressVerify}>
              <Text style={styles.buttonText}>Verify Email</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9' },
    scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    title: { fontSize: 32, fontWeight: 'bold', marginBottom: 8, color: '#333', textAlign: 'center' },
    subtitle: { fontSize: 16, color: '#666', marginBottom: 32, textAlign: 'center' },
    inputContainer: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', padding: 16, borderRadius: 12, fontSize: 16, color: '#333' },
    errorContainer: { backgroundColor: '#ffebee', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#ffcdd2' },
    errorText: { color: '#FF453A', fontSize: 14, textAlign: 'center' },
    button: { backgroundColor: '#00D09C', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    footer: { flexDirection: 'row', marginTop: 24, justifyContent: 'center', alignItems: 'center' },
    footerText: { color: '#666', fontSize: 14 },
    footerLink: { color: '#00D09C', fontSize: 14, fontWeight: 'bold', marginLeft: 4 }
});
