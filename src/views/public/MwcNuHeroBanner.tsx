/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Sparkles, CheckCircle, Monitor, UserCheck, Award, Database, Landmark, Users, ArrowRight 
} from 'lucide-react';

interface MwcNuHeroBannerProps {
  onNavigateToLogin: () => void;
  isLoggedIn: boolean;
  mwcName?: string;
}

export default function MwcNuHeroBanner({ onNavigateToLogin, isLoggedIn, mwcName }: MwcNuHeroBannerProps) {
  return (
    <div className="w-full bg-gradient-to-r from-emerald-50 via-teal-50/20 to-white py-12 px-6 sm:px-10 lg:px-16 rounded-3xl border border-emerald-100 shadow-xl overflow-hidden relative mb-12 flex flex-col justify-between">
      {/* Background abstract watermarks */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none bg-[radial-gradient(#047857_1px,transparent_1px)] [background-size:24px_24px]"></div>
      
      <div className="relative z-10 max-w-5xl text-left">
        {/* Header Pill Badge */}
        <div className="inline-flex items-center gap-1.5 bg-emerald-100/80 border border-emerald-200/60 text-emerald-800 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-6 shadow-sm">
          <Landmark className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />
          <span>Sistem Informasi Manajemen Sensus</span>
        </div>
        
        {/* Main Display Typography */}
        <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-emerald-950 tracking-tight leading-tight mb-5">
          KHIDMAT DIGITAL & <br />
          <span className="text-emerald-700">SENSUS MANDIRI NAHDLIYIN</span> <br />
          <span className="text-amber-500 text-xl sm:text-2xl lg:text-3xl font-extrabold uppercase tracking-wide block mt-1">
            {mwcName || 'MWC NU Karangpawitan'}
          </span>
        </h2>
        
        {/* Detailed Platform Description */}
        <p className="text-slate-600 text-sm sm:text-base max-w-3xl font-normal leading-relaxed mb-8">
          Platform manajemen data sensus warga Nahdliyin yang akurat dan terintegrasi (3NF). Memfasilitasi pendaftaran mandiri, penerbitan KTA Virtual, tata kelola administrasi 20 Ranting Desa/Kelurahan, pos keuangan terpadu, serta sinergi potensi Badan Otonom se-Kecamatan Karangpawitan, Kabupaten Garut.
        </p>

        {/* Action Buttons to let users interact */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full mb-10">
          <a
            href="#cek-sensus"
            className="w-full sm:w-auto bg-brand-gold text-white px-7 py-3.5 rounded-xl font-bold text-sm hover:bg-yellow-600 transition-all shadow-lg shadow-amber-800/10 active:scale-95 text-center cursor-pointer"
          >
            Cek NIK Sensus Anda
          </a>
          <button
            onClick={onNavigateToLogin}
            className="w-full sm:w-auto bg-emerald-850 hover:bg-emerald-900 text-white px-7 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 text-center cursor-pointer border border-emerald-700 shadow-sm"
          >
            {isLoggedIn ? 'Kembali ke Dasbor Operator' : 'Login Operator MWC / Ranting'}
          </button>
        </div>
        
        {/* Four Bottom Feature Cards (Replicating style of user's example) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Pill 1: Terintegrasi */}
          <div className="bg-white/95 border border-emerald-100/80 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3 hover:shadow hover:border-emerald-200 transition-all group">
            <div className="bg-emerald-50 text-emerald-700 p-2 rounded-xl group-hover:bg-emerald-700 group-hover:text-white transition-all duration-300">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div className="text-left leading-none">
              <p className="text-xs font-extrabold text-emerald-950">Terintegrasi</p>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">Satu Data Sensus</p>
            </div>
          </div>

          {/* Pill 2: Transparan */}
          <div className="bg-white/95 border border-emerald-100/80 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3 hover:shadow hover:border-emerald-200 transition-all group">
            <div className="bg-emerald-50 text-emerald-700 p-2 rounded-xl group-hover:bg-emerald-700 group-hover:text-white transition-all duration-300">
              <Monitor className="w-4 h-4" />
            </div>
            <div className="text-left leading-none">
              <p className="text-xs font-extrabold text-emerald-950">Transparan</p>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">Verifikasi Real-time</p>
            </div>
          </div>

          {/* Pill 3: Profesional */}
          <div className="bg-white/95 border border-emerald-100/80 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3 hover:shadow hover:border-emerald-200 transition-all group">
            <div className="bg-emerald-50 text-emerald-700 p-2 rounded-xl group-hover:bg-emerald-700 group-hover:text-white transition-all duration-300">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="text-left leading-none">
              <p className="text-xs font-extrabold text-emerald-950">Profesional</p>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">Khidmat Organisasi</p>
            </div>
          </div>

          {/* Pill 4: Berkelanjutan */}
          <div className="bg-white/95 border border-emerald-100/80 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3 hover:shadow hover:border-emerald-200 transition-all group">
            <div className="bg-emerald-50 text-emerald-700 p-2 rounded-xl group-hover:bg-emerald-700 group-hover:text-white transition-all duration-300">
              <Award className="w-4 h-4" />
            </div>
            <div className="text-left leading-none">
              <p className="text-xs font-extrabold text-emerald-950">Berkelanjutan</p>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">Potensi Maslahat</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
