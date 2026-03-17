import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';
import Colors from '../constants/Colors';

export default function SignInScreen({ onSignUpPress, theme }: { onSignUpPress: () => void, theme: typeof Colors.light }) {
  const { signIn, setActive, isLoaded } = useSignIn();
  
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Password Reset State
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const onSignInPress = async () => {
    if (!isLoaded) {
      return;
    }
    setErrorMessage(''); 

    try {
      const completeSignIn = await signIn.create({
        identifier: emailAddress,
        password,
      });
      await setActive({ session: completeSignIn.createdSessionId });
    } catch (err: any) {
      const msg = err.errors ? err.errors[0].message : err.message;
      setErrorMessage(msg);
    }
  };

  const onRequestReset = async () => {
    if (!isLoaded) return;
    setErrorMessage('');
    if (!emailAddress) {
      setErrorMessage('Please enter your email address first.');
      return;
    }

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: emailAddress,
      });
      setIsResettingPassword(true);
      setErrorMessage('');
      Alert.alert('Check your email', 'We sent you a password reset code.');
    } catch (err: any) {
      const msg = err.errors ? err.errors[0].message : err.message;
      setErrorMessage(msg);
    }
  };

  const onResetPassword = async () => {
    if (!isLoaded) return;
    setErrorMessage('');

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: resetCode,
        password: newPassword,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        setIsResettingPassword(false);
      } else {
        setErrorMessage('Verification failed. Please try again.');
      }
    } catch (err: any) {
      const msg = err.errors ? err.errors[0].message : err.message;
      setErrorMessage(msg);
    }
  };

  if (isResettingPassword) {
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={[styles.title, { color: theme.text }]}>Reset Password</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Enter the code sent to {emailAddress}</Text>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Reset Code</Text>
            <TextInput
              value={resetCode}
              placeholder="Enter 6-digit code"
              placeholderTextColor={theme.textSecondary}
              onChangeText={(code) => setResetCode(code)}
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.secondary, color: theme.text }]}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>New Password</Text>
            <TextInput
              value={newPassword}
              placeholder="Enter new password"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry={true}
              onChangeText={(pass) => setNewPassword(pass)}
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.secondary, color: theme.text }]}
            />
          </View>

          {errorMessage ? (
            <View style={[styles.errorContainer, { borderColor: theme.error, backgroundColor: theme.card }]}>
              <Text style={[styles.errorText, { color: theme.error }]}>{errorMessage}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={[styles.button, { backgroundColor: theme.secondary }]} onPress={onResetPassword}>
            <Text style={styles.buttonText}>Set New Password</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, { backgroundColor: 'transparent', marginTop: 10 }]} onPress={() => setIsResettingPassword(false)}>
            <Text style={[styles.buttonText, { color: theme.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={[styles.title, { color: theme.text }]}>Welcome Back</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Please sign in to continue</Text>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Email</Text>
          <TextInput
            autoCapitalize="none"
            value={emailAddress}
            placeholder="Enter your email"
            placeholderTextColor={theme.textSecondary}
            onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.secondary, color: theme.text }]}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Password</Text>
          <TextInput
            value={password}
            placeholder="Enter your password"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry={true}
            onChangeText={(password) => setPassword(password)}
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.secondary, color: theme.text }]}
          />
        </View>

        <TouchableOpacity onPress={onRequestReset} style={{ alignSelf: 'flex-end', marginBottom: 20 }}>
            <Text style={{ color: theme.secondary, fontSize: 14 }}>Forgot Password?</Text>
        </TouchableOpacity>

        {errorMessage ? (
          <View style={[styles.errorContainer, { borderColor: theme.error, backgroundColor: theme.card }]}>
            <Text style={[styles.errorText, { color: theme.error }]}>{errorMessage}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={[styles.button, { backgroundColor: theme.secondary }]} onPress={onSignInPress}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
        
        <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>Don't have an account?</Text>
            <TouchableOpacity onPress={onSignUpPress}>
              <Text style={[styles.footerLink, { color: theme.primary }]}>Sign Up</Text>
            </TouchableOpacity>
        </View>
        {Platform.OS === 'web' && <View nativeID="clerk-captcha" />} 
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
