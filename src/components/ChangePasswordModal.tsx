/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { KeyRound, X, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { token } = useAuth();
  const { successToast, errorToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newPassword || newPassword.length < 4) {
      setErrorMsg('Password baru minimal 4 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi password baru tidak cocok.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      });

      const result = await response.json();
      if (result.success) {
        setSuccessMsg(result.message || 'Password berhasil diperbarui!');
        successToast('Password berhasil diperbarui!');
        setTimeout(() => {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setSuccessMsg('');
          onClose();
        }, 1200);
      } else {
        const err = result.message || 'Gagal mengubah password.';
        setErrorMsg(err);
        errorToast(err);
      }
    } catch (err) {
      setErrorMsg('Gangguan koneksi jaringan.');
      errorToast('Gangguan koneksi jaringan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-100 p-2 rounded-xl text-brand-emerald">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-base text-slate-800">Ganti Kata Sandi (Password)</h4>
              <p className="text-[11px] text-slate-400 font-medium">Perbarui kata sandi akun untuk keamanan sistem</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-2 text-red-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center gap-2 text-brand-emerald text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Password Saat Ini</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-brand-emerald focus:ring-2 focus:ring-emerald-500/10 rounded-xl py-2.5 px-3.5 text-xs font-medium outline-none transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Password Baru</label>
            <input
              type="password"
              required
              minLength={4}
              placeholder="Minimal 4 karakter"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-brand-emerald focus:ring-2 focus:ring-emerald-500/10 rounded-xl py-2.5 px-3.5 text-xs font-medium outline-none transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Konfirmasi Password Baru</label>
            <input
              type="password"
              required
              minLength={4}
              placeholder="Ulangi password baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-brand-emerald focus:ring-2 focus:ring-emerald-500/10 rounded-xl py-2.5 px-3.5 text-xs font-medium outline-none transition-all font-mono"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-emerald text-white font-semibold py-3 rounded-xl hover:bg-brand-emerald-dark transition-all text-xs active:scale-95 disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-800/10 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              {loading ? 'Memproses SIM...' : 'Simpan Password Baru'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
