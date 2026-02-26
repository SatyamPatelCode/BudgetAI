import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';

export default function SignInScreen({ onSignUpPress }: { onSignUpPress: () => void }) {
  const { signIn, setActive, isLoaded } = useSignIn();
  
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');

  const onSignInPress = async () => {
    if (!isLoaded) {
      return;
    }

    try {
      const completeSignIn = await signIn.create({
        identifier: emailAddress,
        password,
      });
      // This is an important step,
      // This indicates the user is signed in
      await setActive({ session: completeSignIn.createdSessionId });
    } catch (err: any) {
      Alert.alert('Error', err.errors ? err.errors[0].message : err.message);
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

      <Button title="Sign In" onPress={onSignInPress} />
      
      <View style={styles.footer}>
          <Text>Don't have an account?</Text>
          <Button title="Sign Up" onPress={onSignUpPress} />
      </View>
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
