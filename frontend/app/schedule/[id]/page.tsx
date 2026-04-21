'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { scheduleAPI, profileAPI } from '@/lib/api'; 
import { 
  Calendar, 
  Clock, 
  CreditCard, 
  LayoutTemplate, 
  ArrowLeft, 
  Zap,
  Calculator,
  LayoutGrid,
  Columns,
  Square,
  Loader2,
  CheckCircle2,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

// --- Smart Calculator Algorithm ---
const calculateDynamicRate = (dateStr: string, startTimeStr: string, hours: number, tier: string) => {
  if (!dateStr || !startTimeStr || !hours) return { total: 0, breakdown: [] };
  
  const baseRatePerHour = 50;
  const tierMultipliers = { basic: 1, standard: 1.8, premium: 3.5 };
  let total = 0;
  const breakdown = [];
  
  const startDate = new Date(`${dateStr}T${startTimeStr}`);
  const startHour = startDate.getHours();
  const isWeekend = startDate.getDay() === 0 || startDate.getDay() === 6;

  if (isWeekend) breakdown.push({ label: 'Weekend Surcharge', value: '+20%' });

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

  if (peakHoursHit > 0) breakdown.push({ label: 'Peak Hour Multiplier', value: 'Active' });
  breakdown.push({ label: 'Tier Selection', value: tier.toUpperCase() });
  
  return { total: Math.round(total), breakdown };
};

export default function SchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [date, setDate] = useState('');
  const [time, setTime] = useState('12:00');
  const [duration, setDuration] = useState(1);
  const [tier, setTier] = useState<'basic' | 'standard' | 'premium'>('premium');
  
  // NEW: State for storing the specific ad data
  const [adDetails, setAdDetails] = useState<any>(null);
  const [priceEstimate, setPriceEstimate] = useState({ total: 0, breakdown: [] as any[] });
  const [isDeploying, setIsDeploying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  // 1. Fetch the specific ad data from history on load
  useEffect(() => {
    const fetchAdContext = async () => {
      try {
        const history = await profileAPI.getHistory();
        const targetAd = history.find(item => item.id === id);
        if (targetAd) {
          setAdDetails(targetAd);
        } else {
          setStatusMessage({ text: 'SYSTEM_ERROR: ASSET_NOT_FOUND_IN_HISTORY', type: 'error' });
        }
      } catch (err) {
        setStatusMessage({ text: 'SYSTEM_ERROR: FAILED_TO_RETRIEVE_ASSET_CONTEXT', type: 'error' });
      }
    };
    fetchAdContext();
  }, [id]);

  // 2. Update price estimate when parameters change
  useEffect(() => {
    const estimate = calculateDynamicRate(date, time, duration, tier);
    setPriceEstimate(estimate);
  }, [date, time, duration, tier]);

  const handleDeploy = async () => {
    if (!adDetails) {
      setStatusMessage({ text: 'ERROR: WAITING_FOR_ASSET_SYNCHRONIZATION', type: 'error' });
      return;
    }

    setStatusMessage(null);
    setIsDeploying(true);
    
    try {
      await scheduleAPI.deploy({
        ad_id: id,
        media_url: adDetails.url,       // Sent directly to schedule DB
        media_type: adDetails.media_type, // Sent directly to schedule DB
        date,
        time,
        duration_hours: duration,
        tier,
        total_price: priceEstimate.total
      });

      setStatusMessage({ text: 'PROTOCOL_ACCEPTED: DEPLOYMENT_SYNCED', type: 'success' });
      setTimeout(() => router.push('/dashboard'), 2000);

    } catch (error: any) {
      setStatusMessage({ 
        text: `SYSTEM_ERROR: ${error.message.toUpperCase()}`, 
        type: 'error' 
      });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
      
      {/* SECTION 1: NAV */}
      <nav className="border-b border-black p-6 flex justify-between items-center bg-white sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Axiom // Deployment_Node</span>
        </div>
        <Link href="/dashboard" className="flex items-center gap-2 text-[10px] font-black border border-black px-5 py-2.5 hover:bg-black hover:text-white transition uppercase tracking-widest">
          <ArrowLeft className="w-3 h-3" /> Abort_Protocol
        </Link>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* SECTION 2: CONFIGURATION MATRIX */}
        <div className="lg:col-span-8 space-y-16">
          <div>
            <div className="flex items-center gap-3 opacity-30 mb-4">
               <Zap className="w-4 h-4 fill-current" />
               <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Target_Deployment_Parameters</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-6">Campaign <br/><span className="text-zinc-300">Scheduling.</span></h1>
            <p className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest border-l-2 border-zinc-100 pl-4">Asset_ID: {id}</p>
          </div>

          {/* 01. TIER SELECTION */}
          <div className="space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400">01. Spatial Mapping</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-black border border-black overflow-hidden shadow-2xl">
              {[
                { id: 'premium', icon: Square, label: 'Premium', desc: '100% Canvas Takeover' },
                { id: 'standard', icon: Columns, label: 'Standard', desc: '50% Segment Partition' },
                { id: 'basic', icon: LayoutGrid, label: 'Basic', desc: '25% Quadrant Hosting' }
              ].map((t) => (
                <button 
                  key={t.id}
                  type="button"
                  onClick={() => setTier(t.id as any)}
                  className={`p-10 text-left transition-all relative group ${tier === t.id ? 'bg-black text-white' : 'bg-white text-black hover:bg-zinc-50'}`}
                >
                  <t.icon className={`w-10 h-10 mb-6 ${tier === t.id ? 'text-white' : 'text-black'}`} />
                  <h3 className="text-xl font-black uppercase tracking-tight mb-2">{t.label}</h3>
                  <p className={`text-[10px] font-mono leading-relaxed ${tier === t.id ? 'text-zinc-500' : 'text-zinc-400'}`}>{t.desc}</p>
                  {tier === t.id && <div className="absolute top-6 right-6"><CheckCircle2 className="w-4 h-4 text-white" /></div>}
                </button>
              ))}
            </div>
          </div>

          {/* 02. TEMPORAL WINDOW */}
          <div className="space-y-6 pb-20">
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400">02. Temporal Alignment</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-[#fcfcfc] border border-zinc-200 p-10 shadow-sm">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-black uppercase tracking-widest">Target Date</label>
                <div className="relative border-b-2 border-black pb-2 group cursor-pointer">
                  <Calendar className="w-4 h-4 absolute right-0 top-0 text-zinc-300 pointer-events-none group-hover:text-black transition-colors" />
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-transparent font-bold text-lg outline-none cursor-pointer appearance-none rounded-none" />
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-black uppercase tracking-widest">Sync_Time</label>
                <div className="relative border-b-2 border-black pb-2 group cursor-pointer">
                  <Clock className="w-4 h-4 absolute right-0 top-0 text-zinc-300 pointer-events-none group-hover:text-black transition-colors" />
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-transparent font-bold text-lg outline-none cursor-pointer appearance-none rounded-none" />
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-black uppercase tracking-widest">Duration (Hrs)</label>
                <div className="flex items-center justify-between border-b-2 border-black pb-2">
                  <button type="button" onClick={() => setDuration(Math.max(1, duration - 1))} className="text-2xl font-light hover:text-zinc-400 transition w-8">-</button>
                  <span className="text-2xl font-black font-mono">{duration}</span>
                  <button type="button" onClick={() => setDuration(duration + 1)} className="text-2xl font-light hover:text-zinc-400 transition w-8">+</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: CALCULATOR TERMINAL */}
        <div className="lg:col-span-4">
          <div className="bg-black text-white p-10 sticky top-32 shadow-[0_50px_100px_rgba(0,0,0,0.2)] border border-zinc-800">
            
            <div className="flex items-center justify-between mb-12 opacity-40">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                <span className="text-[10px] font-mono uppercase tracking-[0.3em]">Billing_Telemetry</span>
              </div>
              <span className="text-[10px] font-mono">CODE: AX-002</span>
            </div>

            {/* STATUS MESSAGE BANNER */}
            {statusMessage && (
              <div className={`mb-8 p-4 border flex items-center gap-3 text-[9px] font-mono uppercase tracking-widest animate-in fade-in slide-in-from-top-2 duration-300 ${statusMessage.type === 'error' ? 'border-red-500 bg-red-500/10 text-red-500' : 'border-green-500 bg-green-500/10 text-green-500'}`}>
                {statusMessage.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                {statusMessage.text}
              </div>
            )}

            <div className="space-y-8 mb-12">
              <div className="flex justify-between items-end border-b border-zinc-900 pb-4">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Base_Frequency</span>
                <span className="text-lg font-bold">$50.00 / hr</span>
              </div>
              {priceEstimate.breakdown.map((item, idx) => (
                <div key={idx} className="flex justify-between items-end border-b border-zinc-900 pb-4">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{item.label}</span>
                  <span className="text-lg font-bold text-zinc-200">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="bg-zinc-900 p-8 mb-10 border-l-4 border-white">
              <span className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-4">Total_Charge_USD</span>
              <div className="text-6xl font-black tracking-tighter tabular-nums">
                ${priceEstimate.total > 0 ? priceEstimate.total.toLocaleString() : '000'}
              </div>
            </div>

            <button 
              onClick={handleDeploy}
              type="button"
              disabled={isDeploying || statusMessage?.type === 'success' || !date || priceEstimate.total === 0}
              className={`w-full flex items-center justify-center gap-4 p-6 transition-all uppercase font-black text-[11px] tracking-[0.4em] disabled:opacity-30 disabled:cursor-not-allowed group border ${statusMessage?.type === 'success' ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-white text-black hover:bg-transparent hover:text-white'}`}
            >
              {isDeploying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : statusMessage?.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              {isDeploying ? 'Syncing...' : statusMessage?.type === 'success' ? 'Protocol_Accepted' : 'Execute_Payment'}
              {!isDeploying && statusMessage?.type !== 'success' && <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
            
            <p className="mt-8 text-center text-[9px] font-mono text-zinc-700 uppercase tracking-widest">
               // All_deployments_are_subject_to_Vision_Guard_policies
            </p>

          </div>
        </div>
      </main>

      <footer className="p-20 text-center border-t border-zinc-100 mt-20 opacity-20">
        <p className="text-[10px] font-black text-black uppercase tracking-[0.6em]">System_Active // Session_2026 // Axiom_Management</p>
      </footer>
    </div>
  );
}