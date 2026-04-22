//dashboard
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
  FlatList,
  BackHandler, 
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, Link, Stack } from 'expo-router';
import { 
  Zap, 
  Play, 
  Image as ImageIcon, 
  Upload, 
  History, 
  Monitor, 
  LogOut, 
  Maximize,
  Settings 
} from 'lucide-react-native';

// Import your API services
import { adAPI, mediaAPI, profileAPI, videoAPI, logout, getToken } from '../services/api';

export default function Dashboard() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [userName, setUserName] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * RESTRICTION PROTOCOL:
   * Prevents the user from using the hardware back button on Android.
   */
  useEffect(() => {
    const onBackPress = () => {
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error('No Token found in secure storage.');

      const user = await profileAPI.getMe();
      setUserName(user.full_name || 'OPERATOR_01');
      
      const adHistory = await profileAPI.getHistory();
      setHistory(adHistory || []);
      
      setIsCheckingAuth(false);
    } catch (err: any) {
      console.error("AXIOM_LOG: Dashboard API Failure:", err);
      const errorMsg = err?.message || "Failed to load dashboard data.";
      setErrorMessage(`API FETCH ERROR: ${errorMsg}`);
      setIsCheckingAuth(false); 
    }
  };

  const generateMedia = async (type: 'image' | 'video') => {
    setErrorMessage(null); 
    if (!prompt) return setErrorMessage('Input Required: Please enter an ad description.');
    
    setIsLoading(true);
    setMediaUrl(null);
    setMediaType(type);
    setStatusText('INITIALIZING_LLM_ENHANCEMENT...');

    try {
      if (type === 'image') {
        const adData: any = await adAPI.enhanceImagePrompt(prompt);
        if (adData.status === 'rejected') throw new Error(adData.message);
        
        setStatusText('GENERATING_STILL_FRAME...');
        const mediaData = await mediaAPI.generateImage({
          prompt: adData.enhanced_prompt,
          time_of_day: adData.time_of_day,
          weather_condition: adData.weather_condition
        });
        
        setMediaUrl(mediaData.url || mediaData.image_url || null);
      } else {
        const adData: any = await adAPI.enhanceVideoPrompt(prompt);
        if (adData.status === 'rejected') throw new Error(adData.message);

        setStatusText('STITCHING_VEO_SEQUENCE...');
        const videoData = await mediaAPI.generateVideoSequence({
          prompts: adData.enhanced_prompts,
          time_of_day: adData.time_of_day,
          weather_condition: adData.weather_condition
        });
        
        setMediaUrl(videoData.video_url || videoData.url || null);
      }
      
      const newHistory = await profileAPI.getHistory();
      setHistory(newHistory || []);
    } catch (error: any) {
      const errorMsg = error?.message || "Generation sequence failed.";
      setErrorMessage(errorMsg);
      setMediaType(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (result.canceled || !result.assets.length) return;

    const file = result.assets[0];
    setErrorMessage(null);
    setIsLoading(true);
    setStatusText('EXECUTING_VISION_GUARD_MODERATION...');
    
    try {
      const responseData = await videoAPI.upload(file.uri, file.fileName || 'upload.mp4', 'video/mp4');

      if (responseData.status === 'approved' || responseData.url) {
        setMediaUrl(responseData.url);
        setMediaType('video');
        
        const newHistory = await profileAPI.getHistory();
        setHistory(newHistory || []);
      } else {
        throw new Error(responseData.message || "UPLOAD REJECTED BY SERVER.");
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Upload failed.";
      setErrorMessage(`UPLOAD REJECTED: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    } finally {
      router.replace('/');
    }
  };

  const handleArchiveSelect = (item: any) => {
    setMediaUrl(item.url);
    setMediaType(item.media_type);
    setStatusText(item.media_type === 'video' ? 'LOADING_ARCHIVE_VIDEO...' : 'LOADING_ARCHIVE_IMAGE...');
  };

  const renderArchiveItem = ({ item }: { item: any }) => (
    <View style={styles.historyCard}>
      <TouchableOpacity 
        activeOpacity={0.8} 
        onPress={() => handleArchiveSelect(item)}
      >
        <View style={styles.cardPreview}>
          {item.media_type === 'video' ? (
            <Video 
              source={{ uri: item.url }} 
              style={styles.cardMedia} 
              resizeMode={ResizeMode.COVER}
              isMuted
            />
          ) : (
            <Image source={{ uri: item.url }} style={styles.cardMedia} />
          )}
          
          {item.media_type === 'video' && (
            <View style={styles.playIconOverlay}>
              <Play size={24} color="rgba(255,255,255,0.8)" fill="rgba(255,255,255,0.2)" />
            </View>
          )}

          <View style={styles.cardTags}>
            <Text style={styles.tagDark}>{item.time_of_day}</Text>
            <Text style={styles.tagLight}>{item.weather_condition}</Text>
          </View>
        </View>
      </TouchableOpacity>

      <Text style={styles.cardPrompt} numberOfLines={2}>"{item.prompt}"</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
        <Link href={`/schedule/${item.id}`} asChild>
          <TouchableOpacity><Text style={styles.deployText}>DEPLOY →</Text></TouchableOpacity>
        </Link>
      </View>
    </View>
  );

  if (isCheckingAuth) {
    return (
      <View style={styles.loaderContainer}>
        <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
        <ActivityIndicator color="white" size="large" />
        <Text style={styles.loaderText}>SYNCING_NEURAL_INTERFACE...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />

      {/* UPDATED HEADER: Now includes Billboard Link */}
      <View style={styles.nav}>
        <View style={styles.navLeft}>
          <View style={styles.logoCircle}>
            <View style={styles.logoDot} />
          </View>
          <Text style={styles.navTitle}>{userName.toUpperCase()} // TERMINAL</Text>
        </View>

        <View style={styles.navRight}>
          <Link href="/billboard" asChild>
            <TouchableOpacity style={styles.billboardBtn}>
               <Monitor size={12} color="black" />
               <Text style={styles.billboardBtnText}>BILLBOARD</Text>
            </TouchableOpacity>
          </Link>
          
          <Link href="/profile" asChild>
            <TouchableOpacity style={styles.iconButton}>
              <Settings size={18} color="#000" />
            </TouchableOpacity>
          </Link>
          
          <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
            <LogOut size={18} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.commandPanel}>
          <View style={styles.panelHeader}>
            <Zap size={14} color="#555" />
            <Text style={styles.panelTitle}>PROMPT_ENTRY_MODULE</Text>
          </View>

          {errorMessage && (
            <View style={styles.errorBanner}>
              <View style={styles.errorIndicator} />
              <Text style={styles.errorText}>[SYSTEM_NOTICE]: {errorMessage}</Text>
            </View>
          )}

          <TextInput
            placeholder="Input ad description..."
            placeholderTextColor="#555"
            multiline
            value={prompt}
            onChangeText={setPrompt}
            style={styles.textArea}
            editable={!isLoading}
          />

          <View style={styles.commandControls}>
            <TouchableOpacity 
              style={[styles.btnMain, isLoading && styles.btnDisabled]} 
              onPress={() => generateMedia('image')}
              disabled={isLoading}
            >
              <Text style={styles.btnText}>GENERATE IMAGE</Text>
              <ImageIcon size={14} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.btnMain, isLoading && styles.btnDisabled]} 
              onPress={() => generateMedia('video')}
              disabled={isLoading}
            >
              <Text style={styles.btnText}>GENERATE VIDEO</Text>
              <Play size={14} color="white" />
            </TouchableOpacity>
            
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>EXT_INPUT_INTERFACE</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity 
              style={[styles.btnUpload, isLoading && styles.btnDisabled]} 
              onPress={handleFileUpload}
              disabled={isLoading}
            >
              <Text style={styles.btnUploadText}>UPLOAD VIDEO</Text>
              <Upload size={14} color="#a1a1aa" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.monitorContainer}>
          <View style={styles.monitorHeader}>
            <View style={styles.monitorHeaderLeft}>
              <View style={[styles.statusDot, errorMessage ? styles.statusDotError : null]} />
              <Text style={styles.monitorTitle}>LIVE_SIGNAL_MONITOR</Text>
            </View>
            {mediaUrl && <Maximize size={16} color="#a1a1aa" />}
          </View>
          
          <View style={styles.monitorDisplay}>
            {isLoading ? (
              <View style={styles.monitorLoading}>
                <ActivityIndicator color="white" />
                <Text style={styles.monitorStatusText}>{statusText}</Text>
              </View>
            ) : mediaUrl ? (
              mediaType === 'video' ? (
                <Video 
                  source={{ uri: mediaUrl }} 
                  style={styles.fullMedia} 
                  resizeMode={ResizeMode.CONTAIN} 
                  useNativeControls 
                  shouldPlay 
                  isLooping 
                />
              ) : (
                <Image source={{ uri: mediaUrl }} style={styles.fullMedia} resizeMode="contain" />
              )
            ) : (
              <View style={styles.monitorIdle}>
                <Monitor size={48} color="#333" />
                <Text style={styles.idleText}>SYSTEM_IDLE // WAITING_FOR_COMMAND</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.archiveSection}>
          <View style={styles.archiveHeader}>
            <View style={styles.archiveIconWrapper}>
              <History size={16} color="white" />
            </View>
            <Text style={styles.archiveTitle}>SYSTEM_ARCHIVE</Text>
          </View>
          
          {history.length === 0 ? (
            <View style={styles.emptyArchive}>
              <Text style={styles.emptyArchiveText}>NO_HISTORY_FOUND_IN_NODE</Text>
            </View>
          ) : (
            <FlatList
              data={history}
              renderItem={renderArchiveItem}
              keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.archiveList}
            />
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>SYSTEM_ACTIVE // OPERATOR_AUTHENTICATED // 2026</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  scrollContent: { paddingBottom: 40 },
  loaderContainer: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  loaderText: { color: 'white', fontSize: 10, marginTop: 20, letterSpacing: 4, textTransform: 'uppercase', opacity: 0.5 },
  
  // NAV STYLES
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#000', backgroundColor: 'white', zIndex: 10 },
  navLeft: { flexDirection: 'row', alignItems: 'center' },
  logoCircle: { width: 24, height: 24, backgroundColor: 'black', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  logoDot: { width: 6, height: 6, backgroundColor: 'white', borderRadius: 3 },
  navTitle: { fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  
  // New Billboard Button Style
  billboardBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: 'black', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 2 },
  billboardBtnText: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  
  iconButton: { padding: 4 },
  
  commandPanel: { backgroundColor: 'black', margin: 20, padding: 30, borderRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 25, opacity: 0.4 },
  panelTitle: { color: 'white', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginLeft: 8, letterSpacing: 2, textTransform: 'uppercase' },
  errorBanner: { flexDirection: 'row', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.5)', borderRadius: 10, marginBottom: 20, overflow: 'hidden' },
  errorIndicator: { width: 4, backgroundColor: '#ef4444' },
  errorText: { color: '#f87171', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', padding: 12, letterSpacing: 1, textTransform: 'uppercase' },
  textArea: { color: 'white', fontSize: 22, fontWeight: '700', minHeight: 140, textAlignVertical: 'top', borderBottomWidth: 1, borderBottomColor: '#27272a', marginBottom: 30 },
  commandControls: { gap: 12 },
  btnMain: { flexDirection: 'row', borderWidth: 1, borderColor: 'white', padding: 20, justifyContent: 'space-between', alignItems: 'center' },
  btnText: { color: 'white', fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  btnDisabled: { opacity: 0.5 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 15 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#27272a' },
  dividerText: { color: '#52525b', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', paddingHorizontal: 10, letterSpacing: 3, textTransform: 'uppercase' },
  btnUpload: { flexDirection: 'row', borderWidth: 1, borderColor: '#3f3f46', padding: 20, justifyContent: 'space-between', alignItems: 'center' },
  btnUploadText: { color: '#a1a1aa', fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  monitorContainer: { backgroundColor: '#f4f4f5', marginHorizontal: 20, marginBottom: 20, padding: 30, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  monitorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  monitorHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 10, height: 10, backgroundColor: 'black', borderRadius: 5, marginRight: 10 },
  statusDotError: { backgroundColor: '#ef4444' },
  monitorTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  monitorDisplay: { height: 400, backgroundColor: 'black', borderRadius: 20, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15 },
  monitorLoading: { alignItems: 'center' },
  monitorStatusText: { color: 'white', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginTop: 20, letterSpacing: 4, textTransform: 'uppercase', opacity: 0.7 },
  fullMedia: { width: '100%', height: '100%' },
  monitorIdle: { alignItems: 'center', opacity: 0.15 },
  idleText: { color: 'white', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginTop: 20, letterSpacing: 5, textTransform: 'uppercase' },
  archiveSection: { padding: 20, marginTop: 20 },
  archiveHeader: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 30 },
  archiveIconWrapper: { padding: 8, backgroundColor: 'black', borderRadius: 20 },
  archiveTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -1, textTransform: 'uppercase' },
  emptyArchive: { paddingVertical: 60, alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: '#e4e4e7', borderRadius: 20 },
  emptyArchiveText: { color: '#a1a1aa', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', textTransform: 'uppercase', letterSpacing: 2 },
  archiveList: { gap: 15 },
  historyCard: { width: 300, backgroundColor: 'white', borderWidth: 1, borderColor: '#000', padding: 20, borderRadius: 0 }, 
  cardPreview: { height: 160, backgroundColor: 'black', marginBottom: 20, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  cardMedia: { width: '100%', height: '100%', position: 'absolute' },
  playIconOverlay: { position: 'absolute', zIndex: 5, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20, padding: 5 },
  cardTags: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', gap: 5, zIndex: 10 },
  tagDark: { backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', fontSize: 8, paddingHorizontal: 8, paddingVertical: 5, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  tagLight: { backgroundColor: 'rgba(255,255,255,0.8)', color: 'black', fontSize: 8, paddingHorizontal: 8, paddingVertical: 5, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', borderWidth: 1, borderColor: 'black' },
  cardPrompt: { fontSize: 12, fontWeight: '700', color: '#52525b', textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 18, marginBottom: 20, fontStyle: 'italic' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: '#f4f4f5', paddingTop: 15 },
  cardDate: { fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: '#a1a1aa', textTransform: 'uppercase' },
  deployText: { fontSize: 10, fontWeight: '900', color: '#2563eb', textTransform: 'uppercase', letterSpacing: 1 },
  footer: { padding: 40, alignItems: 'center', marginTop: 20 },
  footerLine: { width: 100, height: 1, backgroundColor: '#e4e4e7', marginBottom: 20 },
  footerText: { fontSize: 9, fontWeight: '900', color: '#d4d4d8', textTransform: 'uppercase', letterSpacing: 5, textAlign: 'center' }
});
