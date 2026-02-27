import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Platform } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';

export default function SignUpScreen({ onSignInPress }: { onSignInPress: () => void }) {
  const { isLoaded, signUp, setActive } = useSignUp();
  
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const onSignUpPress = async () => {
    if (!isLoaded) {
      return;
    }
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
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
      const msg = err.errors ? err.errors[0].message : err.message;
      setErrorMessage(msg);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) {
      return;
    }
    setErrorMessage('');

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
      } else if (completeSignUp.status === 'missing_requirements') {
        // If the sign up is missing requirements, we can check what is missing.
        // In this specific case, if phone number is unverified, we might need to verify it.
        // For simplicity in this demo, if email is verified but phone is not, 
        // we might handle it or alert the user. 
        // Ideally, you should configure your Clerk instance to ONLY require email verification 
        // if you don't want to build a phone verification flow right now.
        
        console.error(JSON.stringify(completeSignUp, null, 2));
        setErrorMessage('Your account has been created but requires additional verification (e.g. Phone Number). Please adjust your Clerk Dashboard settings to only require Email verification for a simpler flow, or implement phone verification.');
      } else {
        console.error(JSON.stringify(completeSignUp, null, 2));
        setErrorMessage('Verification failed. Please try again.');
        // logic for incomplete sign up
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      const msg = err.errors ? err.errors[0].message : err.message;
      setErrorMessage(msg);
    }
  };

  return (
    <View style={styles.container}>
        <Text style={styles.title}>Sign Up</Text>
      {!pendingVerification && (
        <View>
          <View>
            <TextInput
              autoCapitalize="none"
              value={username}
              placeholder="Username..."
              onChangeText={(username) => setUsername(username)}
              style={styles.input}
            />
          </View>
          <View>
            <TextInput
              autoCapitalize="none"
              value={emailAddress}
              placeholder="Email..."
              onChangeText={(email) => setEmailAddress(email)}
              style={styles.input}
            />
          </View>

          <View>
            <TextInput
              value={password}
              placeholder="Password..."
              placeholderTextColor="#000"
              secureTextEntry={true}
              onChangeText={(password) => setPassword(password)}
              style={styles.input}
            />
          </View>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <Button title="Sign Up" onPress={onSignUpPress} />
          
           <View style={styles.footer}>
            <Text>Already have an account?</Text>
            <Button title="Sign In" onPress={onSignInPress} />
          </View>

          {Platform.OS === 'web' && <View nativeID="clerk-captcha" />}
        </View>
      )}

      {pendingVerification && (
        <View>
            <Text>A verification code has been sent to your email.</Text>
          <View>
            <TextInput
              value={code}
              placeholder="Code..."
              onChangeText={(code) => setCode(code)}
              style={styles.input}
            />
          </View>
          <Button title="Verify Email" onPress={onPressVerify} />
        </View>
      )}
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
