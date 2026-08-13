/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, Landmark, Wallet, Package, Award, Sparkles, TrendingUp, Calendar, MapPin, CheckCircle2, ShieldCheck
} from 'lucide-react';

interface Stats {
  members: number;
  approvedCount: number;
  rantingsCount: number;
  banomsCount: number;
}

interface Member {
  id: number;
  ranting_id: number;
  ranting_name: string;
  status_sensus: string;
  potensi?: { id: number; name: string }[];
}

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<Stats>({
    members: 50,
    approvedCount: 35,
    rantingsCount: 20,
    banomsCount: 10
  });
  const [balance, setBalance] = useState(10150000); // Seeding balance default
  const [recentAgendas, setRecentAgendas] = useState<any[]>([]);
  const [rantingStatsList, setRantingStatsList] = useState<{ name: string; count: number }[]>([]);
  const [potentialsStatsList, setPotentialsStatsList] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        // Load stats
        const resStats = await fetch('/api/public/stats');
        if (resStats.ok) {
          const d = await resStats.json();
          setStats(d.data);
        }

        // Load cash ledger
        const resLedger = await fetch('/api/keuangan', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resLedger.ok) {
          const d = await resLedger.json();
          setBalance(d.data.summary.current_balance);
        }

        // Load members list to build live charts
        const resSensus = await fetch('/api/sensus', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resSensus.ok) {
          const d = await resSensus.json();
          const membersList: Member[] = d.data || [];
          
          // 1. Group by Ranting
          const rMap: { [key: string]: number } = {};
          membersList.forEach(m => {
            rMap[m.ranting_name] = (rMap[m.ranting_name] || 0) + 1;
          });
          const rSorted = Object.entries(rMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // top 5
          setRantingStatsList(rSorted);

          // 2. Group by Potentials
          const pMap: { [key: string]: number } = {
            'Kyai / Ulama': 0,
            'Ustadz / Guru Ngaji': 0,
            'Qori / Qoriah': 0,
            'Praktisi IT / Programmer': 0,
            'Pelaku UMKM': 0,
            'Dosen / Tenaga Pendidik': 0,
            'Tenaga Medis': 0,
            'Aktivis Sosial': 0
          };
          membersList.forEach(m => {
            if (m.potensi) {
              m.potensi.forEach(p => {
                if (pMap[p.name] !== undefined) {
                  pMap[p.name] += 1;
                }
              });
            }
          });
          setPotentialsStatsList(Object.entries(pMap).map(([name, count]) => ({ name, count })));
        }

        // Load agendas dynamically from local storage with fallback
        const savedRaw = localStorage.getItem('mwc_agenda_items');
        let parsedAgendas: any[] = [];
        if (savedRaw) {
          try {
            parsedAgendas = JSON.parse(savedRaw);
          } catch (e) {
            console.error('Failed to parse saved agendas', e);
          }
        }
        
        if (parsedAgendas.length === 0) {
          const defaultList = [
            {
              id: 1,
              title: 'Konferensi Ranting NU Se-Kecamatan Karangpawitan',
              category: 'Konferensi',
              date: '2026-07-04',
              time_start: '08:00',
              time_end: '12:00',
              location: 'Aula Sekretariat MWC NU Karangpawitan',
              notes: 'Konsolidasi organisasi tingkat ranting se-Kecamatan Karangpawitan guna sinkronisasi data sensus mandiri serta pemilihan pengurus baru masa khidmat berikutnya.',
              target_audience: 'Semua Pengurus Ranting & MWC',
              organizer: 'Tanfidziyah MWC NU',
              pj_name: 'Kiai Ahmad (Ketua MWC)',
              status: 'Mendatang',
              is_public: true
            },
            {
              id: 2,
              title: 'Lailatul Ijtima & Pengajian Bulanan Rijalul Ansor',
              category: 'Pengajian',
              date: '2026-07-07',
              time_start: '19:30',
              time_end: '22:30',
              location: 'Masjid Jami At-Taqwa Ranting Godog',
              notes: 'Kajian kitab kuning, istighotsah kubro, dan penguatan ideologi Aswaja An-Nahdliyah bagi kader muda GP Ansor di Ranting Godog.',
              target_audience: 'Warga Nahdliyin & Pemuda GP Ansor',
              organizer: 'GP Ansor Karangpawitan',
              pj_name: 'Sahabat Ridwan (Ketua PAC GP Ansor)',
              status: 'Mendatang',
              is_public: true
            }
          ];
          parsedAgendas = defaultList;
          localStorage.setItem('mwc_agenda_items', JSON.stringify(defaultList));
        }

        // Format dates into Dashboard's expectations
        const formattedAgendas = parsedAgendas
          .filter(a => a.status === 'Mendatang' || a.status === 'Sedang Berlangsung')
          .slice(0, 5) // top 5
          .map(a => {
            const dateObj = new Date(a.date);
            const opt: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
            const formattedDate = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('id-ID', opt) : a.date;
            return {
              id: a.id,
              title: a.title,
              date: formattedDate,
              time: `${a.time_start} - ${a.time_end || 'selesai'} WIB`,
              location: a.location,
              is_public: a.is_public,
              status: a.status
            };
          });
        setRecentAgendas(formattedAgendas);

      } catch (err) {
        console.error('Failed to load dashboard analytical stats:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="space-y-6">
      
      {/* WELCOME BLOCK */}
      <div className="bg-gradient-to-r from-[#035a3f] to-brand-emerald-dark p-6 rounded-2xl text-white relative overflow-hidden shadow-md">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="relative z-10 space-y-2 max-w-xl">
          <span className="bg-brand-gold/25 border border-brand-gold/40 text-yellow-300 font-mono text-[9px] px-2.5 py-0.5 rounded uppercase tracking-widest font-semibold inline-block">
            Sesi Masuk Berhasil &bull; Operator
          </span>
          <h2 className="font-display font-bold text-xl md:text-2xl text-white">
            Selamat Datang, {user?.name || 'Pengurus MWC'}!
          </h2>
          <p className="text-emerald-100/80 text-xs font-light leading-relaxed">
            Anda login sebagai <span className="font-bold text-yellow-300">{user?.role === 'Viewer' ? "Jama'ah" : user?.role}</span> {user?.ranting_name ? `(${user?.ranting_name})` : user?.banom_name ? `(${user?.banom_name})` : '(Tingkat MWC / Global)'}. Anda memegang kendali atas manajemen data sensus 3NF dan log transaksi organisasi.
          </p>
        </div>
        <div className="absolute right-6 bottom-4 text-white/5 pointer-events-none hidden md:block">
          <Landmark className="w-32 h-32" />
        </div>
      </div>

      {/* STATS COUNTING GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* TOTAL MEMBERS */}
        <div className="bg-white p-5 border border-slate-150 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400">Total Sensus Warga</span>
            <p className="text-2xl font-bold font-display text-emerald-950">{stats.members}</p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-brand-emerald rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* VALIDATED KTA */}
        <div className="bg-white p-5 border border-slate-150 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400">Berkas Terverifikasi</span>
            <p className="text-2xl font-bold font-display text-emerald-950">
              {stats.approvedCount} <span className="text-xs text-slate-400 font-normal">({stats.members > 0 ? Math.round((stats.approvedCount / stats.members) * 100) : 0}%)</span>
            </p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-brand-emerald rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* FINANCE BALANCE */}
        <div className="bg-white p-5 border border-slate-150 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400">Saldo Buku Kas (3NF)</span>
            <p className="text-xl font-bold font-display text-emerald-600 truncate max-w-[150px]">{formatRupiah(balance)}</p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-brand-emerald rounded-xl">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* TOTAL RANTINGS */}
        <div className="bg-white p-5 border border-slate-150 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400">Struktur Ranting NU</span>
            <p className="text-2xl font-bold font-display text-emerald-950">{stats.rantingsCount}</p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-brand-emerald rounded-xl">
            <Landmark className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* DYNAMIC ANALYTIC GRID PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: SDM STRENGTHS MAP (POTENTIALS STATS) */}
        <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <Award className="w-5 h-5 text-brand-emerald" />
            <h3 className="font-bold text-slate-800 text-sm font-display">Pemetaan Kekuatan SDM (Potensi)</h3>
          </div>
          
          {loading ? (
            <p className="text-center py-8 text-slate-400 text-xs">Menghitung klasifikasi potensi...</p>
          ) : potentialsStatsList.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-xs">Potensi belum terdata.</p>
          ) : (
            <div className="space-y-3">
              {potentialsStatsList.map((pot) => {
                const maxVal = Math.max(...potentialsStatsList.map(p => p.count)) || 1;
                const percent = Math.round((pot.count / maxVal) * 100);
                return (
                  <div key={pot.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 font-semibold">{pot.name}</span>
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                        {pot.count} Orang
                      </span>
                    </div>
                    {/* Visual Bar */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-brand-emerald h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MIDDLE COLUMN: SENSUS ACTIVITY BY RANTINGS */}
        <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <TrendingUp className="w-5 h-5 text-brand-emerald" />
            <h3 className="font-bold text-slate-800 text-sm font-display">Aktivitas Sensus Ranting Tertinggi</h3>
          </div>

          {loading ? (
            <p className="text-center py-8 text-slate-400 text-xs">Menganalisis pengiriman berkas...</p>
          ) : rantingStatsList.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-xs">Data input ranting masih sepi.</p>
          ) : (
            <div className="space-y-3.5">
              {rantingStatsList.map((r, i) => (
                <div key={r.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-lg bg-emerald-50 text-brand-emerald border border-emerald-100 flex items-center justify-center font-bold font-mono text-[10px]">
                      {i + 1}
                    </span>
                    <span className="font-semibold text-slate-700">{r.name}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded">
                    {r.count} Sensus
                  </span>
                </div>
              ))}
              <p className="text-[10px] text-slate-400 italic leading-normal border-t border-slate-100 pt-3">
                Grafik di atas merepresentasikan 5 Ranting teraktif melakukan pendaftaran sensus ke database MWC.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: AGENDA & JADWAL TERDEKAT */}
        <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <Calendar className="w-5 h-5 text-brand-emerald" />
            <h3 className="font-bold text-slate-800 text-sm font-display">Agenda & Rapat Terdekat</h3>
          </div>

          <div className="space-y-3 max-h-[320px] overflow-y-auto">
            {recentAgendas.map((agenda) => (
              <div key={agenda.id} className="bg-slate-50/70 border border-slate-150 p-3.5 rounded-xl space-y-2 text-xs">
                <span className="bg-brand-gold/15 text-brand-gold text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                  Kegiatan Resmi
                </span>
                <h4 className="font-bold text-slate-800 leading-snug">{agenda.title}</h4>
                <div className="space-y-1 font-medium text-slate-500 text-[11px]">
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{agenda.date} &bull; {agenda.time}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{agenda.location}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
