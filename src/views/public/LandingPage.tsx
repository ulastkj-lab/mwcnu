/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, ShieldCheck, Users, Landmark, BookOpen, UserCheck, 
  ArrowRight, LogOut, Award, ChevronDown, Share2, Globe, MessageCircle, 
  Video, Phone, Briefcase, Store, CheckCircle2, TrendingUp, Sparkles, User
} from 'lucide-react';
import MwcNuHeroBanner from './MwcNuHeroBanner';
import { useSettings } from '../../context/SettingsContext';

interface PotensiWargaSummary {
  id: number;
  name: string;
  category: string | null;
  count: number;
}

interface UmkmWargaSummary {
  owner_name: string;
  umkm_name: string;
  umkm_sector: string;
}

interface Ranting {
  id: number;
  code: string;
  name: string;
  address: string | null;
  rois_name: string | null;
  leader_name: string | null;
  secretary_name: string | null;
  contact_no: string | null;
  member_count?: number;
  member_l_count?: number;
  member_p_count?: number;
  member_approved_count?: number;
  potensi_warga?: PotensiWargaSummary[];
  umkm_warga?: UmkmWargaSummary[];
  potensi_ekonomi?: string[];
  potensi_unggulan?: string;
}

interface SensusResult {
  name: string;
  ranting: string;
  status: string;
  kta_number: string | null;
  year_joined: number | null;
}

export default function LandingPage({ 
  onNavigateToLogin, 
  isLoggedIn = false,
  onLogout
}: { 
  onNavigateToLogin: () => void; 
  isLoggedIn?: boolean;
  onLogout?: () => void;
}) {
  const { settings } = useSettings();
  const [rantings, setRantings] = useState<Ranting[]>([]);
  const [selectedRanting, setSelectedRanting] = useState<Ranting | null>(null);
  const [nikQuery, setNikQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SensusResult | null>(null);
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [stats, setStats] = useState({
    members: 50,
    rantingsCount: 20,
    banomsCount: 10,
    approvedCount: 35
  });

  // Load public information
  useEffect(() => {
    async function loadPublicData() {
      try {
        // Fetch stats & rantings list
        const resRanting = await fetch('/api/public/rantings');
        const resStats = await fetch('/api/public/stats');
        
        if (resRanting.ok) {
          const data = await resRanting.json();
          setRantings(data.data || []);
          if (data.data && data.data.length > 0) {
            setSelectedRanting(data.data[0]);
          }
        }
        if (resStats.ok) {
          const data = await resStats.json();
          setStats(data.data);
        }
      } catch (err) {
        console.error('Failed to load public data:', err);
      }
    }
    loadPublicData();
  }, []);

  // Handle citizen NIK self-lookup
  const handleNikSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nikQuery.trim() || nikQuery.length < 10) {
      setSearchError('Masukkan minimal 10 digit NIK Anda.');
      setSearchResult(null);
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setSearchResult(null);

    try {
      const res = await fetch(`/api/public/check-sensus?nik=${encodeURIComponent(nikQuery)}`);
      const result = await res.json();
      if (result.success && result.data) {
        setSearchResult(result.data);
      } else {
        setSearchError(result.message || 'NIK tidak ditemukan dalam basis data sensus kami.');
      }
    } catch (err) {
      setSearchError('Gagal menghubungi server. Silakan coba sesaat lagi.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafdfb] flex flex-col selection:bg-brand-emerald selection:text-white">
      {/* TOP SOCIAL BAR */}
      {settings?.social_media && (
        <div className="bg-emerald-950 text-emerald-200 px-6 py-2 text-[11px] flex flex-wrap items-center justify-between gap-2 font-medium border-b border-emerald-900">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Portal Resmi Sensus & Layanan {settings?.name || 'MWC NU Karangpawitan'}</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            {settings.social_media.facebook && (
              <a href={settings.social_media.facebook} target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
                <span>Facebook</span>
              </a>
            )}
            {settings.social_media.instagram && (
              <a href={settings.social_media.instagram} target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
                <span>Instagram</span>
              </a>
            )}
            {settings.social_media.youtube && (
              <a href={settings.social_media.youtube} target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
                <Video className="w-3 h-3 text-red-400" />
                <span>YouTube</span>
              </a>
            )}
            {settings.social_media.tiktok && (
              <a href={settings.social_media.tiktok} target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
                <span>TikTok</span>
              </a>
            )}
            {settings.social_media.whatsapp && (
              <a href={settings.social_media.whatsapp} target="_blank" rel="noreferrer" className="hover:text-emerald-300 transition-colors flex items-center gap-1 font-bold text-emerald-400">
                <MessageCircle className="w-3 h-3 text-emerald-400" />
                <span>WhatsApp</span>
              </a>
            )}
            {settings.social_media.website && (
              <a href={settings.social_media.website} target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <span>Website</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* HEADER BAR */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-emerald-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-xl shadow-md shadow-emerald-700/10 w-11 h-11 flex items-center justify-center overflow-hidden border border-emerald-50">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            ) : (
              <img src="/uploads/nahdlatul_ulama_logo.svg" alt="Logo NU" className="w-9 h-9 object-contain" referrerPolicy="no-referrer" />
            )}
          </div>
          <div>
            <h1 className="font-display font-bold text-sm sm:text-base text-emerald-950 leading-tight">
              {settings?.name || 'SIM MWC NU'}
            </h1>
            <p className="text-[9px] font-mono uppercase tracking-wider text-emerald-600 font-semibold">
              Portal Sensus Warga
            </p>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-emerald-900/80">
          <a href="#stats" className="hover:text-brand-emerald transition-colors">Statistik Sensus</a>
          <a href="#cek-sensus" className="hover:text-brand-emerald transition-colors">Cek NIK Mandiri</a>
          <a href="#ranting" className="hover:text-brand-emerald transition-colors">Eksplorasi Ranting</a>
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToLogin}
            className="bg-brand-emerald text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-brand-emerald-dark transition-all shadow-md shadow-emerald-800/10 active:scale-95 flex items-center gap-2 group cursor-pointer"
            id="btn-portal-sensus"
          >
            {isLoggedIn ? 'Buka Dasbor Saya' : 'Portal Sensus'}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
          {isLoggedIn && onLogout && (
            <button
              onClick={onLogout}
              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          )}
        </div>
      </header>

      {/* HERO SECTION - Premium Customized Banner matching the requested style */}
      <section className="px-6 pt-8 max-w-7xl mx-auto w-full">
        <MwcNuHeroBanner onNavigateToLogin={onNavigateToLogin} isLoggedIn={isLoggedIn} mwcName={settings?.name} />
      </section>

      {/* STATS SECTION */}
      <section id="stats" className="pb-16 px-6 relative z-20 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-900/5 border border-emerald-50 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-brand-emerald">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-emerald-950">{stats.members}</p>
              <p className="text-xs text-slate-500 font-medium">Sensus Terdaftar</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-900/5 border border-emerald-50 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-brand-emerald">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-emerald-950">{stats.approvedCount}</p>
              <p className="text-xs text-slate-500 font-medium">KTA Terbit (Valid)</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-900/5 border border-emerald-50 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-brand-emerald">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-emerald-950">{stats.rantingsCount}</p>
              <p className="text-xs text-slate-500 font-medium">Ranting Resmi</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-900/5 border border-emerald-50 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-brand-emerald">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-emerald-950">{stats.banomsCount}</p>
              <p className="text-xs text-slate-500 font-medium">Banom & Lembaga</p>
            </div>
          </div>
        </div>
      </section>

      {/* SENSUS LOOKUP SECTION (CEK MANDIRI) */}
      <section id="cek-sensus" className="py-16 bg-emerald-50/50 px-6 border-y border-emerald-100/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-brand-emerald font-mono text-xs uppercase tracking-widest font-semibold">Mandiri & Instan</span>
            <h3 className="font-display font-bold text-2xl md:text-3xl text-emerald-950 mt-2">Cek Status Keanggotaan Sensus Sensus</h3>
            <p className="text-slate-500 text-sm max-w-lg mx-auto mt-2">
              Sudahkah Anda terdaftar dalam sensus MWC NU Karangpawitan? Masukkan 16 digit NIK Anda untuk memverifikasi.
            </p>
          </div>

          <form onSubmit={handleNikSearch} className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="Masukkan 16 digit NIK KTP Anda... (contoh: 3205121204850001)"
                value={nikQuery}
                onChange={(e) => setNikQuery(e.target.value.replace(/\D/g, ''))}
                maxLength={16}
                className="w-full bg-white border border-slate-200 focus:border-brand-emerald focus:ring-2 focus:ring-emerald-500/10 rounded-xl py-3 pl-12 pr-4 text-sm font-medium outline-none transition-all placeholder:text-slate-400 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="bg-brand-emerald text-white font-semibold py-3 px-6 rounded-xl hover:bg-brand-emerald-dark transition-all text-sm active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSearching ? 'Memeriksa...' : 'Cari Data'}
            </button>
          </form>

          {/* LOOKUP RESULT CONTAINER */}
          {searchResult && (
            <div className="max-w-2xl mx-auto mt-8 bg-white border border-emerald-100 rounded-2xl p-6 shadow-lg shadow-emerald-950/5 transition-all duration-300">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <h4 className="font-semibold text-emerald-950 text-sm">Warga NU Terverifikasi</h4>
                </div>
                <span className="bg-emerald-50 text-brand-emerald text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  {searchResult.status}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Nama Lengkap</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{searchResult.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Ranting Desa/Kelurahan</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{searchResult.ranting}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Tahun Gabung Keaktifan</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{searchResult.year_joined || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Nomor Kartu Tanda Anggota (KTA)</p>
                  {searchResult.kta_number ? (
                    <p className="font-mono font-bold text-brand-emerald mt-0.5">{searchResult.kta_number}</p>
                  ) : (
                    <p className="text-amber-600 font-medium italic mt-0.5 text-xs">Penerbitan KTA dalam antrean</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {searchError && (
            <div className="max-w-2xl mx-auto mt-6 bg-red-50 border border-red-100 rounded-xl p-4 text-center">
              <p className="text-xs text-red-600 font-semibold">{searchError}</p>
              <p className="text-[10px] text-slate-400 mt-1">Jika Anda merasa sudah disensus tapi tidak ditemukan, silakan hubungi Operator Ranting setempat.</p>
            </div>
          )}
        </div>
      </section>

      {/* DYNAMIC MWC NU BOARD STRUCTURE SECTION */}
      <section className="py-16 px-6 bg-slate-50 border-y border-slate-150">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-10">
            <span className="text-brand-emerald font-mono text-xs uppercase tracking-widest font-bold">Struktur Utama</span>
            <h3 className="font-display font-bold text-2xl md:text-3xl text-emerald-950 mt-2">
              Pengurus {settings?.name || 'MWC NU Karangpawitan'}
            </h3>
            <p className="text-slate-500 text-sm max-w-lg mx-auto mt-2">
              Susunan personalia lengkap Majelis Wakil Cabang Nahdlatul Ulama berdasarkan Surat Keputusan (SK) resmi yang sah.
            </p>
          </div>

          {/* JAJARAN PIMPINAN UTAMA MWC NU (ROIS, KATIB, KETUA TANFIDZ, SEKRETARIS) */}
          <div className="mb-14 bg-white border border-emerald-100/80 rounded-3xl p-6 md:p-8 shadow-md">
            <div className="text-center mb-8">
              <span className="text-brand-emerald font-mono text-[11px] uppercase tracking-widest font-extrabold flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Pimpinan Organisasi</span>
              </span>
              <h4 className="font-display font-extrabold text-xl md:text-2xl text-slate-900 mt-1">
                Jajaran Pimpinan Utama MWC NU
              </h4>
              <p className="text-slate-500 text-xs mt-1">
                Empat pilar kepemimpinan dewan Syuriah & Tanfidziyah MWC NU
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* 1. ROIS SYURIAH */}
              <div className="bg-gradient-to-b from-emerald-50/50 to-white border border-emerald-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all text-center flex flex-col items-center justify-between group">
                <div className="relative mb-4">
                  <div className="w-32 h-40 rounded-2xl overflow-hidden bg-slate-100 border-2 border-emerald-500/40 shadow-md group-hover:border-emerald-600 transition-colors flex items-center justify-center">
                    {settings?.leadership_photos?.rois_photo_url ? (
                      <img
                        src={settings.leadership_photos.rois_photo_url}
                        alt={settings?.structure?.syuriah?.rais || 'Rois Syuriah'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-b from-emerald-50 to-emerald-100/60 flex flex-col items-center justify-center text-emerald-800 p-3">
                        <User className="w-14 h-14 text-emerald-600/60 mb-1" />
                        <span className="text-[10px] font-bold text-emerald-700">Rois Syuriah</span>
                      </div>
                    )}
                  </div>
                  <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-emerald-800 text-amber-300 text-[9px] font-black px-3 py-0.5 rounded-full border border-emerald-600 shadow-sm whitespace-nowrap">
                    SYURIAH
                  </span>
                </div>

                <div className="mt-2 w-full text-center">
                  <span className="text-[10px] font-mono text-emerald-700 font-extrabold uppercase tracking-wider block">
                    Rois Syuriah
                  </span>
                  <h5 className="font-extrabold text-sm text-slate-900 mt-1 leading-snug">
                    {settings?.structure?.syuriah?.rais || 'KA. Muhlis Ulumudin, S.Pd.I.'}
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    Pemimpin Tertinggi Syuriah
                  </p>
                </div>
              </div>

              {/* 2. KATIB SYURIAH */}
              <div className="bg-gradient-to-b from-emerald-50/50 to-white border border-emerald-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all text-center flex flex-col items-center justify-between group">
                <div className="relative mb-4">
                  <div className="w-32 h-40 rounded-2xl overflow-hidden bg-slate-100 border-2 border-emerald-500/40 shadow-md group-hover:border-emerald-600 transition-colors flex items-center justify-center">
                    {settings?.leadership_photos?.katib_photo_url ? (
                      <img
                        src={settings.leadership_photos.katib_photo_url}
                        alt={settings?.structure?.syuriah?.katib || 'Katib Syuriah'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-b from-emerald-50 to-emerald-100/60 flex flex-col items-center justify-center text-emerald-800 p-3">
                        <User className="w-14 h-14 text-emerald-600/60 mb-1" />
                        <span className="text-[10px] font-bold text-emerald-700">Katib Syuriah</span>
                      </div>
                    )}
                  </div>
                  <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-emerald-800 text-amber-300 text-[9px] font-black px-3 py-0.5 rounded-full border border-emerald-600 shadow-sm whitespace-nowrap">
                    SYURIAH
                  </span>
                </div>

                <div className="mt-2 w-full text-center">
                  <span className="text-[10px] font-mono text-emerald-700 font-extrabold uppercase tracking-wider block">
                    Katib Syuriah
                  </span>
                  <h5 className="font-extrabold text-sm text-slate-900 mt-1 leading-snug">
                    {settings?.structure?.syuriah?.katib || 'Ust. Hilman Firmansyah, S.Pd.I.'}
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    Sekretaris Dewan Syuriah
                  </p>
                </div>
              </div>

              {/* 3. KETUA TANFIDZIYAH */}
              <div className="bg-gradient-to-b from-blue-50/50 to-white border border-blue-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all text-center flex flex-col items-center justify-between group">
                <div className="relative mb-4">
                  <div className="w-32 h-40 rounded-2xl overflow-hidden bg-slate-100 border-2 border-blue-500/40 shadow-md group-hover:border-blue-600 transition-colors flex items-center justify-center">
                    {settings?.leadership_photos?.ketua_photo_url ? (
                      <img
                        src={settings.leadership_photos.ketua_photo_url}
                        alt={settings?.structure?.tanfidziyah?.ketua || 'Ketua Tanfidziyah'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-b from-blue-50 to-blue-100/60 flex flex-col items-center justify-center text-blue-800 p-3">
                        <User className="w-14 h-14 text-blue-600/60 mb-1" />
                        <span className="text-[10px] font-bold text-blue-700">Ketua Tanfidz</span>
                      </div>
                    )}
                  </div>
                  <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-blue-800 text-white text-[9px] font-black px-3 py-0.5 rounded-full border border-blue-600 shadow-sm whitespace-nowrap">
                    TANFIDZIYAH
                  </span>
                </div>

                <div className="mt-2 w-full text-center">
                  <span className="text-[10px] font-mono text-blue-700 font-extrabold uppercase tracking-wider block">
                    Ketua Tanfidziyah
                  </span>
                  <h5 className="font-extrabold text-sm text-slate-900 mt-1 leading-snug">
                    {settings?.structure?.tanfidziyah?.ketua || 'KH. Agus, S.Ag., M.Si.'}
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    Ketua Eksekutif Pelaksana
                  </p>
                </div>
              </div>

              {/* 4. SEKRETARIS TANFIDZIYAH */}
              <div className="bg-gradient-to-b from-blue-50/50 to-white border border-blue-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all text-center flex flex-col items-center justify-between group">
                <div className="relative mb-4">
                  <div className="w-32 h-40 rounded-2xl overflow-hidden bg-slate-100 border-2 border-blue-500/40 shadow-md group-hover:border-blue-600 transition-colors flex items-center justify-center">
                    {settings?.leadership_photos?.sekretaris_photo_url ? (
                      <img
                        src={settings.leadership_photos.sekretaris_photo_url}
                        alt={settings?.structure?.tanfidziyah?.sekretaris || 'Sekretaris Tanfidziyah'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-b from-blue-50 to-blue-100/60 flex flex-col items-center justify-center text-blue-800 p-3">
                        <User className="w-14 h-14 text-blue-600/60 mb-1" />
                        <span className="text-[10px] font-bold text-blue-700">Sekretaris</span>
                      </div>
                    )}
                  </div>
                  <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-blue-800 text-white text-[9px] font-black px-3 py-0.5 rounded-full border border-blue-600 shadow-sm whitespace-nowrap">
                    TANFIDZIYAH
                  </span>
                </div>

                <div className="mt-2 w-full text-center">
                  <span className="text-[10px] font-mono text-blue-700 font-extrabold uppercase tracking-wider block">
                    Sekretaris Tanfidziyah
                  </span>
                  <h5 className="font-extrabold text-sm text-slate-900 mt-1 leading-snug">
                    {settings?.structure?.tanfidziyah?.sekretaris || 'M. Didin Saeful Hayat'}
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    Sekretaris Eksekutif Pelaksana
                  </p>
                </div>
              </div>

            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* MUSTASYAR CARD */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 text-left">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="bg-amber-50 text-amber-700 p-2 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">MUSTASYAR</h4>
                  <p className="text-[10px] text-slate-400 font-mono">DEWAN PENASIHAT SEPUH</p>
                </div>
              </div>

              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                {settings?.structure.mustasyar && settings.structure.mustasyar.length > 0 ? (
                  settings.structure.mustasyar.map((name, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 bg-slate-50 p-2 rounded-xl text-xs font-semibold text-slate-700">
                      <span className="w-4 h-4 bg-amber-100 text-amber-800 text-[9px] font-bold rounded-full flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span>{name}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-4">Belum dikonfigurasi</p>
                )}
              </div>
            </div>

            {/* SYURIAH CARD */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5 text-left">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="bg-emerald-50 text-brand-emerald p-2 rounded-xl">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">DEWAN SYURIAH</h4>
                  <p className="text-[10px] text-slate-400 font-mono">PENGAMBIL KEPUTUSAN TERTINGGI</p>
                </div>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {/* Rais */}
                <div>
                  <span className="text-[9px] font-mono uppercase text-brand-emerald font-bold tracking-wider">Rais Syuriah</span>
                  <p className="text-xs font-extrabold text-slate-800 bg-emerald-50/50 p-2 rounded-xl border border-emerald-100/30 mt-0.5">
                    {settings?.structure.syuriah.rais || '-'}
                  </p>
                </div>

                {/* Wakil Rais */}
                {settings?.structure.syuriah.wakil_rais && settings.structure.syuriah.wakil_rais.length > 0 && (
                  <div>
                    <span className="text-[9px] font-mono uppercase text-slate-500 font-bold tracking-wider">Wakil Rais</span>
                    <div className="space-y-1 mt-1">
                      {settings.structure.syuriah.wakil_rais.map((name, i) => (
                        <p key={i} className="text-[11px] font-semibold text-slate-700 bg-slate-50 p-1.5 rounded-lg">
                          {name}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Katib */}
                <div>
                  <span className="text-[9px] font-mono uppercase text-slate-500 font-bold tracking-wider">Katib (Sekretaris)</span>
                  <p className="text-xs font-bold text-slate-800 bg-slate-50 p-2 rounded-xl mt-0.5">
                    {settings?.structure.syuriah.katib || '-'}
                  </p>
                </div>

                {/* Wakil Katib */}
                {settings?.structure.syuriah.wakil_katib && settings.structure.syuriah.wakil_katib.length > 0 && (
                  <div>
                    <span className="text-[9px] font-mono uppercase text-slate-500 font-bold tracking-wider">Wakil Katib</span>
                    <div className="space-y-1 mt-1">
                      {settings.structure.syuriah.wakil_katib.map((name, i) => (
                        <p key={i} className="text-[11px] font-semibold text-slate-700 bg-slate-50 p-1.5 rounded-lg">
                          {name}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* A'wan */}
                {settings?.structure.syuriah.a_wan && settings.structure.syuriah.a_wan.length > 0 && (
                  <div>
                    <span className="text-[9px] font-mono uppercase text-slate-500 font-bold tracking-wider">A'wan (Dewan Pakar)</span>
                    <div className="space-y-1 mt-1">
                      {settings.structure.syuriah.a_wan.map((name, i) => (
                        <p key={i} className="text-[11px] font-semibold text-slate-700 bg-slate-50 p-1.5 rounded-lg">
                          {name}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* TANFIDZIYAH CARD */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5 text-left">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="bg-blue-50 text-blue-700 p-2 rounded-xl">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">DEWAN TANFIDZIYAH</h4>
                  <p className="text-[10px] text-slate-400 font-mono">BADAN EKSEKUTIF PELAKSANA</p>
                </div>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {/* Ketua */}
                <div>
                  <span className="text-[9px] font-mono uppercase text-blue-700 font-bold tracking-wider">Ketua Tanfidziyah</span>
                  <p className="text-xs font-extrabold text-slate-800 bg-blue-50/50 p-2 rounded-xl border border-blue-100/30 mt-0.5">
                    {settings?.structure.tanfidziyah.ketua || '-'}
                  </p>
                </div>

                {/* Wakil Ketua */}
                {settings?.structure.tanfidziyah.wakil_ketua && settings.structure.tanfidziyah.wakil_ketua.length > 0 && (
                  <div>
                    <span className="text-[9px] font-mono uppercase text-slate-500 font-bold tracking-wider">Wakil Ketua</span>
                    <div className="space-y-1 mt-1">
                      {settings.structure.tanfidziyah.wakil_ketua.map((name, i) => (
                        <p key={i} className="text-[11px] font-semibold text-slate-700 bg-slate-50 p-1.5 rounded-lg">
                          {name}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sekretaris */}
                <div>
                  <span className="text-[9px] font-mono uppercase text-slate-500 font-bold tracking-wider">Sekretaris</span>
                  <p className="text-xs font-bold text-slate-800 bg-slate-50 p-2 rounded-xl mt-0.5">
                    {settings?.structure.tanfidziyah.sekretaris || '-'}
                  </p>
                </div>

                {/* Wakil Sekretaris */}
                {settings?.structure.tanfidziyah.wakil_sekretaris && settings.structure.tanfidziyah.wakil_sekretaris.length > 0 && (
                  <div>
                    <span className="text-[9px] font-mono uppercase text-slate-500 font-bold tracking-wider">Wakil Sekretaris</span>
                    <div className="space-y-1 mt-1">
                      {settings.structure.tanfidziyah.wakil_sekretaris.map((name, i) => (
                        <p key={i} className="text-[11px] font-semibold text-slate-700 bg-slate-50 p-1.5 rounded-lg">
                          {name}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bendahara */}
                <div>
                  <span className="text-[9px] font-mono uppercase text-slate-500 font-bold tracking-wider">Bendahara</span>
                  <p className="text-xs font-bold text-slate-800 bg-slate-50 p-2 rounded-xl mt-0.5">
                    {settings?.structure.tanfidziyah.bendahara || '-'}
                  </p>
                </div>

                {/* Wakil Bendahara */}
                {settings?.structure.tanfidziyah.wakil_bendahara && settings.structure.tanfidziyah.wakil_bendahara.length > 0 && (
                  <div>
                    <span className="text-[9px] font-mono uppercase text-slate-500 font-bold tracking-wider">Wakil Bendahara</span>
                    <div className="space-y-1 mt-1">
                      {settings.structure.tanfidziyah.wakil_bendahara.map((name, i) => (
                        <p key={i} className="text-[11px] font-semibold text-slate-700 bg-slate-50 p-1.5 rounded-lg">
                          {name}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* RANTING EXPLORER SECTION */}
      <section id="ranting" className="py-16 px-6 max-w-6xl mx-auto w-full">
        <div className="text-center mb-12">
          <span className="text-brand-gold font-mono text-xs uppercase tracking-widest font-semibold">Struktur Pengurus Wilayah</span>
          <h3 className="font-display font-bold text-2xl md:text-3xl text-emerald-950 mt-2">Peta Eksplorasi Pengurus Ranting</h3>
          <p className="text-slate-500 text-sm max-w-lg mx-auto mt-2">
            Mengenal lebih dekat 20 pengurus ranting tingkat desa/kelurahan di bawah naungan MWC NU Karangpawitan.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List scrollbox */}
          <div className="bg-white border border-slate-150 rounded-2xl p-4 max-h-[460px] overflow-y-auto shadow-sm">
            <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest px-2 mb-3">Daftar Ranting Resmi</h4>
            <div className="space-y-1">
              {rantings.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRanting(r)}
                  className={`w-full text-left px-3 py-3 rounded-xl text-sm font-medium flex items-center justify-between transition-all outline-none cursor-pointer ${
                    selectedRanting?.id === r.id
                      ? 'bg-emerald-50 text-brand-emerald border-l-4 border-brand-emerald'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{r.name}</span>
                  <span className="text-[10px] font-mono text-slate-400">{r.code}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Detail viewer panel */}
          {selectedRanting && (
            <div className="lg:col-span-2 bg-white border border-emerald-50 rounded-2xl p-6 md:p-8 shadow-xl shadow-emerald-900/5 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
                  <div>
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
                      {selectedRanting.code}
                    </span>
                    <h4 className="font-display font-bold text-2xl text-emerald-950 mt-2">{selectedRanting.name}</h4>
                  </div>
                  <div className="p-3 bg-emerald-50 text-brand-emerald rounded-full">
                    <MapPin className="w-6 h-6" />
                  </div>
                </div>

                {/* 1. STRUCTURAL LEADERSHIP */}
                <div className="mb-6">
                  <p className="text-[10px] font-mono font-bold text-brand-emerald uppercase tracking-widest mb-3">
                    Kepengurusan Ranting
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Rois Syuriah Ranting</p>
                      <p className="font-bold text-slate-800 mt-0.5 text-sm">{selectedRanting.rois_name || 'Dalam Proses Konferensi'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Ketua Tanfidziyah Ranting</p>
                      <p className="font-bold text-slate-800 mt-0.5 text-sm">{selectedRanting.leader_name || 'Dalam Proses Konferensi'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Sekretaris Ranting</p>
                      <p className="font-bold text-slate-800 mt-0.5 text-sm">{selectedRanting.secretary_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Kontak Pelayanan Resmi</p>
                      <p className="font-bold text-slate-800 mt-0.5 text-sm">{selectedRanting.contact_no || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* 2. REKAPITULASI JUMLAH WARGA NU */}
                <div className="mb-6">
                  <p className="text-[10px] font-mono font-bold text-brand-emerald uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>Rekapitulasi Jumlah Warga NU</span>
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-emerald-50/70 border border-emerald-100 p-3 rounded-xl text-center">
                      <span className="text-[10px] font-mono text-emerald-700 font-bold uppercase block">Total Warga</span>
                      <span className="text-xl font-black text-emerald-950 mt-1 block">
                        {selectedRanting.member_count ?? 0} <span className="text-xs font-normal text-slate-500">Jiwa</span>
                      </span>
                    </div>
                    <div className="bg-blue-50/70 border border-blue-100 p-3 rounded-xl text-center">
                      <span className="text-[10px] font-mono text-blue-700 font-bold uppercase block">Laki-Laki</span>
                      <span className="text-xl font-black text-blue-950 mt-1 block">
                        {selectedRanting.member_l_count ?? 0} <span className="text-xs font-normal text-slate-500">Jiwa</span>
                      </span>
                    </div>
                    <div className="bg-pink-50/70 border border-pink-100 p-3 rounded-xl text-center">
                      <span className="text-[10px] font-mono text-pink-700 font-bold uppercase block">Perempuan</span>
                      <span className="text-xl font-black text-pink-950 mt-1 block">
                        {selectedRanting.member_p_count ?? 0} <span className="text-xs font-normal text-slate-500">Jiwa</span>
                      </span>
                    </div>
                    <div className="bg-amber-50/70 border border-amber-100 p-3 rounded-xl text-center">
                      <span className="text-[10px] font-mono text-amber-700 font-bold uppercase block">Terverifikasi</span>
                      <span className="text-xl font-black text-amber-950 mt-1 block">
                        {selectedRanting.member_approved_count ?? 0} <span className="text-xs font-normal text-slate-500">Sensus</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. REKAPITULASI POTENSI DAERAH DARI WARGA NU */}
                <div className="mb-6 space-y-4">
                  <p className="text-[10px] font-mono font-bold text-brand-emerald uppercase tracking-widest flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Potensi Daerah & Keahlian Warga NU</span>
                  </p>

                  {/* Potensi Keahlian & Profesi Warga */}
                  <div>
                    <span className="text-xs font-bold text-slate-700 block mb-2">
                      Sebaran Keahlian / Profesi Warga Sensus:
                    </span>
                    {selectedRanting.potensi_warga && selectedRanting.potensi_warga.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedRanting.potensi_warga.map((pot) => (
                          <div
                            key={pot.id}
                            className="bg-slate-100 border border-slate-200 text-slate-800 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-2"
                          >
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            <span>{pot.name}</span>
                            <span className="bg-brand-emerald text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-md">
                              {pot.count} Warga
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                        Belum ada sebaran potensi keahlian spesifik terdata dalam sensus di ranting ini.
                      </p>
                    )}
                  </div>

                  {/* UMKM & Usaha Warga NU */}
                  <div>
                    <span className="text-xs font-bold text-slate-700 block mb-2">
                      Daftar UMKM / Usaha Mandiri Warga NU:
                    </span>
                    {selectedRanting.umkm_warga && selectedRanting.umkm_warga.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {selectedRanting.umkm_warga.map((umkm, idx) => (
                          <div key={idx} className="bg-emerald-50/40 border border-emerald-100/80 p-2.5 rounded-lg flex items-center gap-2.5">
                            <Store className="w-4 h-4 text-brand-emerald shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-800 truncate">{umkm.umkm_name}</p>
                              <p className="text-[10px] text-slate-500 truncate">
                                Pemilik: <span className="font-semibold text-slate-700">{umkm.owner_name}</span> &bull; {umkm.umkm_sector}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                        Belum ada UMKM warga terdaftar pada pendataan sensus ranting ini.
                      </p>
                    )}
                  </div>

                  {/* Potensi Unggulan Ranting */}
                  {(selectedRanting.potensi_ekonomi || selectedRanting.potensi_unggulan) && (
                    <div className="bg-amber-50/50 border border-amber-200/60 p-3 rounded-xl space-y-1.5">
                      <span className="text-[10px] font-mono font-bold text-amber-800 uppercase tracking-wider block">
                        Potensi Unggulan Daerah
                      </span>
                      {selectedRanting.potensi_unggulan && (
                        <p className="text-xs font-bold text-slate-800">{selectedRanting.potensi_unggulan}</p>
                      )}
                      {selectedRanting.potensi_ekonomi && selectedRanting.potensi_ekonomi.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {selectedRanting.potensi_ekonomi.map((pe, i) => (
                            <span key={i} className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded">
                              {pe}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider mb-1">Alamat Sekretariat Ranting</p>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  {selectedRanting.address || 'Alamat belum dilengkapi oleh operator Ranting.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto bg-emerald-950 text-emerald-300 border-t border-emerald-900 px-6 py-12 text-center text-xs">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-white p-1 rounded-lg w-10 h-10 flex items-center justify-center overflow-hidden border border-emerald-900/30">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              ) : (
                <img src="/uploads/nahdlatul_ulama_logo.svg" alt="Logo NU" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
              )}
            </div>
            <span className="font-display font-bold text-white text-base">
              {settings?.name ? `SIM ${settings.name}` : 'SIM MWC NU Karangpawitan'}
            </span>
          </div>
          <p className="text-emerald-400/80 max-w-md leading-relaxed">
            Sistem informasi terintegrasi Nahdlatul Ulama yang memayungi pengelolaan sensus warga, inventarisasi aset, administrasi persuratan, dan transparansi anggaran keuangan organisasi.
          </p>

          {/* Social Media Links in Footer */}
          {settings?.social_media && (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {settings.social_media.facebook && (
                <a href={settings.social_media.facebook} target="_blank" rel="noreferrer" className="bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 hover:text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium border border-emerald-800">
                  <span className="font-extrabold text-blue-400">f</span>
                  <span>Facebook</span>
                </a>
              )}
              {settings.social_media.instagram && (
                <a href={settings.social_media.instagram} target="_blank" rel="noreferrer" className="bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 hover:text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium border border-emerald-800">
                  <span className="font-extrabold text-pink-400">ig</span>
                  <span>Instagram</span>
                </a>
              )}
              {settings.social_media.youtube && (
                <a href={settings.social_media.youtube} target="_blank" rel="noreferrer" className="bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 hover:text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium border border-emerald-800">
                  <Video className="w-3.5 h-3.5 text-red-400" />
                  <span>YouTube</span>
                </a>
              )}
              {settings.social_media.tiktok && (
                <a href={settings.social_media.tiktok} target="_blank" rel="noreferrer" className="bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 hover:text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium border border-emerald-800">
                  <span className="font-extrabold text-white">tt</span>
                  <span>TikTok</span>
                </a>
              )}
              {settings.social_media.whatsapp && (
                <a href={settings.social_media.whatsapp} target="_blank" rel="noreferrer" className="bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 hover:text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium border border-emerald-800">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp</span>
                </a>
              )}
              {settings.social_media.website && (
                <a href={settings.social_media.website} target="_blank" rel="noreferrer" className="bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 hover:text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium border border-emerald-800">
                  <Globe className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Website</span>
                </a>
              )}
            </div>
          )}

          <div className="border-t border-emerald-900 w-full pt-6 text-emerald-500 font-mono text-[10px]">
            &copy; 2026 {settings?.name || 'MWC NU Kecamatan Karangpawitan'}. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
