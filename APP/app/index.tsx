\\index
  import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Image, 
  Dimensions,
  StatusBar
} from 'react-native';
import { Link } from 'expo-router';
import { 
  CloudSun, 
  ShieldCheck, 
  Zap, 
  Globe, 
  LayoutDashboard, 
  ArrowRight,
  Code
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function LandingPage() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* SECTION 1: THE MINIMALIST NAV */}
      <View style={styles.nav}>
        <View style={styles.logoContainer}>
          <View style={styles.logoDotOuter}>
            <View style={styles.logoDotInner} />
          </View>
          <Text style={styles.logoText}>AI-ENHANCED MANAGEMENT</Text>
        </View>
        
        <Link href="/auth" asChild>
          <TouchableOpacity style={styles.navBtn}>
            <Text style={styles.navBtnText}>LAUNCH</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* SECTION 2: THE MONOLITH HERO */}
        <View style={styles.hero}>
          <View style={styles.statusRow}>
            <Code size={14} color="#555" />
            <Text style={styles.statusText}>SYSTEM STATUS: OPERATIONAL // V1.0.4</Text>
          </View>
          
          <Text style={styles.heroTitle}>
            AI-ENHANCED{"\n"}
            DIGITAL{"\n"}
            BILLBOARD{"\n"}
            <Text style={{ color: '#555' }}>MANAGEMENT.</Text>
          </Text>
          
          <Text style={styles.heroSubtext}>
            Dynamic scheduling powered by real-time environmental intelligence. 
            Built for precision, scale, and high-impact visual deployment.
          </Text>

          <View style={styles.heroLinks}>
            <Link href="/auth" asChild>
              <TouchableOpacity style={styles.heroLinkItem}>
                <Text style={styles.heroLinkText}>GET STARTED</Text>
                <ArrowRight color="white" size={24} />
              </TouchableOpacity>
            </Link>
            
            <TouchableOpacity style={styles.heroLinkItem}>
              <Text style={styles.heroLinkText}>VIEW FEATURES</Text>
              <ArrowRight color="white" size={24} />
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION 3: THE INDUSTRIAL GRID */}
        <View style={styles.featuresSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.line} />
            <Text style={styles.sectionLabel}>SYSTEM CORE CAPABILITIES</Text>
          </View>

          <View style={styles.featureCardLarge}>
            <CloudSun size={48} color="black" strokeWidth={1.5} />
            <Text style={styles.featureTitle}>DYNAMIC{"\n"}SCHEDULING</Text>
            <Text style={styles.featureDesc}>
              Our engine synchronizes content with real-time weather and time-of-day data. 
              High-precision ad delivery based on environmental triggers.
            </Text>
          </View>

          <View style={styles.grid}>
            <View style={[styles.gridItem, { borderRightWidth: 1 }]}>
              <Zap size={32} color="black" />
              <Text style={styles.gridTitle}>PARALLEL{"\n"}STACKING</Text>
              <Text style={styles.gridSubText}>v3.1 multi-node clusters.</Text>
            </View>
            <View style={styles.gridItem}>
              <ShieldCheck size={32} color="black" />
              <Text style={styles.gridTitle}>VISION{"\n"}GUARD</Text>
              <Text style={styles.gridSubText}>Automated moderation.</Text>
            </View>
          </View>

          <View style={styles.grid}>
            <View style={[styles.gridItem, { borderRightWidth: 1, borderTopWidth: 0 }]}>
              <Globe size={32} color="black" />
              <Text style={styles.gridTitle}>EDGE{"\n"}HOSTING</Text>
            </View>
            <View style={[styles.gridItem, { borderTopWidth: 0 }]}>
              <LayoutDashboard size={32} color="black" />
              <Text style={styles.gridTitle}>CONTEXT{"\n"}ARCHIVE</Text>
            </View>
          </View>
        </View>

        {/* SECTION 4: THE GLASS SHOWCASE */}
        <View style={styles.previewSection}>
          <Text style={styles.bgWatermark}>INTELLIGENCE</Text>
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000' }} 
              style={styles.previewImage}
              resizeMode="cover"
            />
            <View style={styles.overlayGradient}>
              {/* FIXED: This property now exists below */}
              <View style={styles.overlayContent}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>PREVIEW_MODE</Text>
                </View>
                <Text style={styles.previewTitle}>AXIOM-01 TERMINAL</Text>
              </View>
            </View>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={styles.footerTop}>
            <Text style={styles.footerBrand}>
              AI-ENHANCED <Text style={styles.italic}>SYSTEM</Text>
            </Text>
            <Text style={styles.footerDescription}>
              A dynamic management ecosystem for modern digital signage. 
              Developed for the 2026 AI-driven advertising cycle.
            </Text>
          </View>
          
          <View style={styles.footerBottom}>
            <Text style={styles.footerLog}>// SESSION: 2026.04.19 //</Text>
            <Text style={styles.footerStatus}>PROTOCOL ACTIVE</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'white' 
  },
  nav: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1, 
    borderColor: '#f0f0f0' 
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoDotOuter: { 
    width: 18, 
    height: 18, 
    backgroundColor: 'black', 
    borderRadius: 9, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 10 
  },
  logoDotInner: { width: 5, height: 5, backgroundColor: 'white', borderRadius: 2.5 },
  logoText: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  navBtn: { 
    backgroundColor: 'black', 
    paddingHorizontal: 16, 
    paddingVertical: 10 
  },
  navBtnText: { color: 'white', fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  hero: { 
    backgroundColor: 'black', 
    paddingHorizontal: 25, 
    paddingTop: 60, 
    paddingBottom: 80 
  },
  statusRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 40, 
    opacity: 0.5 
  },
  statusText: { 
    color: 'white', 
    fontSize: 9, 
    marginLeft: 8, 
    letterSpacing: 0.5 
  },
  heroTitle: { 
    color: 'white', 
    fontSize: 48, 
    fontWeight: '900', 
    lineHeight: 46, 
    letterSpacing: -2, 
    marginBottom: 35 
  },
  heroSubtext: { 
    color: '#888', 
    fontSize: 18, 
    lineHeight: 24, 
    fontWeight: '300',
    marginBottom: 50 
  },
  heroLinks: { 
    marginTop: 10 
  },
  heroLinkItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 25, 
    borderBottomWidth: 1, 
    borderBottomColor: '#222' 
  },
  heroLinkText: { 
    color: 'white', 
    fontSize: 22, 
    fontWeight: '800' 
  },

  featuresSection: { 
    paddingHorizontal: 20, 
    backgroundColor: '#fcfcfc',
    paddingBottom: 60 
  },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginVertical: 50 
  },
  line: { flex: 1, height: 1, backgroundColor: 'black', marginRight: 15 },
  sectionLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 4 },
  
  featureCardLarge: { 
    padding: 30, 
    backgroundColor: 'white', 
    borderWidth: 1, 
    borderColor: 'black'
  },
  featureTitle: { 
    fontSize: 32, 
    fontWeight: '900', 
    marginTop: 25, 
    marginBottom: 15,
    lineHeight: 30 
  },
  featureDesc: { fontSize: 15, color: '#666', lineHeight: 22 },
  
  grid: { flexDirection: 'row' },
  gridItem: { 
    flex: 1, 
    padding: 25, 
    height: 180, 
    backgroundColor: 'white',
    borderWidth: 1, 
    borderColor: 'black',
    marginTop: -1,
    marginLeft: -1,
    justifyContent: 'center' 
  },
  gridTitle: { fontSize: 14, fontWeight: '900', marginTop: 15, textTransform: 'uppercase' },
  gridSubText: { fontSize: 10, color: '#999', marginTop: 5, fontStyle: 'italic' },

  previewSection: { 
    padding: 25, 
    backgroundColor: '#f0f0f0', 
    paddingVertical: 100,
    alignItems: 'center',
    position: 'relative'
  },
  bgWatermark: { 
    position: 'absolute', 
    top: 40, 
    fontSize: 80, 
    fontWeight: '900', 
    opacity: 0.03, 
    letterSpacing: -5 
  },
  imageContainer: { 
    width: '100%', 
    aspectRatio: 16/10, 
    backgroundColor: 'black', 
    borderRadius: 2, 
    overflow: 'hidden'
  },
  previewImage: { width: '100%', height: '100%', opacity: 0.5 },
  overlayGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 25,
    backgroundColor: 'rgba(0,0,0,0.3)'
  },
  overlayContent: {
    width: '100%'
  },
  tag: { 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.3)', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    alignSelf: 'flex-start' 
  },
  tagText: { color: 'white', fontSize: 9 },
  previewTitle: { color: 'white', fontSize: 24, fontWeight: '900', marginTop: 12 },

  footer: { 
    backgroundColor: 'black', 
    padding: 40, 
    paddingBottom: 60 
  },
  footerTop: { marginBottom: 60 },
  footerBrand: { color: 'white', fontSize: 20, fontWeight: '900', marginBottom: 15 },
  italic: { fontStyle: 'italic', color: '#444' },
  footerDescription: { color: '#666', fontSize: 11, lineHeight: 18, textTransform: 'uppercase', letterSpacing: 1 },
  footerBottom: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    borderTopWidth: 1, 
    borderColor: '#222', 
    paddingTop: 20 
  },
  footerLog: { color: '#333', fontSize: 10 },
  footerStatus: { color: '#555', fontSize: 9, fontWeight: '700', letterSpacing: 1 }
});
