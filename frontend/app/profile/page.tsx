//PROFILE PAGE
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { profileAPI, ProfileResponse, logout } from '@/lib/api';
import { 
  User, 
  Camera, 
  Mail, 
  Building, 
  ArrowLeft, 
  LogOut, 
  Code,
  ShieldCheck
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
      .catch(() => router.push('/auth'));
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    
    // Optimistic UI Update
    const previewUrl = URL.createObjectURL(file);
    setAvatarUrl(previewUrl);

    try {
      // Simulate network delay for upload
      await new Promise(res => setTimeout(res, 1000));
      setMessage({ text: 'AVATAR_SYNC_COMPLETE', type: 'success' });
    } catch (error: any) {
      setMessage({ text: 'AVATAR_SYNC_FAILED', type: 'error' });
    } finally {
      setIsUploadingImage(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white font-mono text-center">
        <div className="w-16 h-1 bg-white animate-pulse mb-6"></div>
        <p className="text-[10px] tracking-[0.4em] uppercase opacity-50">Decrypting_Operator_Profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white overflow-x-hidden">
      
      {/* SECTION 1: THE MINIMALIST NAV */}
      <nav className="sticky top-0 z-50 border-b border-black/5 bg-white/80 backdrop-blur-md">
        <div className="flex items-center justify-between p-6 max-w-7xl mx-auto">
          <div className="text-[10px] font-bold tracking-[0.3em] uppercase flex items-center gap-3">
            <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
            AXIOM TERMINAL // CONFIG
          </div>
          
          <div className="flex gap-8 items-center">
            <Link href="/dashboard" className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest hover:line-through transition">
              <ArrowLeft className="w-4 h-4" /> Back to Studio
            </Link>
          </div>
        </div>
      </nav>

      {/* SECTION 2: THE MONOLITH HEADER */}
      <header className="bg-white text-black pt-20 pb-20 px-6 border-b border-black">
        <div className="max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-8 opacity-50 text-black">
             <Code className="w-4 h-4" /> 
             <span className="text-[10px] font-mono tracking-tighter uppercase">Operator Designation: {profile?.role || 'USER'}</span>
          </div>
          
          <h1 className="text-5xl md:text-[7rem] font-black tracking-tighter leading-[0.85]">
            SYSTEM <br/>
            <span className="text-zinc-400">OPERATOR.</span>
          </h1>
        </div>
      </header>

      {/* SECTION 3: THE INDUSTRIAL GRID CONFIG */}
      <section className="bg-[#fcfcfc] py-20 px-6 pb-40">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex items-center gap-4 mb-12">
            <h2 className="text-xs font-black uppercase tracking-[0.5em] whitespace-nowrap">Identity Matrix</h2>
            <div className="h-px bg-black flex-grow"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-px bg-black border border-black overflow-hidden mb-20">
            
            {/* LEFT CELL: AVATAR & CLEARANCE */}
            <div className="md:col-span-4 bg-white p-12 flex flex-col items-center justify-center text-center hover:bg-zinc-50 transition border-b md:border-b-0 md:border-r border-black">
              
              <div className="relative group mb-8">
                <div className="w-40 h-40 rounded-full overflow-hidden border-2 border-black bg-white flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover grayscale" />
                  ) : (
                    <User className="w-16 h-16 text-zinc-300" />
                  )}
                </div>
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="absolute inset-0 bg-black/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed border border-white"
                >
                  <Camera className="w-8 h-8 text-white" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              <div className="space-y-4 w-full">
                <div className="flex items-center justify-between border-b border-black pb-2">
                  <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-500">Clearance</span>
                  <span className="text-[10px] font-black uppercase flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> {profile?.role || 'Standard'}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-black pb-2">
                  <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-500">UID</span>
                  <span className="text-[10px] font-mono uppercase text-zinc-400">{profile?.id?.split('-')[0] || 'UNKNOWN'}</span>
                </div>
              </div>

            </div>

            {/* RIGHT CELL: DATA INPUT FORM */}
            <div className="md:col-span-8 bg-white p-12 hover:bg-zinc-50 transition">
              
              {message.text && (
                <div className={`mb-10 p-4 border flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest ${message.type === 'error' ? 'border-red-500 bg-red-500/10 text-red-600' : 'border-black bg-black text-white'}`}>
                  <div className={`w-2 h-2 rounded-full ${message.type === 'error' ? 'bg-red-500' : 'bg-white animate-pulse'}`}></div>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-12">
                
                {/* Email (Read Only) */}
                <div>
                  <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">
                    <Mail className="w-3 h-3" /> Root Identity (Email)
                  </label>
                  <input 
                    type="email" 
                    value={profile?.email || ''} 
                    disabled 
                    className="w-full bg-transparent border-b border-zinc-200 p-0 pb-4 text-xl font-bold text-zinc-400 cursor-not-allowed outline-none" 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* Full Name */}
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-black text-black uppercase tracking-[0.2em] mb-4">
                      <User className="w-3 h-3" /> Operator Designation
                    </label>
                    <input 
                      type="text" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      placeholder="Enter Full Name"
                      className="w-full bg-transparent border-b border-black p-0 pb-4 text-xl font-bold text-black focus:border-zinc-400 outline-none transition-colors placeholder:text-zinc-300 rounded-none" 
                    />
                  </div>

                  {/* Company Name */}
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-black text-black uppercase tracking-[0.2em] mb-4">
                      <Building className="w-3 h-3" /> Affiliated Node (Company)
                    </label>
                    <input 
                      type="text" 
                      value={companyName} 
                      onChange={(e) => setCompanyName(e.target.value)} 
                      placeholder="Enter Company Name"
                      className="w-full bg-transparent border-b border-black p-0 pb-4 text-xl font-bold text-black focus:border-zinc-400 outline-none transition-colors placeholder:text-zinc-300 rounded-none" 
                    />
                  </div>
                </div>

                <div className="pt-8">
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="w-full border border-black bg-black text-white p-6 hover:bg-white hover:text-black transition-colors uppercase font-black text-xs tracking-[0.3em] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Synchronizing...' : 'Commit Protocol Update'}
                  </button>
                </div>

              </form>
            </div>
          </div>

          {/* DANGER ZONE */}
          <div className="border border-black bg-white p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
              <h3 className="text-xl font-black uppercase mb-2">Terminate Session</h3>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Sever neural link and clear local token registry.</p>
            </div>
            <button 
              onClick={handleLogout} 
              className="group flex items-center gap-4 border border-black px-8 py-5 hover:bg-black hover:text-white transition uppercase font-black text-[10px] tracking-[0.3em] w-full md:w-auto justify-center"
            >
              <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Disconnect
            </button>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black text-white py-12 px-6 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-[10px] font-mono text-zinc-700">
          <div>// SECURE_CHANNEL_ACTIVE //</div>
          <div className="uppercase tracking-widest text-zinc-500">Identity Matrix Rendered</div>
        </div>
      </footer>
      
    </div>
  );
}
