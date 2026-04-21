'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI, setToken } from '@/lib/api';
import { ArrowRight, ArrowLeft, Shield, Command, Key } from 'lucide-react';

type AuthView = 'login' | 'signup' | 'forgot';

export default function AuthPage() {
  const router = useRouter();
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      if (token) {
        setToken(token);
        router.push('/dashboard');
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      if (view === 'forgot') {
        await authAPI.forgotPassword(email);
        setMessage({ text: 'Access link dispatched to your inbox.', type: 'success' });
      } else {
        const res = view === 'login' 
          ? await authAPI.login({ email, password })
          : await authAPI.signup({ email, password });
        
        if (res.session) {
          setToken(res.session.access_token);
          router.push('/dashboard'); 
        }
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Authentication sequence failed.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { url } = await authAPI.getGoogleAuthUrl();
      window.location.href = url;
    } catch (err) {
      setMessage({ text: 'OAuth provider unreachable.', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans flex flex-col md:flex-row selection:bg-black selection:text-white">
      
      {/* LEFT PANEL: SYSTEM INFO (Black Theme) */}
      <div className="hidden md:flex md:w-1/3 bg-black p-12 flex-col justify-between border-r border-black">
        <div>
           <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-12">
             <div className="w-3 h-3 bg-black rounded-full"></div>
           </div>
           <h1 className="text-4xl font-black text-white leading-none uppercase tracking-tighter">
             Digital <br/> Billboard <br/> <span className="text-zinc-600 italic">Management</span>
           </h1>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4 text-zinc-500">
            <Shield className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Secure Session Protocol</span>
          </div>
          <div className="flex items-center gap-4 text-zinc-500">
            <Command className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Hardware Sync Active</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: AUTH FORM (White Theme) */}
      <div className="flex-grow flex items-center justify-center p-8 relative">
        {/* Mobile Logo */}
        <div className="absolute top-8 left-8 md:hidden text-[10px] font-black uppercase tracking-widest">
          Billboard Management
        </div>

        <div className="max-w-md w-full">
          <Link href="/" className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mb-12 hover:line-through transition">
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> 
            Exit to Landing
          </Link>

          <header className="mb-12">
            <h2 className="text-5xl font-black uppercase tracking-tighter mb-2">
              {view === 'login' && 'Identity'}
              {view === 'signup' && 'Register'}
              {view === 'forgot' && 'Recovery'}
            </h2>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              {view === 'login' && 'Provide credentials for studio access'}
              {view === 'signup' && 'Initialize a new operator account'}
              {view === 'forgot' && 'Request temporary access link'}
            </p>
          </header>

          {message.text && (
            <div className={`mb-8 p-4 text-[11px] font-bold uppercase tracking-widest border ${
              message.type === 'error' ? 'bg-black text-white border-black' : 'bg-zinc-100 text-zinc-900 border-zinc-200'
            }`}>
              {message.text}
            </div>
          )}

          {view !== 'forgot' && (
            <button 
              onClick={handleGoogleAuth}
              className="w-full flex items-center justify-between border-2 border-black p-4 mb-8 hover:bg-black hover:text-white transition group"
            >
              <span className="text-xs font-black uppercase tracking-widest">Authorize with Google</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="group">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 group-focus-within:text-black transition">Operator Email</label>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b-2 border-zinc-200 p-2 focus:border-black outline-none transition text-sm font-bold"
                placeholder="SYSTEM_ID@NODE.COM"
              />
            </div>
            
            {view !== 'forgot' && (
              <div className="group">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 group-focus-within:text-black transition">Passcode</label>
                  {view === 'login' && (
                    <button type="button" onClick={() => setView('forgot')} className="text-[10px] font-bold text-zinc-400 hover:text-black hover:underline underline-offset-4">
                      FORGOT?
                    </button>
                  )}
                </div>
                <input 
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-zinc-200 p-2 focus:border-black outline-none transition text-sm font-bold"
                  placeholder="••••••••"
                />
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-black text-white font-black uppercase tracking-[0.2em] p-5 text-sm hover:bg-zinc-800 transition disabled:opacity-30"
            >
              {isLoading ? 'Processing...' : (view === 'login' ? 'Execute Login' : view === 'signup' ? 'Create Node' : 'Dispatch Link')}
            </button>
          </form>

          <footer className="mt-12 pt-8 border-t border-zinc-100">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">
              {view === 'forgot' ? (
                <button onClick={() => setView('login')} className="text-black hover:line-through">Return to Login</button>
              ) : (
                <>
                  {view === 'login' ? "Unauthorized? " : "Existing Operator? "}
                  <button onClick={() => setView(view === 'login' ? 'signup' : 'login')} className="text-black font-black hover:line-through ml-1">
                    {view === 'login' ? 'Register Account' : 'Switch to Login'}
                  </button>
                </>
              )}
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}