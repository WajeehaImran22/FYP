//schedule file
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  BackHandler,
  Pressable
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker'; // Native Picker
import { 
  Calendar, 
  Clock, 
  CreditCard, 
  ArrowLeft, 
  Zap,
  Calculator,
  LayoutGrid,
  Columns,
  Square,
  CheckCircle2,
  ChevronRight,
  AlertTriangle
} from 'lucide-react-native';

import { scheduleAPI, profileAPI } from '../../services/api'; 

// --- Dynamic Rate Calculator ---
const calculateDynamicRate = (dateStr: string, startTimeStr: string, hours: number, tier: string) => {
  if (!dateStr || !startTimeStr || !hours) return { total: 0, breakdown: [] };
  
  const baseRatePerHour = 50;
  const tierMultipliers = { basic: 1, standard: 1.8, premium: 3.5 };
  let total = 0;
  const breakdown: { label: string, value: string }[] = [];
  
  const startDate = new Date(`${dateStr}T${startTimeStr}`);
  const startHour = isNaN(startDate.getHours()) ? 12 : startDate.getHours();
  const isWeekend = startDate.getDay() === 0 || startDate.getDay() === 6;

  if (isWeekend) breakdown.push({ label: 'WEEKEND SURCHARGE', value: '+20%' });

  let peakHoursHit = 0;
  for (let i = 0; i < hours; i++) {
    let currentHour = (startHour + i) % 24;
    let hourMultiplier = 1;
    
    if (currentHour >= 7 && currentHour <= 9) { hourMultiplier = 1.5; peakHoursHit++; }
    else if (currentHour >= 16 && currentHour <= 19) { hourMultiplier = 1.8; peakHoursHit++; }
    else if (currentHour >= 0 && currentHour <= 5) { hourMultiplier = 0.4; }

    let hourlyRate = baseRatePerHour * (tierMultipliers[tier as keyof typeof tierMultipliers]);
    hourlyRate = hourlyRate * hourMultiplier;
    if (isWeekend) hourlyRate = hourlyRate * 1.2;
    total += hourlyRate;
  }

  if (peakHoursHit > 0) breakdown.push({ label: 'PEAK HOUR MULTIPLIER', value: 'ACTIVE' });
  breakdown.push({ label: 'TIER SELECTION', value: tier.toUpperCase() });
  
  return { total: Math.round(total), breakdown };
};

export default function SchedulePage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Form States
  const [dateObj, setDateObj] = useState(new Date());
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('12:00');
  const [duration, setDuration] = useState(1);
  const [tier, setTier] = useState<'basic' | 'standard' | 'premium'>('premium');
  
  // UI States
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [adDetails, setAdDetails] = useState<any>(null);
  const [priceEstimate, setPriceEstimate] = useState({ total: 0, breakdown: [] as any[] });
  const [isDeploying, setIsDeploying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  // RESTRICTION: Block Back Button
  useEffect(() => {
    const onBackPress = () => true;
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, []);

  // 1. Load Data
  useEffect(() => {
    const fetchAdContext = async () => {
      try {
        const history = await profileAPI.getHistory();
        const targetAd = history.find(item => item.id === id);
        if (targetAd) setAdDetails(targetAd);
        else setStatusMessage({ text: 'SYSTEM_ERROR: ASSET_NOT_FOUND', type: 'error' });
      } catch (err) {
        setStatusMessage({ text: 'SYSTEM_ERROR: RETRIEVAL_FAILED', type: 'error' });
      }
    };
    if (id) fetchAdContext();
  }, [id]);

  // 2. Update Billing
  useEffect(() => {
    const estimate = calculateDynamicRate(date, time, duration, tier);
    setPriceEstimate(estimate);
  }, [date, time, duration, tier]);

  // 3. Date/Time Handlers
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateObj(selectedDate);
      setDate(selectedDate.toISOString().split('T')[0]);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const mins = selectedTime.getMinutes().toString().padStart(2, '0');
      setTime(`${hours}:${mins}`);
    }
  };

  const handleDeploy = async () => {
    if (!adDetails) return;
    setStatusMessage(null);
    setIsDeploying(true);
    try {
      await scheduleAPI.deploy({
        ad_id: id as string,
        media_url: adDetails.url,       
        media_type: adDetails.media_type, 
        date, time, duration_hours: duration, tier,
        total_price: priceEstimate.total
      });
      setStatusMessage({ text: 'PROTOCOL_ACCEPTED: DEPLOYMENT_SYNCED', type: 'success' });
      setTimeout(() => router.replace('/dashboard'), 2000);
    } catch (error: any) {
      setStatusMessage({ text: `SYSTEM_ERROR: ${error.message.toUpperCase()}`, type: 'error' });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.nav}>
            <View style={styles.navLeft}>
              <View style={styles.navDotOuter}><View style={styles.navDotInner} /></View>
              <Text style={styles.navTitle}>AXIOM // DEPLOYMENT_NODE</Text>
            </View>
            <TouchableOpacity onPress={() => router.replace('/dashboard')} style={styles.navBtn}>
              <ArrowLeft size={10} color="black" />
              <Text style={styles.navBtnText}>ABORT_PROTOCOL</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mainLayout}>
            <View style={styles.configArea}>
              <View style={styles.headerBlock}>
                <View style={styles.subHeader}>
                  <Zap size={10} color="#71717a" fill="#71717a" />
                  <Text style={styles.subHeaderText}>TARGET_DEPLOYMENT_PARAMETERS</Text>
                </View>
                <Text style={styles.heroText}>CAMPAIGN{'\n'}<Text style={styles.heroTextMuted}>SCHEDULING.</Text></Text>
                <View style={styles.assetIdBlock}><Text style={styles.assetIdText}>ASSET_ID: {id}</Text></View>
              </View>

              {/* 01. TIER SELECTION */}
              <View style={styles.moduleSection}>
                <Text style={styles.moduleTitle}>01. SPATIAL MAPPING</Text>
                <View style={styles.tierGrid}>
                  {[
                    { id: 'premium', icon: Square, label: 'PREMIUM', desc: '100% CANVAS TAKEOVER' },
                    { id: 'standard', icon: Columns, label: 'STANDARD', desc: '50% SEGMENT PARTITION' },
                    { id: 'basic', icon: LayoutGrid, label: 'BASIC', desc: '25% QUADRANT HOSTING' }
                  ].map((t, index) => (
                    <TouchableOpacity 
                      key={t.id}
                      onPress={() => setTier(t.id as any)}
                      style={[styles.tierBtn, tier === t.id && styles.tierBtnActive, index !== 2 && styles.tierBtnBorder]}
                    >
                      <t.icon size={30} color={tier === t.id ? 'white' : 'black'} />
                      <View style={styles.tierTextContainer}>
                        <Text style={[styles.tierLabel, tier === t.id && { color: 'white' }]}>{t.label}</Text>
                        <Text style={[styles.tierDesc, tier === t.id ? { color: '#a1a1aa' } : { color: '#71717a' }]}>{t.desc}</Text>
                      </View>
                      {tier === t.id && <View style={styles.tierCheck}><CheckCircle2 size={16} color="white" /></View>}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 02. TEMPORAL WINDOW */}
              <View style={styles.moduleSection}>
                <Text style={styles.moduleTitle}>02. TEMPORAL ALIGNMENT</Text>
                <View style={styles.temporalGrid}>
                  
                  {/* Date Input */}
                  <Pressable onPress={() => setShowDatePicker(true)} style={styles.temporalInputBox}>
                    <Text style={styles.temporalLabel}>TARGET DATE</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput value={date} editable={false} style={styles.textInput} />
                      <Calendar size={16} color="black" />
                    </View>
                  </Pressable>

                  {/* Time Input */}
                  <Pressable onPress={() => setShowTimePicker(true)} style={styles.temporalInputBox}>
                    <Text style={styles.temporalLabel}>SYNC_TIME</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput value={time} editable={false} style={styles.textInput} />
                      <Clock size={16} color="black" />
                    </View>
                  </Pressable>

                  {/* Duration Input */}
                  <View style={styles.temporalInputBox}>
                    <Text style={styles.temporalLabel}>DURATION (HRS)</Text>
                    <View style={styles.durationWrapper}>
                      <TouchableOpacity onPress={() => setDuration(Math.max(1, duration - 1))} style={styles.durBtn}><Text style={styles.durBtnText}>-</Text></TouchableOpacity>
                      <Text style={styles.durValue}>{duration}</Text>
                      <TouchableOpacity onPress={() => setDuration(duration + 1)} style={styles.durBtn}><Text style={styles.durBtnText}>+</Text></TouchableOpacity>
                    </View>
                  </View>

                </View>
              </View>
            </View>

            {/* CALCULATOR TERMINAL */}
            <View style={styles.calculatorTerminal}>
              <View style={styles.calcHeader}>
                <View style={styles.calcHeaderLeft}><Calculator size={10} color="#a1a1aa" /><Text style={styles.calcHeaderText}>BILLING_TELEMETRY</Text></View>
                <Text style={styles.calcCode}>CODE: AX-002</Text>
              </View>

              {statusMessage && (
                <View style={[styles.statusBanner, statusMessage.type === 'error' ? styles.statusError : styles.statusSuccess]}>
                  {statusMessage.type === 'error' ? <AlertTriangle size={14} color="#ef4444" /> : <CheckCircle2 size={14} color="#22c55e" />}
                  <Text style={[styles.statusBannerText, statusMessage.type === 'error' ? { color: '#ef4444' } : { color: '#22c55e' }]}>{statusMessage.text}</Text>
                </View>
              )}

              <View style={styles.breakdownList}>
                <View style={styles.breakdownItem}><Text style={styles.breakdownLabel}>BASE_FREQUENCY</Text><Text style={styles.breakdownValue}>$50.00 / hr</Text></View>
                {priceEstimate.breakdown.map((item, idx) => (
                  <View key={idx} style={styles.breakdownItem}><Text style={styles.breakdownLabel}>{item.label}</Text><Text style={styles.breakdownValueDark}>{item.value}</Text></View>
                ))}
              </View>

              <View style={styles.totalBlock}>
                <Text style={styles.totalLabel}>TOTAL_CHARGE_USD</Text>
                <Text style={styles.totalValue}>${priceEstimate.total.toLocaleString()}</Text>
              </View>

              <TouchableOpacity 
                onPress={handleDeploy}
                disabled={isDeploying || statusMessage?.type === 'success' || !date}
                style={[styles.executeBtn, statusMessage?.type === 'success' && styles.executeSuccess, (isDeploying || !date) && styles.executeDisabled]}
              >
                {isDeploying ? <ActivityIndicator color="black" /> : <CreditCard size={14} color={statusMessage?.type === 'success' ? 'white' : 'black'} />}
                <Text style={[styles.executeBtnText, statusMessage?.type === 'success' && { color: 'white' }]}>
                  {isDeploying ? 'SYNCING...' : statusMessage?.type === 'success' ? 'PROTOCOL_ACCEPTED' : 'EXECUTE_PAYMENT'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.footer}><Text style={styles.footerText}>SYSTEM_ACTIVE // SESSION_2026</Text></View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL PICKERS */}
      {showDatePicker && (
        <DateTimePicker value={dateObj} mode="date" display="default" onChange={onDateChange} />
      )}
      {showTimePicker && (
        <DateTimePicker value={dateObj} mode="time" is24Hour={true} display="default" onChange={onTimeChange} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  scrollContent: { paddingBottom: 20 },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: 'black' },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  navDotOuter: { width: 16, height: 16, backgroundColor: 'black', borderRadius: 8, justifyContent: 'center' },
  navDotInner: { width: 4, height: 4, backgroundColor: 'white', borderRadius: 2, alignSelf: 'center' },
  navTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: 'black', paddingHorizontal: 15, paddingVertical: 10 },
  navBtnText: { fontSize: 9, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  mainLayout: { padding: 20, gap: 40 },
  configArea: { gap: 40 },
  headerBlock: { marginBottom: 10 },
  subHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, opacity: 0.5, marginBottom: 15 },
  subHeaderText: { fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', textTransform: 'uppercase', letterSpacing: 1 },
  heroText: { fontSize: 48, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -2, lineHeight: 48, marginBottom: 20 },
  heroTextMuted: { color: '#d4d4d8' },
  assetIdBlock: { borderLeftWidth: 2, borderColor: '#f4f4f5', paddingLeft: 12 },
  assetIdText: { fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: '#a1a1aa', textTransform: 'uppercase' },
  moduleSection: { gap: 15 },
  moduleTitle: { fontSize: 10, fontWeight: '900', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: 3 },
  tierGrid: { borderWidth: 1, borderColor: 'black', backgroundColor: 'black' },
  tierBtn: { backgroundColor: 'white', padding: 25 },
  tierBtnBorder: { borderBottomWidth: 1, borderColor: 'black' },
  tierBtnActive: { backgroundColor: 'black' },
  tierTextContainer: { marginTop: 20 },
  tierLabel: { fontSize: 18, fontWeight: '900', textTransform: 'uppercase', marginBottom: 5 },
  tierDesc: { fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', textTransform: 'uppercase' },
  tierCheck: { position: 'absolute', top: 20, right: 20 },
  temporalGrid: { backgroundColor: '#fcfcfc', borderWidth: 1, borderColor: '#e4e4e7', padding: 20, gap: 20 },
  temporalInputBox: { gap: 10 },
  temporalLabel: { fontSize: 10, fontWeight: '900', color: 'black', textTransform: 'uppercase', letterSpacing: 2 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderColor: 'black', paddingBottom: 5 },
  textInput: { flex: 1, fontSize: 18, fontWeight: '900', color: 'black' },
  durationWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 2, borderColor: 'black' },
  durBtn: { padding: 5, width: 40 },
  durBtnText: { fontSize: 24, fontWeight: '300' },
  durValue: { fontSize: 24, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  calculatorTerminal: { backgroundColor: 'black', padding: 25, shadowOpacity: 0.3, shadowRadius: 30 },
  calcHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  calcHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  calcHeaderText: { color: 'white', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  calcCode: { color: 'white', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderWidth: 1, marginBottom: 25 },
  statusError: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' },
  statusSuccess: { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: '#22c55e' },
  statusBannerText: { fontSize: 9, textTransform: 'uppercase' },
  breakdownList: { gap: 15, marginBottom: 30 },
  breakdownItem: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#27272a', paddingBottom: 8 },
  breakdownLabel: { color: '#71717a', fontSize: 9, textTransform: 'uppercase' },
  breakdownValue: { color: 'white', fontSize: 16, fontWeight: '900' },
  breakdownValueDark: { color: '#e4e4e7', fontSize: 16, fontWeight: '900' },
  totalBlock: { backgroundColor: '#18181b', padding: 20, borderLeftWidth: 4, borderColor: 'white', marginBottom: 30 },
  totalLabel: { color: '#71717a', fontSize: 10, fontWeight: '900' },
  totalValue: { color: 'white', fontSize: 42, fontWeight: '900' },
  executeBtn: { backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20 },
  executeSuccess: { backgroundColor: '#16a34a' },
  executeDisabled: { opacity: 0.3 },
  executeBtnText: { color: 'black', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3 },
  footer: { padding: 40, alignItems: 'center', opacity: 0.3, borderTopWidth: 1, borderColor: '#f4f4f5' },
  footerText: { fontSize: 9, fontWeight: '900', color: 'black', textTransform: 'uppercase', letterSpacing: 4 }
});
