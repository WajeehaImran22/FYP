\\ profile
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { useRouter, Link, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { 
  User, 
  Camera, 
  Mail, 
  Building, 
  ArrowLeft, 
  LogOut, 
  Code,
  ShieldCheck
} from 'lucide-react-native';

// Import your API services
import { profileAPI, ProfileResponse, logout } from '../services/api';

export default function ProfilePage() {
  const router = useRouter();
  
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    profileAPI.getMe()
      .then(data => {
        setProfile(data);
        setFullName(data.full_name || '');
        setCompanyName(data.company_name || '');
        setAvatarUrl(data.avatar_url || null);
        setIsLoading(false);
      })
      .catch(() => {
        router.replace('/auth');
      });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ text: '', type: '' });

    try {
      await profileAPI.updateProfile({ 
        full_name: fullName, 
        company_name: companyName,
      });
      setMessage({ text: 'SYSTEM_RECORD_UPDATED', type: 'success' });
    } catch (error: any) {
      setMessage({ text: error.message || 'UPDATE_FAILED', type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets.length) return;

    setIsUploadingImage(true);
    
    // Optimistic UI Update
    const localUri = result.assets[0].uri;
    setAvatarUrl(localUri);

    try {
      // Simulate network delay for upload (as in your original code)
      // If you add an avatar upload API later, call it here.
      await new Promise(res => setTimeout(res, 1000));
      setMessage({ text: 'AVATAR_SYNC_COMPLETE', type: 'success' });
    } catch (error: any) {
      setMessage({ text: 'AVATAR_SYNC_FAILED', type: 'error' });
    } finally {
      setIsUploadingImage(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    } finally {
      router.replace('/auth');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color="white" size="large" />
        <Text style={styles.loaderText}>DECRYPTING_OPERATOR_PROFILE...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          
          {/* SECTION 1: THE MINIMALIST NAV */}
          <View style={styles.nav}>
            <View style={styles.navBrand}>
              <View style={styles.navDotOuter}>
                <View style={styles.navDotInner} />
              </View>
              <Text style={styles.navTitle}>AXIOM TERMINAL // CONFIG</Text>
            </View>
            
            <Link href="/dashboard" asChild>
              <TouchableOpacity style={styles.backButton}>
                <ArrowLeft size={14} color="black" />
                <Text style={styles.backText}>BACK TO STUDIO</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* SECTION 2: THE MONOLITH HEADER */}
          <View style={styles.headerBlock}>
            <View style={styles.roleBadge}>
              <Code size={12} color="black" />
              <Text style={styles.roleText}>OPERATOR DESIGNATION: {profile?.role || 'USER'}</Text>
            </View>
            <Text style={styles.heroText}>SYSTEM{'\n'}<Text style={styles.heroTextMuted}>OPERATOR.</Text></Text>
          </View>

          {/* SECTION 3: THE INDUSTRIAL GRID CONFIG */}
          <View style={styles.configSection}>
            
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>IDENTITY MATRIX</Text>
              <View style={styles.sectionTitleLine} />
            </View>

            <View style={styles.matrixGrid}>
              
              {/* TOP/LEFT CELL: AVATAR & CLEARANCE */}
              <View style={styles.matrixAvatarCell}>
                <TouchableOpacity 
                  onPress={pickImage}
                  disabled={isUploadingImage}
                  style={styles.avatarContainer}
                >
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <User size={48} color="#d4d4d8" />
                  )}
                  <View style={styles.avatarOverlay}>
                    {isUploadingImage ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Camera size={24} color="white" />
                    )}
                  </View>
                </TouchableOpacity>

                <View style={styles.infoBlock}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>CLEARANCE</Text>
                    <View style={styles.infoValueRow}>
                      <ShieldCheck size={12} color="black" />
                      <Text style={styles.infoValue}>{profile?.role || 'STANDARD'}</Text>
                    </View>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>UID</Text>
                    <Text style={[styles.infoValue, { color: '#a1a1aa' }]}>
                      {profile?.id?.split('-')[0] || 'UNKNOWN'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* BOTTOM/RIGHT CELL: DATA INPUT FORM */}
              <View style={styles.matrixFormCell}>
                
                {message.text ? (
                  <View style={[styles.messageBanner, message.type === 'error' ? styles.messageError : styles.messageSuccess]}>
                    <View style={[styles.messageDot, message.type === 'error' ? { backgroundColor: '#ef4444' } : { backgroundColor: 'white' }]} />
                    <Text style={[styles.messageText, message.type === 'error' ? { color: '#ef4444' } : { color: 'white' }]}>
                      {message.text}
                    </Text>
                  </View>
                ) : null}

                {/* Email (Read Only) */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <Mail size={12} color="#a1a1aa" />
                    <Text style={styles.inputLabel}>ROOT IDENTITY (EMAIL)</Text>
                  </View>
                  <TextInput 
                    value={profile?.email || ''} 
                    editable={false}
                    style={[styles.textInput, styles.textInputDisabled]} 
                  />
                </View>

                {/* Full Name */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <User size={12} color="black" />
                    <Text style={[styles.inputLabel, { color: 'black' }]}>OPERATOR DESIGNATION</Text>
                  </View>
                  <TextInput 
                    value={fullName} 
                    onChangeText={setFullName}
                    placeholder="ENTER FULL NAME"
                    placeholderTextColor="#d4d4d8"
                    style={styles.textInput} 
                  />
                </View>

                {/* Company Name */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <Building size={12} color="black" />
                    <Text style={[styles.inputLabel, { color: 'black' }]}>AFFILIATED NODE (COMPANY)</Text>
                  </View>
                  <TextInput 
                    value={companyName} 
                    onChangeText={setCompanyName}
                    placeholder="ENTER COMPANY NAME"
                    placeholderTextColor="#d4d4d8"
                    style={styles.textInput} 
                  />
                </View>

                {/* Submit Button */}
                <TouchableOpacity 
                  onPress={handleSave}
                  disabled={isSaving}
                  style={[styles.submitBtn, isSaving && styles.btnDisabled]}
                >
                  {isSaving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.submitBtnText}>COMMIT PROTOCOL UPDATE</Text>
                  )}
                </TouchableOpacity>

              </View>
            </View>

            {/* DANGER ZONE */}
            <View style={styles.dangerZone}>
              <View style={styles.dangerTextContainer}>
                <Text style={styles.dangerTitle}>TERMINATE SESSION</Text>
                <Text style={styles.dangerSub}>Sever neural link and clear local token registry.</Text>
              </View>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                <LogOut size={14} color="black" />
                <Text style={styles.logoutBtnText}>DISCONNECT</Text>
              </TouchableOpacity>
            </View>

          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.footerTextLeft}>// SECURE_CHANNEL_ACTIVE //</Text>
            <Text style={styles.footerTextRight}>IDENTITY MATRIX RENDERED</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  
  // Loader
  loaderContainer: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  loaderText: { color: 'white', fontSize: 10, marginTop: 20, letterSpacing: 4, textTransform: 'uppercase', opacity: 0.5 },
  
  // Nav
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.05)', backgroundColor: 'white' },
  navBrand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  navDotOuter: { width: 16, height: 16, backgroundColor: 'black', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  navDotInner: { width: 4, height: 4, backgroundColor: 'white', borderRadius: 2 },
  navTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backText: { fontSize: 10, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },

  // Header Monolith
  headerBlock: { paddingHorizontal: 25, paddingTop: 40, paddingBottom: 60, borderBottomWidth: 1, borderColor: 'black', backgroundColor: 'white' },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20, opacity: 0.6 },
  roleText: { fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', textTransform: 'uppercase', letterSpacing: 1 },
  heroText: { fontSize: 50, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -2, lineHeight: 50 },
  heroTextMuted: { color: '#a1a1aa' },

  // Config Section
  configSection: { backgroundColor: '#fcfcfc', padding: 25, paddingBottom: 80 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 30 },
  sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 3, textTransform: 'uppercase' },
  sectionTitleLine: { flex: 1, height: 1, backgroundColor: 'black' },

  // Matrix Grid
  matrixGrid: { borderWidth: 1, borderColor: 'black', backgroundColor: 'black', marginBottom: 40 },
  
  // Avatar Cell
  matrixAvatarCell: { backgroundColor: 'white', padding: 30, alignItems: 'center', borderBottomWidth: 1, borderColor: 'black' },
  avatarContainer: { width: 140, height: 140, borderRadius: 70, borderWidth: 2, borderColor: 'black', backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 30 },
  avatarImage: { width: '100%', height: '100%' },
  avatarOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', opacity: 0 },
  
  infoBlock: { width: '100%', gap: 15 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: 'black', paddingBottom: 8 },
  infoLabel: { fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: '#71717a', textTransform: 'uppercase', letterSpacing: 2 },
  infoValueRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  infoValue: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },

  // Form Cell
  matrixFormCell: { backgroundColor: 'white', padding: 30 },
  
  messageBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 15, marginBottom: 30, borderWidth: 1 },
  messageError: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' },
  messageSuccess: { backgroundColor: 'black', borderColor: 'black' },
  messageDot: { width: 6, height: 6, borderRadius: 3 },
  messageText: { fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', textTransform: 'uppercase', letterSpacing: 1 },

  inputGroup: { marginBottom: 30 },
  inputLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  inputLabel: { fontSize: 10, fontWeight: '900', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: 1 },
  textInput: { borderBottomWidth: 1, borderColor: 'black', paddingVertical: 10, fontSize: 18, fontWeight: '900', color: 'black' },
  textInputDisabled: { borderColor: '#e4e4e7', color: '#a1a1aa' },

  submitBtn: { backgroundColor: 'black', padding: 20, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: 'black' },
  btnDisabled: { opacity: 0.5 },
  submitBtnText: { color: 'white', fontSize: 11, fontWeight: '900', letterSpacing: 3, textTransform: 'uppercase' },

  // Danger Zone
  dangerZone: { backgroundColor: 'white', borderWidth: 1, borderColor: 'black', padding: 25, gap: 20 },
  dangerTextContainer: { gap: 5 },
  dangerTitle: { fontSize: 18, fontWeight: '900', textTransform: 'uppercase' },
  dangerSub: { fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: '#71717a', textTransform: 'uppercase', letterSpacing: 1 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: 'black', padding: 15 },
  logoutBtnText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 },

  // Footer
  footer: { backgroundColor: 'black', paddingVertical: 30, paddingHorizontal: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerTextLeft: { color: '#52525b', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  footerTextRight: { color: '#71717a', fontSize: 9, textTransform: 'uppercase', letterSpacing: 2 }
});
