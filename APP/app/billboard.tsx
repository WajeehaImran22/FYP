\\billboard
  import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Platform,
  BackHandler,
} from 'react-native';
import { Video, ResizeMode, Audio } from 'expo-av';
import { Stack, useRouter } from 'expo-router';
import { MonitorOff, Wifi, AlertCircle } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://hammad712-digitalbillboard.hf.space";

interface BillboardAd {
  id: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  tier: 'premium' | 'standard' | 'basic';
  expires_at: string;
  ads?: {
    url: string;
    media_type: 'image' | 'video';
  };
}

export default function BillboardPage() {
  const router = useRouter();
  const [activeAds, setActiveAds] = useState<BillboardAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string>('');

  /**
   * BACK NAVIGATION PROTOCOL
   * Returns user to Dashboard instead of Landing Page.
   */
  useEffect(() => {
    const onBackPress = () => {
      router.replace('/dashboard');
      return true; // Blocks default back action
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, []);

  /**
   * AUDIO INITIALIZATION
   * Required for some Android devices to permit autoplay.
   */
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  }, []);

  const fetchSignal = async () => {
    try {
      const res = await fetch(`${API_URL}/videos/billboard/active`);
      if (!res.ok) throw new Error("SIGNAL_INTERRUPTED");
      const data = await res.json();
      setActiveAds(data);
      setLastSync(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Critical: Billboard Signal Lost");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSignal();
    const interval = setInterval(fetchSignal, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
        <StatusBar hidden />
        <ActivityIndicator color="#fff" size="large" />
        <Text style={styles.loaderText}>INITIALIZING_AXIOM_DISPLAY_NODE...</Text>
      </View>
    );
  }

  if (activeAds.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ headerShown: false, gestureEnabled: true }} />
        <StatusBar hidden />
        <MonitorOff size={64} color="rgba(255,255,255,0.1)" />
        <Text style={styles.emptyTitle}>NO_ACTIVE_TRANSMISSIONS</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: true }} />
      <StatusBar hidden />

      <View style={styles.gridContainer}>
        {activeAds.slice(0, 4).map((slot, index) => {
          const sourceUrl = slot.media_url || slot.ads?.url;
          const definedType = slot.media_type || slot.ads?.media_type;
          
          const isVideo = definedType === 'video' || 
                          sourceUrl?.toLowerCase().endsWith('.mp4') || 
                          sourceUrl?.toLowerCase().endsWith('.mov');

          let slotWidth = SCREEN_WIDTH;
          let slotHeight = SCREEN_HEIGHT;

          if (slot.tier === 'premium') {
            slotWidth = SCREEN_WIDTH;
            slotHeight = SCREEN_HEIGHT;
          } else if (slot.tier === 'standard') {
            slotWidth = SCREEN_WIDTH;
            slotHeight = SCREEN_HEIGHT / 2;
          } else if (slot.tier === 'basic') {
            slotWidth = SCREEN_WIDTH / 2;
            slotHeight = SCREEN_HEIGHT / 2;
          }

          return (
            <View 
              key={slot.id || index} 
              style={[styles.baseSlot, { width: slotWidth, height: slotHeight }]}
            >
              {sourceUrl ? (
                isVideo ? (
                  <Video
                    source={{ uri: sourceUrl }}
                    style={StyleSheet.absoluteFill}
                    resizeMode={ResizeMode.STRETCH}
                    shouldPlay={true}
                    isLooping={true}
                    isMuted={true}
                    // onReadyForDisplay ensures it starts even if autoplay lags
                    onReadyForDisplay={(status) => console.log(`CH_${index+1} Active`)}
                  />
                ) : (
                  <Image 
                    source={{ uri: sourceUrl }} 
                    style={StyleSheet.absoluteFill} 
                    resizeMode="stretch" 
                  />
                )
              ) : (
                <View style={styles.errorSlot}>
                  <AlertCircle size={24} color="#333" />
                  <Text style={styles.errorText}>SIGNAL_LOST</Text>
                </View>
              )}

              <View style={styles.slotBadge}>
                <Text style={styles.badgeText}>CH_{index + 1} // {slot.tier.toUpperCase()}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.hudWrapper} pointerEvents="none">
        <View style={styles.hudLeft}>
          <View style={styles.hudLogo}><View style={styles.hudLogoInner} /></View>
          <Text style={styles.hudTitle}>AXIOM_LIVE_FEED</Text>
        </View>
        <View style={styles.hudRight}>
          <Wifi size={10} color="#22c55e" />
          <Text style={styles.syncText}>SYNC: {lastSync}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  centerContainer: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  loaderText: { color: 'white', fontSize: 10, letterSpacing: 4, marginTop: 20, textTransform: 'uppercase' },
  emptyTitle: { color: '#333', fontSize: 10, letterSpacing: 5, marginTop: 20, textTransform: 'uppercase' },
  gridContainer: { flex: 1, flexDirection: 'row', flexWrap: 'wrap' },
  baseSlot: { backgroundColor: '#050505', borderWidth: 0.5, borderColor: '#111', overflow: 'hidden' },
  errorSlot: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#222', fontSize: 8, marginTop: 10, letterSpacing: 2 },
  slotBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 2 },
  badgeText: { color: 'rgba(255,255,255,0.5)', fontSize: 7, fontWeight: '900' },
  hudWrapper: { position: 'absolute', top: 0, left: 0, right: 0, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  hudLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hudLogo: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  hudLogoInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'black' },
  hudTitle: { color: 'white', fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  hudRight: { flexDirection: 'row', alignItems: 'center', gap: 8, opacity: 0.4 },
  syncText: { color: 'white', fontSize: 8, fontWeight: '700' }
});
