/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Calendar, User, Terminal, Globe, Search } from 'lucide-react';

interface AuditLog {
  id: number;
  user_id: number | null;
  user_email: string | null;
  action: string;
  description: string;
  ip_address: string | null;
  created_at: string;
}

export default function AuditLogsPage() {
  const { token, hasRole } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/audit-logs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const result = await response.json();
        setLogs(result.data || []);
      }
    } catch (err) {
      console.error('Failed to load audit trails:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  // Filter in client
  const filteredLogs = logs.filter(l => 
    (l.user_email && l.user_email.toLowerCase().includes(search.toLowerCase())) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.description.toLowerCase().includes(search.toLowerCase())
  );

  if (!hasRole(['Super Admin', 'Ketua MWC', 'Sekretaris'])) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-8 rounded-2xl max-w-xl mx-auto text-center space-y-3 mt-10">
        <ShieldCheck className="w-12 h-12 text-red-600 mx-auto" />
        <h3 className="font-display font-bold text-lg">Akses Ditolak (RBAC Restriction)</h3>
        <p className="text-xs font-medium">Halaman ini dilindungi oleh sistem keamanan organisasi. Hanya Ketua MWC, Sekretaris, dan Super Admin yang diizinkan memantau jejak keamanan digital sistem.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-emerald-950">Jejak Transparansi (Audit Logs)</h2>
          <p className="text-slate-500 text-xs mt-0.5 font-medium font-sans">Rekam jejak mutasi data sensus warga, transaksi buku kas, pengajuan peminjaman aset, serta otentikasi operator secara real-time.</p>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="bg-white p-4 border border-slate-150 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari pengurus, aktivitas atau pesan log..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-brand-emerald focus:ring-1 focus:ring-emerald-500/10 rounded-xl py-2 pl-9 pr-4 text-xs font-medium outline-none transition-all placeholder:text-slate-400"
          />
        </div>
        <div className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-wider">
          {logs.length} Jejak Keamanan Terdaftar
        </div>
      </div>

      {/* LOGS TERMINAL FEED */}
      <div className="bg-[#111827] text-slate-300 rounded-3xl border border-slate-800 shadow-xl overflow-hidden font-mono text-[11px] leading-relaxed">
        
        {/* Terminal Header */}
        <div className="bg-[#1f2937] border-b border-slate-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2">SIM_MWC_AUDIT_CONSOLE v1.0.0</span>
          </div>
          <span className="text-[9px] bg-emerald-950 text-brand-emerald border border-brand-emerald/25 px-2 py-0.5 rounded">ONLINE</span>
        </div>

        {/* Terminal Body Feed */}
        {loading ? (
          <div className="p-8 text-center text-slate-500">Membuka saluran log audit organisasi...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Log konsol kosong.</div>
        ) : (
          <div className="p-6 divide-y divide-slate-800/60 max-h-[500px] overflow-y-auto space-y-3.5 pr-2">
            {filteredLogs.map((log) => (
              <div key={log.id} className="pt-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-left">
                <div className="space-y-1">
                  
                  {/* Action tag and email */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-emerald-900/30 text-brand-emerald-light border border-brand-emerald/20 text-[9px] font-bold px-1.5 py-0.5 rounded">
                      [{log.action.toUpperCase()}]
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 flex-shrink-0" /> {log.user_email || 'System / Guest'}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-slate-200 font-sans leading-relaxed pl-1 text-xs">
                    {log.description}
                  </p>
                </div>

                {/* Date & IP */}
                <div className="text-right text-slate-500 text-[10px] flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-1 mt-1 sm:mt-0">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(log.created_at).toLocaleString('id-ID')}
                  </span>
                  <span className="flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded">
                    <Globe className="w-3.5 h-3.5" />
                    IP: {log.ip_address || '127.0.0.1'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
