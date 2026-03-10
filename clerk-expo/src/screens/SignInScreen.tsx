import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, Button } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';

export default function SignInScreen({ onSignUpPress }: { onSignUpPress: () => void }) {
  const { signIn, setActive, isLoaded } = useSignIn();
  
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Password Reset State
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');

  const onSignInPress = async () => {
    if (!isLoaded) {
      return;
    }
    setErrorMessage(''); // Clear previous errors

    try {
      const completeSignIn = await signIn.create({
        identifier: emailAddress,
        password,
      });
      // This is an important step,
      // This indicates the user is signed in
      await setActive({ session: completeSignIn.createdSessionId });
    } catch (err: any) {
      const msg = err.errors ? err.errors[0].message : err.message;
      setErrorMessage(msg);
      // Alert.alert('Error', msg); // Optional: keep or remove alert
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

      // Show the reset password UI
      setIsResettingPassword(true);
      setErrorMessage('');
      Alert.alert('Check your email', 'We sent you a password reset code.');
    } catch (err: any) {
      const msg = err.errors ? err.errors[0].message : err.message;
      setErrorMessage(msg);
      console.log(JSON.stringify(err, null, 2));
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
        setIsResettingPassword(false); // Reset state
      } else {
        console.log(result);
        setErrorMessage('Verification failed. Please try again.');
      }
    } catch (err: any) {
      const msg = err.errors ? err.errors[0].message : err.message;
      setErrorMessage(msg);
    }
  };

  const onCancelReset = () => {
    setIsResettingPassword(false);
    setResetStep('request');
    setErrorMessage('');
  };

  if (isResettingPassword) {
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter the code sent to {emailAddress}</Text>

          {/* Code Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Reset Code</Text>
            <TextInput
              value={resetCode}
              placeholder="Enter 6-digit code"
              placeholderTextColor="#888"
              onChangeText={(code) => setResetCode(code)}
              style={styles.input}
              keyboardType="number-pad"
            />
          </View>

          {/* New Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              value={newPassword}
              placeholder="Enter new password"
              placeholderTextColor="#888"
              secureTextEntry={true}
              onChangeText={(pass) => setNewPassword(pass)}
              style={styles.input}
            />
          </View>

          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}
          
          <TouchableOpacity style={styles.button} onPress={onResetPassword}>
            <Text style={styles.buttonText}>Set New Password</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setIsResettingPassword(false)} style={{ marginTop: 20, alignSelf: 'center' }}>
            <Text style={{ color: '#007AFF', fontSize: 16 }}>Cancel</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Please sign in to continue</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            value={emailAddress}
            placeholder="Enter your email"
            placeholderTextColor="#888"
            onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
            style={styles.input}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            placeholder="Enter your password"
            placeholderTextColor="#888"
            secureTextEntry={true}
            onChangeText={(password) => setPassword(password)}
            style={styles.input}
          />
        </View>

        <TouchableOpacity onPress={onRequestReset} style={{ alignSelf: 'flex-end', marginBottom: 20 }}>
            <Text style={{ color: '#007AFF', fontSize: 14, fontWeight: '500' }}>Forgot Password?</Text>
        </TouchableOpacity>

        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.button} onPress={onSignInPress}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
        
        <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={onSignUpPress}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
        </View>

        {/* 
          This is required for Clerk CAPTCHA on the web. 
          Using a View with the nativeID prop which maps to the HTML id attribute on web.
        */}
        {Platform.OS === 'web' && <View nativeID="clerk-captcha" />} 
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      marginBottom: 20,
      textAlign: 'center',
      color: '#666',
    },
    inputContainer: {
      width: '100%',
      marginBottom: 15,
    },
    label: {
      fontSize: 14,
      marginBottom: 5,
      color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        borderRadius: 5,
        fontSize: 16,
        color: '#333',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        marginTop: 20,
        alignItems: 'center',
    },
    footerText: {
      fontSize: 14,
      color: '#333',
    },
    footerLink: {
      color: '#007AFF',
      fontSize: 14,
      fontWeight: 'bold',
    },
    errorContainer: {
        marginBottom: 10,
        padding: 10,
        borderRadius: 5,
        backgroundColor: '#f8d7da',
        borderColor: '#f5c6cb',
        borderWidth: 1,
    },
    errorText: {
        color: '#721c24',
        textAlign: 'center',
    }
});
