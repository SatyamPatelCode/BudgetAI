import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Platform } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';

export default function SignInScreen({ onSignUpPress }: { onSignUpPress: () => void }) {
  const { signIn, setActive, isLoaded } = useSignIn();
  
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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

  return (
    <View style={styles.container}>
        <Text style={styles.title}>Sign In</Text>
      <View>
        <TextInput
          autoCapitalize="none"
          value={emailAddress}
          placeholder="Email..."
          onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
          style={styles.input}
        />
      </View>

      <View>
        <TextInput
          value={password}
          placeholder="Password..."
          secureTextEntry={true}
          onChangeText={(password) => setPassword(password)}
          style={styles.input}
        />
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <Button title="Sign In" onPress={onSignInPress} />
      
      <View style={styles.footer}>
          <Text>Don't have an account?</Text>
          <Button title="Sign Up" onPress={onSignUpPress} />
      </View>
      {/* 
        This is required for Clerk CAPTCHA on the web. 
        Using a View with the nativeID prop which maps to the HTML id attribute on web.
      */}
      {Platform.OS === 'web' && <View nativeID="clerk-captcha" />} 
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 10,
        borderRadius: 5,
    },
    footer: {
        marginTop: 20,
        alignItems: 'center',
    },
    errorText: {
        color: 'red',
        marginBottom: 10,
        textAlign: 'center',
    }
});
