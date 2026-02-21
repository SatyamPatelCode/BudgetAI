import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { supabase } from '../lib/supabaseClient';

export default function LoginScreen({ onSignIn, onSwitchToSignUp }: { onSignIn?: () => void; onSwitchToSignUp?: () => void } = {}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    const entry = `${new Date().toISOString()} - ${msg}`;
    setLogs((s) => [entry, ...s].slice(0, 50)); // keep latest 50
  };

  const pseudoEmail = (u: string) => `${u}@noemail.local`;

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Validation', 'Please enter username and password.');
      return;
    }

    setLoading(true);
    addLog('Starting login flow for username: ' + username);

    try {
      addLog('Looking up profile for username in profiles table');
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', username)
        .limit(1)
        .single();

      addLog('Profile lookup result: ' + JSON.stringify({ profile, fetchError }));

      let email: string;
      if (fetchError || !profile || !(profile as any).email) {
        addLog('No profile email found, falling back to pseudo-email');
        email = pseudoEmail(username);
      } else {
        email = (profile as any).email;
      }

      addLog('Attempting signInWithPassword using email: ' + email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      addLog('Auth response: ' + JSON.stringify({ data, error }));
      setLoading(false);

      if (error) {
        Alert.alert('Login error', error.message);
        addLog('Login error: ' + error.message);
        return;
      }

      if (!data || !(data as any).session) {
        Alert.alert('Login', 'Unsuccessful login.');
        addLog('Unsuccessful login, no session returned');
        return;
      }

      addLog('Login successful');
      Alert.alert('Success', 'Logged in.');
      try { onSignIn?.(); } catch (e) { addLog('onSignIn callback error: ' + String(e)); }
    } catch (err: any) {
      setLoading(false);
      const msg = err?.message ?? String(err);
      Alert.alert('Login error', msg);
      addLog('Exception during login: ' + msg);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BudgetAI — Sign In</Text>

      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />

      <View style={styles.actions}>
        <Button title={loading ? 'Please wait...' : 'Login'} onPress={handleLogin} disabled={loading} />
        <View style={{ height: 12 }} />
        <Button title="Create Account" onPress={() => onSwitchToSignUp?.()} disabled={loading} />
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 12 }} />}

      <Text style={styles.logTitle}>Logs</Text>
      <ScrollView style={styles.logBox}>
        {logs.length === 0 ? (
          <Text style={styles.logLine}>No logs yet</Text>
        ) : (
          logs.map((l, idx) => (
            <Text key={idx} style={styles.logLine}>{l}</Text>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  input: { height: 48, borderColor: '#ddd', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 12 },
  actions: { marginTop: 8 },
  logTitle: { marginTop: 16, fontSize: 16, fontWeight: '600' },
  logBox: { marginTop: 8, maxHeight: 200, borderColor: '#eee', borderWidth: 1, padding: 8, borderRadius: 8, backgroundColor: '#fafafa' },
  logLine: { fontSize: 12, color: '#333', marginBottom: 6 },
});
