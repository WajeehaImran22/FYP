//PAGE
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminAPI } from '@/lib/api';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Terminal, 
  Search, 
  LogOut, 
  User,
  Database,
  Cpu
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const data = await adminAPI.getLogs();
      setLogs(data);
    } catch (err: any) {
      // If the backend returns 403 Forbidden, kick them out
      alert(`ACCESS DENIED: ${err.message}`);
      router.push('/dashboard'); 
    } finally {
      setIsLoading(false);
    }
  };

  // Filter logs based on search bar and status toggles
  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'all' || log.status === filter;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      log.file_name.toLowerCase().includes(searchLower) ||
      log.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      log.profiles?.email?.toLowerCase().includes(searchLower);
    
    return matchesFilter && matchesSearch;
  });

  // Calculate quick stats
  const totalLogs = logs.length;
  const totalApproved = logs.filter(l => l.status === 'approved').length;
  const totalRejected = logs.filter(l => l.status === 'rejected').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white font-mono text-center">
        <ShieldAlert className="w-12 h-12 mb-6 animate-pulse" />
        <p className="text-[10px] tracking-[0.4em] uppercase opacity-50">Verifying_Admin_Clearance...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-black font-sans selection:bg-black selection:text-white pb-20">
      
      {/* HEADER */}
      <nav className="border-b border-zinc-200 p-6 flex justify-between items-center bg-white sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-red-600 rounded-sm flex items-center justify-center">
            <Terminal className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-black uppercase tracking-[0.3em] text-red-600">OVERSEER // GLOBAL_AUDIT</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-[10px] font-bold border border-black px-4 py-2 hover:bg-black hover:text-white transition uppercase tracking-widest">User Mode</Link>
          <button onClick={() => router.push('/auth')} className="text-zinc-400 hover:text-black transition"><LogOut className="w-5 h-5" /></button>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto p-6 mt-8">
        
        {/* STATS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white border border-zinc-200 p-6 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Total_Scans</p>
              <p className="text-4xl font-black">{totalLogs}</p>
            </div>
            <Database className="w-8 h-8 text-zinc-200" />
          </div>
          <div className="bg-white border border-green-200 p-6 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-mono text-green-600 uppercase tracking-widest mb-1">Cleared_Uploads</p>
              <p className="text-4xl font-black text-green-600">{totalApproved}</p>
            </div>
            <ShieldCheck className="w-8 h-8 text-green-200" />
          </div>
          <div className="bg-white border border-red-200 p-6 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-mono text-red-600 uppercase tracking-widest mb-1">Blocked_Anomalies</p>
              <p className="text-4xl font-black text-red-600">{totalRejected}</p>
            </div>
            <ShieldAlert className="w-8 h-8 text-red-200" />
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8">
          <div className="flex bg-white border border-zinc-200 p-1 w-full md:w-auto">
            <button onClick={() => setFilter('all')} className={`px-6 py-2 text-[10px] uppercase font-bold tracking-widest transition-colors ${filter === 'all' ? 'bg-black text-white' : 'hover:bg-zinc-100 text-zinc-500'}`}>All</button>
            <button onClick={() => setFilter('approved')} className={`px-6 py-2 text-[10px] uppercase font-bold tracking-widest transition-colors ${filter === 'approved' ? 'bg-green-600 text-white' : 'hover:bg-zinc-100 text-zinc-500'}`}>Approved</button>
            <button onClick={() => setFilter('rejected')} className={`px-6 py-2 text-[10px] uppercase font-bold tracking-widest transition-colors ${filter === 'rejected' ? 'bg-red-600 text-white' : 'hover:bg-zinc-100 text-zinc-500'}`}>Rejected</button>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search users, files, or emails..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-zinc-200 pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
            />
          </div>
        </div>

        {/* AUDIT LOG FEED */}
        <div className="space-y-4">
          {filteredLogs.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-zinc-200 bg-white">
              <p className="text-zinc-400 font-mono text-[10px] uppercase tracking-widest">No_Logs_Match_Query</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div 
                key={log.id} 
                className={`bg-white border-l-4 shadow-sm p-6 flex flex-col md:flex-row gap-6 ${log.status === 'rejected' ? 'border-red-500' : 'border-green-500'}`}
              >
                {/* Left: User & File Info */}
                <div className="flex-shrink-0 md:w-1/4 border-b md:border-b-0 md:border-r border-zinc-100 pb-4 md:pb-0 md:pr-6">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-4 h-4 text-zinc-400" />
                    <div>
                      <p className="text-sm font-bold truncate">{log.profiles?.full_name || 'Unknown Operator'}</p>
                      <p className="text-[10px] font-mono text-zinc-500 truncate">{log.profiles?.email}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">File_Target:</p>
                    <p className="text-xs font-mono text-black truncate" title={log.file_name}>{log.file_name}</p>
                  </div>
                </div>

                {/* Middle: Status & Reason */}
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest ${log.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {log.status}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 uppercase flex items-center gap-1">
                      <Cpu className="w-3 h-3" /> {log.moderated_by}
                    </span>
                  </div>
                  <div className={`p-4 rounded-md text-sm leading-relaxed border ${log.status === 'rejected' ? 'bg-red-50/50 border-red-100 text-red-900 font-medium' : 'bg-zinc-50 border-zinc-100 text-zinc-600'}`}>
                    {log.reason}
                  </div>
                </div>

                {/* Right: Timestamp */}
                <div className="flex-shrink-0 md:w-32 text-right flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Timestamp</p>
                    <p className="text-[10px] font-mono">{new Date(log.created_at).toLocaleDateString()}</p>
                    <p className="text-[10px] font-mono text-zinc-500">{new Date(log.created_at).toLocaleTimeString()}</p>
                  </div>
                  <div className="text-[9px] font-mono text-zinc-300 uppercase tracking-widest mt-4">
                    ID: {log.id.split('-')[0]}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </main>
    </div>
  );
}
