/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Landmark, ArrowLeft, KeyRound, User, AlertCircle, UserCheck, Eye, EyeOff } from 'lucide-react';

export default function LoginPage({ onBackToLanding, onLoginSuccess }: { onBackToLanding: () => void; onLoginSuccess: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Username / Email wajib diisi.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await login(email, password);
      if (success) {
        setIsSuccess(true);
        setTimeout(() => {
          onLoginSuccess();
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal masuk. Silakan periksa kembali username/password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* BRAND PANEL - LEFT */}
      <div className="md:w-5/12 bg-gradient-to-b from-emerald-900 to-emerald-950 p-12 text-white flex flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        {/* Top Header */}
        <button
          onClick={onBackToLanding}
          className="relative z-10 flex items-center gap-2 text-xs font-mono tracking-wider font-semibold text-emerald-200 hover:text-white transition-colors cursor-pointer self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          KEMBALI KE BERANDA UTAMA
        </button>

        {/* Branding Title */}
        <div className="relative z-10 my-auto py-12">
          <div className="bg-brand-emerald w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-emerald-950/40">
            <Landmark className="w-8 h-8" />
          </div>
          <span className="text-yellow-400 font-mono text-[10px] uppercase tracking-widest font-bold">PORTAL SISTEM INTEGRASI</span>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-white mt-3 leading-tight">
            Akses Sensus Mandiri & Administrasi NU
          </h2>
          <p className="text-emerald-100/80 text-sm mt-4 font-light leading-relaxed max-w-sm">
            Selamat datang di Portal SIM MWC NU Karangpawitan. Silakan masuk sebagai operator atau pimpinan untuk mengelola sensus warga dan aset organisasi.
          </p>
        </div>

        {/* Footer Credit */}
        <div className="relative z-10 text-[10px] font-mono text-emerald-400/80">
          MWC NU KARANGPAWITAN &bull; GARUT &bull; 2026
        </div>
      </div>

      {/* FORM PANEL - RIGHT */}
      <div className="flex-1 p-8 md:p-16 flex flex-col justify-center max-w-4xl">
        <div className="max-w-md w-full mx-auto">
          
          <div className="mb-8">
            <h3 className="font-display font-bold text-2xl text-emerald-950">Masuk Aplikasi</h3>
            <p className="text-slate-500 text-sm mt-1">Masukkan username atau email pengurus Anda.</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-xs font-medium">{error}</p>
            </div>
          )}

          {isSuccess && (
            <div className="mb-6 bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-3 text-brand-emerald">
              <UserCheck className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold">Autentikasi Berhasil!</p>
                <p className="text-[10px] text-emerald-700 mt-0.5">Mempersiapkan panel dashboard Anda...</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Username Pengurus</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="Masukkan username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-brand-emerald focus:ring-2 focus:ring-emerald-500/10 rounded-xl py-3 pl-11 pr-4 text-sm font-medium outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Kata Sandi</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-brand-emerald focus:ring-2 focus:ring-emerald-500/10 rounded-xl py-3 pl-11 pr-11 text-sm font-medium outline-none transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors cursor-pointer"
                  title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || isSuccess}
              className="w-full bg-brand-emerald text-white font-semibold py-3.5 rounded-xl hover:bg-brand-emerald-dark transition-all text-sm active:scale-95 disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-800/10 flex items-center justify-center gap-2"
            >
              {loading ? 'Menghubungkan Sesi...' : 'Masuk Sistem'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
