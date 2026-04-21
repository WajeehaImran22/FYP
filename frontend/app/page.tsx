'use client';

import Link from 'next/link';
import { 
  Sparkles, 
  CloudSun, 
  ShieldCheck, 
  Zap, 
  Globe, 
  LayoutDashboard, 
  ArrowRight,
  Maximize,
  Code
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white overflow-x-hidden">
      
      {/* SECTION 1: THE MINIMALIST NAV (White Theme) */}
      <nav className="sticky top-0 z-50 border-b border-black/5 bg-white/80 backdrop-blur-md">
        <div className="flex items-center justify-between p-6 max-w-7xl mx-auto">
          <div className="text-[10px] font-bold tracking-[0.3em] uppercase flex items-center gap-3">
            <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
            AI-Enhanced Digital Billboard Management
          </div>
          
          <div className="flex gap-8 items-center">
            <Link href="/auth" className="text-[11px] font-black uppercase tracking-widest hover:line-through transition">
              Login
            </Link>
            <Link href="/auth" className="text-[11px] font-black bg-black text-white px-6 py-3 uppercase tracking-widest hover:bg-zinc-800 transition shadow-2xl">
              Launch System
            </Link>
          </div>
        </div>
      </nav>

      {/* SECTION 2: THE MONOLITH HERO (Black Theme) */}
      <header className="relative bg-black text-white pt-32 pb-40 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-12 opacity-50">
             <Code className="w-4 h-4" /> 
             <span className="text-[10px] font-mono tracking-tighter uppercase">System Status: Operational // v1.0.4</span>
          </div>
          
          <h1 className="text-5xl md:text-[8rem] font-black tracking-tighter leading-[0.85] mb-12">
            AI-ENHANCED <br/>
            DIGITAL BILLBOARD <br/>
            <span className="text-zinc-500">MANAGEMENT.</span>
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-end">
            <p className="text-xl md:text-2xl text-zinc-400 font-light leading-tight max-w-lg">
              Dynamic scheduling powered by real-time environmental intelligence. 
              Built for precision, scale, and high-impact visual deployment.
            </p>
            <div className="flex flex-col gap-4">
              <Link href="/auth" className="group flex items-center justify-between border-b border-zinc-800 py-6 hover:border-white transition">
                <span className="text-2xl font-bold uppercase">Get Started</span>
                <ArrowRight className="group-hover:translate-x-2 transition-transform" />
              </Link>
              <Link href="#features" className="group flex items-center justify-between border-b border-zinc-800 py-6 hover:border-white transition">
                <span className="text-2xl font-bold uppercase">View Features</span>
                <ArrowRight className="group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* SECTION 3: THE INDUSTRIAL GRID (Paper/Grid Theme) */}
      <section id="features" className="bg-[#fcfcfc] py-32 px-6 border-b border-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-20">
            <div className="h-px bg-black flex-grow"></div>
            <h2 className="text-xs font-black uppercase tracking-[0.5em]">System Core Capabilities</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-px bg-black border border-black overflow-hidden">
            {/* Cell 1 */}
            <div className="md:col-span-8 bg-white p-12 hover:bg-zinc-50 transition">
              <CloudSun className="w-12 h-12 mb-8" />
              <h3 className="text-4xl font-black uppercase mb-4">Dynamic Scheduling</h3>
              <p className="text-zinc-600 max-w-md">Our engine synchronizes content with real-time weather and time-of-day data. High-precision ad delivery based on environmental triggers.</p>
            </div>
            {/* Cell 2 */}
            <div className="md:col-span-4 bg-white p-12 hover:bg-zinc-50 transition border-l border-black">
              <Zap className="w-12 h-12 mb-8" />
              <h3 className="text-xl font-bold uppercase mb-4">Parallel Stacking</h3>
              <p className="text-sm text-zinc-500 italic">"Veo 3.1 generation parallelized across multi-node clusters for 12s cinematic stitching."</p>
            </div>
            {/* Cell 3 */}
            <div className="md:col-span-4 bg-white p-12 hover:bg-zinc-50 transition border-t border-black">
              <ShieldCheck className="w-12 h-12 mb-8" />
              <h3 className="text-xl font-bold uppercase mb-4">Vision Guard</h3>
              <p className="text-sm text-zinc-500">Automated frame-by-frame moderation ensures all content adheres to public safety standards.</p>
            </div>
            {/* Cell 4 */}
            <div className="md:col-span-4 bg-white p-12 hover:bg-zinc-50 transition border-t border-l border-black">
              <Globe className="w-12 h-12 mb-8" />
              <h3 className="text-xl font-bold uppercase mb-4">Edge Hosting</h3>
              <p className="text-sm text-zinc-500">Instant global deployment via Supabase edge networks. Lowest latency media delivery for billboard hardware.</p>
            </div>
            {/* Cell 5 */}
            <div className="md:col-span-4 bg-white p-12 hover:bg-zinc-50 transition border-t border-l border-black">
              <LayoutDashboard className="w-12 h-12 mb-8" />
              <h3 className="text-xl font-bold uppercase mb-4">Context Archive</h3>
              <p className="text-sm text-zinc-500">Comprehensive history with AI-driven metadata tagging and contextual creative management.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: THE GLASS SHOWCASE (Inverted Glass Theme) */}
      <section className="bg-zinc-100 py-40 px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-7xl md:text-9xl font-black mb-12 opacity-5 select-none absolute -top-20 left-0 w-full">INTELLIGENCE</h2>
          <div className="bg-white/40 backdrop-blur-2xl border border-white p-1 rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-black aspect-video flex items-center justify-center relative">
              <img 
                src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2000&auto=format&fit=crop" 
                className="w-full h-full object-cover grayscale opacity-60" 
                alt="System Preview"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
              <div className="absolute bottom-10 left-10 text-left">
                <span className="text-[10px] font-mono border border-zinc-700 px-2 py-1 rounded">PREVIEW_MODE</span>
                <h4 className="text-white text-3xl font-black mt-4">AXIOM-01 TERMINAL</h4>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER: THE TECHNICAL LOG (Deep Black) */}
      <footer className="bg-black text-white py-20 px-6 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="max-w-md">
             <div className="text-2xl font-black tracking-tighter mb-4">
               AI-ENHANCED <span className="text-zinc-600 italic">SYSTEM</span>
             </div>
             <p className="text-zinc-500 text-xs leading-relaxed uppercase tracking-widest font-bold">
               A dynamic management ecosystem for modern digital signage. 
               Developed for the 2026 AI-driven advertising cycle.
             </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-20">
            <div className="space-y-4">
              <h5 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Platform</h5>
              <div className="flex flex-col gap-2 text-xs font-bold uppercase">
                <a href="#" className="hover:text-zinc-400">Architecture</a>
                <a href="#" className="hover:text-zinc-400">Veo Nodes</a>
              </div>
            </div>
            <div className="space-y-4">
              <h5 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Contact</h5>
              <div className="flex flex-col gap-2 text-xs font-bold uppercase">
                <a href="#" className="hover:text-zinc-400">Support</a>
                <a href="#" className="hover:text-zinc-400">Documentation</a>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-zinc-900 flex justify-between items-center text-[10px] font-mono text-zinc-700">
          <div>// SESSION: 2026.04.19 //</div>
          <div className="uppercase tracking-widest text-zinc-500">Dynamic Scheduling Protocol Active</div>
        </div>
      </footer>
    </div>
  );
}