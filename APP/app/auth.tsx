import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter, Link, Stack } from 'expo-router';
import { ArrowLeft, Shield, Command } from 'lucide-react-native';

// Import your API services
import { authAPI, setToken } from '../services/api';

type AuthView = 'login' | 'signup' | 'forgot';

export default function AuthPage() {
  const router = useRouter();
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  /**
   * ROBUST EMAIL/PASSWORD AUTHENTICATION
   */
  const handleSubmit = async () => {
    if (!email) return;
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      if (view === 'forgot') {
        await authAPI.forgotPassword(email);
        setMessage({ text: 'Access link dispatched to your inbox.', type: 'success' });
      } else {
        console.log("AXIOM_LOG: 1. Executing Auth Request...");
        
        // Native Fetch returns the JSON object directly! No .data wrapper needed.
        const res: any = view === 'login' 
          ? await authAPI.login({ email, password })
          : await authAPI.signup({ email, password });
        
        console.log("AXIOM_LOG: 2. Server Response Received");

        // Extract the token safely from the direct response
        const token = res?.session?.access_token || res?.access_token;
        
        if (token) {
          console.log("AXIOM_LOG: 3. Token extracted. Saving to secure storage...");
          await setToken(token);
          
          console.log("AXIOM_LOG: 4. Routing to App...");
          
          try {
            // Attempt to route to dashboard
            router.replace('/dashboard');
          } catch (routeErr) {
            console.warn("AXIOM_LOG: /dashboard route missing, falling back to / (index)");
            router.replace('/'); 
          }
          
        } else {
          console.log("AXIOM_LOG: ERROR - Token missing from payload:", JSON.stringify(res));
          setMessage({ text: 'Token mapping failed. Check logs.', type: 'error' });
        }
      }
    } catch (err: any) {
      console.error("AXIOM_LOG: Exception caught:", err);
      // Our api.ts fetch wrapper already extracts the exact error string
      const errorMsg = err?.message || 'Authentication sequence failed.';
      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Kills the native Expo Header */}
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          
          {/* TOP BRANDING HEADER */}
          <View style={styles.brandingHeader}>
            <View style={styles.logoCircle}>
              <View style={styles.logoDot} />
            </View>
            <Text style={styles.brandTitle}>
              DIGITAL{'\n'}BILLBOARD{'\n'}
              <Text style={styles.brandTitleItalic}>MANAGEMENT</Text>
            </Text>
            
            <View style={styles.statusContainer}>
              <View style={styles.statusRow}>
                <Shield size={12} color="#71717a" />
                <Text style={styles.statusText}>SECURE SESSION PROTOCOL</Text>
              </View>
              <View style={styles.statusRow}>
                <Command size={12} color="#71717a" />
                <Text style={styles.statusText}>HARDWARE SYNC ACTIVE</Text>
              </View>
            </View>
          </View>

          {/* FORM AREA */}
          <View style={styles.formSection}>
            
            <Link href="/" asChild>
              <TouchableOpacity style={styles.backButton}>
                <ArrowLeft size={12} color="black" />
                <Text style={styles.backText}>EXIT TO LANDING</Text>
              </TouchableOpacity>
            </Link>

            <View style={styles.headerText}>
              <Text style={styles.title}>
                {view === 'login' && 'IDENTITY'}
                {view === 'signup' && 'REGISTER'}
                {view === 'forgot' && 'RECOVERY'}
              </Text>
              <Text style={styles.subtitle}>
                {view === 'login' && 'Provide credentials for studio access'}
                {view === 'signup' && 'Initialize a new operator account'}
                {view === 'forgot' && 'Request temporary access link'}
              </Text>
            </View>

            {/* MESSAGE BOX */}
            {message.text ? (
              <View style={[styles.messageBox, message.type === 'error' ? styles.messageError : styles.messageSuccess]}>
                <Text style={message.type === 'error' ? styles.messageTextError : styles.messageTextSuccess}>
                  {message.text}
                </Text>
              </View>
            ) : null}

            {/* INPUTS */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>OPERATOR EMAIL</Text>
              <TextInput 
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="SYSTEM_ID@NODE.COM"
                placeholderTextColor="#a1a1aa"
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {view !== 'forgot' && (
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>PASSCODE</Text>
                  {view === 'login' && (
                    <TouchableOpacity onPress={() => setView('forgot')}>
                      <Text style={styles.forgotText}>FORGOT?</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput 
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#a1a1aa"
                  secureTextEntry
                />
              </View>
            )}

            {/* EXECUTE BUTTON */}
            <TouchableOpacity 
              onPress={handleSubmit}
              disabled={isLoading}
              style={[styles.submitButton, isLoading && { opacity: 0.5 }]}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {view === 'login' ? 'EXECUTE LOGIN' : view === 'signup' ? 'CREATE NODE' : 'DISPATCH LINK'}
                </Text>
              )}
            </TouchableOpacity>

            {/* FOOTER SWITCHER */}
            <View style={styles.footer}>
              <TouchableOpacity onPress={() => setView(view === 'login' ? 'signup' : 'login')}>
                <Text style={styles.footerText}>
                  {view === 'forgot' ? (
                    <Text style={styles.switchText}>RETURN TO LOGIN</Text>
                  ) : (
                    <>
                      {view === 'login' ? 'UNAUTHORIZED? ' : 'EXISTING OPERATOR? '}
                      <Text style={styles.switchText}>
                        {view === 'login' ? 'REGISTER ACCOUNT' : 'SWITCH TO LOGIN'}
                      </Text>
                    </>
                  )}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  scrollContent: { flexGrow: 1 },
  
  /* BRANDING HEADER */
  brandingHeader: { backgroundColor: 'black', padding: 30, paddingTop: 60, paddingBottom: 40 },
  logoCircle: { width: 30, height: 30, backgroundColor: 'white', borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  logoDot: { width: 8, height: 8, backgroundColor: 'black', borderRadius: 4 },
  brandTitle: { color: 'white', fontSize: 32, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -1, lineHeight: 34, marginBottom: 30 },
  brandTitleItalic: { color: '#52525b', fontStyle: 'italic' },
  statusContainer: { gap: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusText: { color: '#71717a', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', textTransform: 'uppercase', letterSpacing: 2 },

  /* FORM SECTION */
  formSection: { flex: 1, padding: 30, paddingTop: 40 },
  
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
  backText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginLeft: 8 },
  
  headerText: { marginBottom: 40 },
  title: { fontSize: 42, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -2, marginBottom: 5 },
  subtitle: { fontSize: 10, fontWeight: '700', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: 2 },

  messageBox: { padding: 15, borderWidth: 1, marginBottom: 30 },
  messageError: { backgroundColor: 'black', borderColor: 'black' },
  messageSuccess: { backgroundColor: '#f4f4f5', borderColor: '#e4e4e7' },
  messageTextError: { color: 'white', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  messageTextSuccess: { color: 'black', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },

  inputGroup: { marginBottom: 25 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  label: { fontSize: 10, fontWeight: '900', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: 2 },
  forgotText: { fontSize: 10, fontWeight: '700', color: '#a1a1aa', textDecorationLine: 'underline' },
  input: { 
    borderBottomWidth: 2, 
    borderColor: '#e4e4e7', 
    paddingVertical: 12, 
    fontSize: 14, 
    fontWeight: '700',
    color: 'black'
  },

  submitButton: { backgroundColor: 'black', padding: 20, alignItems: 'center', marginTop: 10 },
  submitButtonText: { color: 'white', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 },

  footer: { marginTop: 40, paddingTop: 30, borderTopWidth: 1, borderColor: '#f4f4f5', alignItems: 'center' },
  footerText: { fontSize: 10, fontWeight: '700', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: 2 },
  switchText: { color: 'black', fontWeight: '900' }
});