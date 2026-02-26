import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';

export default function SignUpScreen({ onSignInPress }: { onSignInPress: () => void }) {
  const { isLoaded, signUp, setActive } = useSignUp();
  
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  const onSignUpPress = async () => {
    if (!isLoaded) {
      return;
    }

    try {
      await signUp.create({
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      setPendingVerification(true);
    } catch (err: any) {
      Alert.alert('Error', err.errors ? err.errors[0].message : err.message);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) {
      return;
    }

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      await setActive({ session: completeSignUp.createdSessionId });
    } catch (err: any) {
      Alert.alert('Error', err.errors ? err.errors[0].message : err.message);
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

          <Button title="Sign Up" onPress={onSignUpPress} />
          
           <View style={styles.footer}>
            <Text>Already have an account?</Text>
            <Button title="Sign In" onPress={onSignInPress} />
          </View>
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
    }
});
