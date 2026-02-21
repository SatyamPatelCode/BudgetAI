import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabaseClient';

export default function SignUpScreen({ onSwitchToSignIn }: { onSwitchToSignIn?: () => void } = {}) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const lastAttemptRef = useRef<number>(0);

  const handleSignUp = async () => {
    const now = Date.now();
    if (now - lastAttemptRef.current < 5000) {
      Alert.alert('Please wait', 'Please wait a few seconds before trying again.');
      return;
    }
    lastAttemptRef.current = now;

    if (!email || !username || !password) {
      Alert.alert('Validation', 'Please enter email, username and password.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username } } });
      console.log('signUp response', { data, error });

      if (error) {
        setLoading(false);
        // handle rate limit explicitly
        if ((error as any)?.status === 429 || /too many/i.test(error.message || '')) {
          Alert.alert('Rate limit', 'Too many sign-up attempts. Please try again later.');
          console.warn('SignUp rate limited:', error);
          return;
        }

        Alert.alert('Signup error', error.message);
        return;
      }

      // ensure we have the auth user id and insert into profiles (id should be auth.users.id)
      const userId = (data as any)?.user?.id;
      if (!userId) {
        setLoading(false);
        Alert.alert('Signup', 'Account created. Please confirm your email if required.');
        return;
      }

      const { error: insertError } = await supabase.from('profiles').insert([{ id: userId, username, email }]);
      console.log('profiles insert result', { insertError });
      setLoading(false);

      if (insertError) {
        // could also be rate-limited or blocked by RLS
        if ((insertError as any)?.status === 429 || /too many/i.test(insertError.message || '')) {
          Alert.alert('Rate limit', 'Profile insert rate-limited. Please try again later.');
          console.warn('Profile insert rate limited:', insertError);
          return;
        }

        Alert.alert('Signup warning', 'Auth user created but failed to insert profile: ' + insertError.message);
        return;
      }

      Alert.alert('Success', 'Account created. Please sign in.');
      try { onSwitchToSignIn?.(); } catch (e) {}
    } catch (err: any) {
      setLoading(false);
      console.error('Exception in handleSignUp', err);
      const message = err?.message || String(err);
      if (/too many|429/.test(message.toLowerCase())) {
        Alert.alert('Rate limit', 'Too many sign-up attempts. Please try again later.');
      } else {
        Alert.alert('Signup error', message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" keyboardType="email-address" />
      <TextInput placeholder="Username" value={username} onChangeText={setUsername} style={styles.input} autoCapitalize="none" />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />

      <View style={styles.actions}>
        <Button title={loading ? 'Please wait...' : 'Create Account'} onPress={handleSignUp} disabled={loading} />
        <View style={{ height: 12 }} />
        <Button title="Back to Sign In" onPress={() => onSwitchToSignIn?.()} disabled={loading} />
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 16 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  input: { height: 48, borderColor: '#ddd', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 12 },
  actions: { marginTop: 8 },
});