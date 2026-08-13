/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  Plus, Search, Filter, CheckCircle2, AlertCircle, XCircle, Edit2, Trash2, 
  UserCheck, Shield, ChevronRight, X, Users, UserPlus, Info, Landmark, Award
} from 'lucide-react';

interface UserItem {
  id: number;
  uid: string;
  email: string;
  name: string;
  role: 'Super Admin' | 'Ketua MWC' | 'Sekretaris' | 'Bendahara' | 'Operator' | 'Admin Ranting' | 'Admin Banom' | 'Viewer';
  ranting_id: number | null;
  banom_id: number | null;
  created_at: string;
  updated_at: string;
}

interface Ranting {
  id: number;
  name: string;
}

interface Banom {
  id: number;
  name: string;
  type: string;
}

export default function UsersPage() {
  const { token, user: currentUser } = useAuth();
  const { successToast, errorToast } = useToast();
  
  // State variables
  const [users, setUsers] = useState<UserItem[]>([]);
  const [rantings, setRantings] = useState<Ranting[]>([]);
  const [banoms, setBanoms] = useState<Banom[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Viewer' as UserItem['role'],
    ranting_id: '',
    banom_id: ''
  });

  // Action feedback state
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Load essential lists
  const loadData = async () => {
    setLoading(true);
    try {
      // Parallel fetches for speed and efficiency
      const [usersRes, rantingsRes, banomsRes] = await Promise.all([
        fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/rantings', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/banoms', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.data || []);
      }
      if (rantingsRes.ok) {
        const rantingsData = await rantingsRes.json();
        setRantings(rantingsData.data || []);
      }
      if (banomsRes.ok) {
        const banomsData = await banomsRes.json();
        setBanoms(banomsData.data || []);
      }
    } catch (err) {
      console.error('Gagal mengambil data user:', err);
      setAlert({ type: 'error', message: 'Koneksi gagal: Tidak dapat memuat data dari server.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Dismiss alerts automatically
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // Open modal for creation
  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'Viewer',
      ranting_id: '',
      banom_id: ''
    });
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (user: UserItem) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      ranting_id: user.ranting_id ? String(user.ranting_id) : '',
      banom_id: user.banom_id ? String(user.banom_id) : ''
    });
    setIsModalOpen(true);
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple checks
    if (!formData.name.trim() || !formData.email.trim() || !formData.role) {
      setAlert({ type: 'error', message: 'Semua bidang wajib diisi.' });
      return;
    }

    if (formData.role === 'Admin Ranting' && !formData.ranting_id) {
      setAlert({ type: 'error', message: 'Wilayah Ranting wajib dipilih untuk Admin Ranting.' });
      return;
    }

    if (formData.role === 'Admin Banom' && !formData.banom_id) {
      setAlert({ type: 'error', message: 'Badan Otonom wajib dipilih untuk Admin Banom.' });
      return;
    }

    setActionLoading(true);
    setAlert(null);

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role,
      ranting_id: formData.role === 'Admin Ranting' ? Number(formData.ranting_id) : null,
      banom_id: formData.role === 'Admin Banom' ? Number(formData.banom_id) : null
    };

    try {
      const url = modalMode === 'create' ? '/api/users' : `/api/users/${selectedUser?.id}`;
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (response.ok && result.success) {
        const msg = modalMode === 'create' 
          ? `Berhasil mendaftarkan pengguna baru: ${payload.name}` 
          : `Berhasil memperbarui data pengguna: ${payload.name}`;
        setAlert({ 
          type: 'success', 
          message: msg 
        });
        successToast(msg);
        setIsModalOpen(false);
        await loadData();
      } else {
        const errorMsg = result.message || 'Gagal menyimpan data.';
        setAlert({ type: 'error', message: errorMsg });
        errorToast(errorMsg);
      }
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', message: 'Terjadi kesalahan sistem saat menghubungi API.' });
      errorToast('Terjadi kesalahan sistem saat menghubungi API.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete User
  const handleDelete = async (user: UserItem) => {
    if (user.id === currentUser?.id) {
      setAlert({ type: 'error', message: 'Anda tidak diizinkan menghapus akun Anda sendiri yang sedang aktif.' });
      errorToast('Anda tidak diizinkan menghapus akun Anda sendiri yang sedang aktif.');
      return;
    }

    const conf = window.confirm(`Apakah Anda yakin ingin menghapus akses login untuk "${user.name}" (${user.email})?`);
    if (!conf) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();
      if (response.ok && result.success) {
        const successMsg = `Berhasil menghapus pengguna "${user.name}".`;
        setAlert({ type: 'success', message: successMsg });
        successToast(successMsg);
        await loadData();
      } else {
        const errorMsg = result.message || 'Gagal menghapus pengguna.';
        setAlert({ type: 'error', message: errorMsg });
        errorToast(errorMsg);
      }
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', message: 'Gagal menghubungi server saat menghapus data.' });
      errorToast('Gagal menghubungi server saat menghapus data.');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to format role badges with matching tailwind colors
  const getRoleBadge = (role: UserItem['role']) => {
    switch (role) {
      case 'Super Admin':
        return 'bg-red-50 text-red-700 border border-red-200';
      case 'Ketua MWC':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Sekretaris':
      case 'Bendahara':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Admin Ranting':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Admin Banom':
        return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'Operator':
        return 'bg-orange-50 text-orange-700 border border-orange-200';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  // Helper to translate and enrich context
  const getContextName = (user: UserItem) => {
    if (user.role === 'Admin Ranting' && user.ranting_id) {
      const ranting = rantings.find(r => r.id === user.ranting_id);
      return ranting ? `Ranting ${ranting.name}` : `Ranting ID ${user.ranting_id}`;
    }
    if (user.role === 'Admin Banom' && user.banom_id) {
      const banom = banoms.find(b => b.id === user.banom_id);
      return banom ? `${banom.name}` : `Banom ID ${user.banom_id}`;
    }
    return 'Tingkat MWC (Sistem Global)';
  };

  // Calculated statistics
  const totalUsers = users.length;
  const superAdminCount = users.filter(u => u.role === 'Super Admin').length;
  const rantingAdminCount = users.filter(u => u.role === 'Admin Ranting').length;
  const banomAdminCount = users.filter(u => u.role === 'Admin Banom').length;

  // Filter list in memory
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === '' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight font-display flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-emerald" />
            <span>Manajemen Akses & Kredensial Pengguna</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Daftarkan, sunting, dan hapus hak akses login pengguna SIM MWC NU sesuai tingkatan struktural masing-masing.
          </p>
        </div>
        
        <button
          onClick={handleOpenCreate}
          className="bg-brand-emerald hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah User Baru</span>
        </button>
      </div>

      {/* ALERT BANNERS */}
      {alert && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-fade-in ${
          alert.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {alert.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-xs font-bold">{alert.message}</span>
        </div>
      )}

      {/* STATS BREAKDOWN GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-150 rounded-xl p-4 flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-emerald-500/10 text-brand-emerald rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Pengguna</span>
            <span className="text-xl font-extrabold text-slate-800">{totalUsers} <span className="text-xs font-medium text-slate-400">Akun</span></span>
          </div>
        </div>

        <div className="bg-white border border-slate-150 rounded-xl p-4 flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-red-500/10 text-red-600 rounded-xl">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Super Admin</span>
            <span className="text-xl font-extrabold text-slate-800">{superAdminCount} <span className="text-xs font-medium text-slate-400">Akun</span></span>
          </div>
        </div>

        <div className="bg-white border border-slate-150 rounded-xl p-4 flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-teal-500/10 text-teal-600 rounded-xl">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Admin Ranting</span>
            <span className="text-xl font-extrabold text-slate-800">{rantingAdminCount} <span className="text-xs font-medium text-slate-400">Akun</span></span>
          </div>
        </div>

        <div className="bg-white border border-slate-150 rounded-xl p-4 flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-purple-50/10 text-purple-600 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Admin Banom / Lembaga</span>
            <span className="text-xl font-extrabold text-slate-800">{banomAdminCount} <span className="text-xs font-medium text-slate-400">Akun</span></span>
          </div>
        </div>

      </div>

      {/* FILTER AND SEARCH BAR */}
      <div className="bg-white p-4 border border-slate-150 rounded-2xl shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari user berdasarkan nama atau email..."
            className="w-full bg-slate-50 text-slate-800 pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-emerald focus:border-brand-emerald transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="relative w-full md:w-48">
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <select
              className="w-full bg-slate-50 text-slate-700 pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-emerald focus:border-brand-emerald cursor-pointer transition-all appearance-none"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">Semua Tingkatan Role</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Ketua MWC">Ketua MWC</option>
              <option value="Sekretaris">Sekretaris</option>
              <option value="Bendahara">Bendahara</option>
              <option value="Operator">Operator</option>
              <option value="Admin Ranting">Admin Ranting</option>
              <option value="Admin Banom">Admin Banom</option>
              <option value="Viewer">Jama'ah</option>
            </select>
          </div>
        </div>
      </div>

      {/* USER LIST CONTAINER */}
      <div className="bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-emerald border-t-transparent"></div>
            <p className="text-xs text-slate-400 font-bold">Mengambil basis data pengguna dari sistem...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-150 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-4">Email Login</th>
                  <th className="py-3 px-4">Kewenangan (Role)</th>
                  <th className="py-3 px-4">Struktural / Afiliasi</th>
                  <th className="py-3 px-4">Dibuat Pada</th>
                  <th className="py-3 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 text-brand-emerald font-bold text-xs flex items-center justify-center shrink-0">
                            {u.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-700 text-xs block">{u.name}</span>
                            <span className="text-[10px] font-mono text-slate-400 font-semibold">{u.uid}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-xs text-slate-600">{u.email}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md uppercase tracking-wider block w-max ${getRoleBadge(u.role)}`}>
                          {u.role === 'Viewer' ? "Jama'ah" : u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-xs text-slate-600">{getContextName(u)}</td>
                      <td className="py-3.5 px-4 text-[10px] font-semibold text-slate-400">
                        {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-600 rounded-lg transition-all cursor-pointer"
                            title="Edit User"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(u)}
                            className={`p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-150 hover:border-rose-200 text-rose-600 rounded-lg transition-all cursor-pointer ${
                              u.id === currentUser?.id ? 'opacity-40 cursor-not-allowed' : ''
                            }`}
                            disabled={u.id === currentUser?.id}
                            title="Hapus User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400 font-medium italic text-xs">
                      Tidak ada pengguna yang cocok dengan kriteria pencarian Anda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT OVERLAY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all border border-slate-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-emerald-900 to-brand-emerald-dark text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-yellow-300" />
                <h3 className="font-extrabold text-sm">
                  {modalMode === 'create' ? 'Daftarkan Pengguna Baru' : 'Sunting Hak Akses Pengguna'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-white/15 rounded-lg text-white/80 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-left">
              
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex gap-2 text-[10px] text-slate-500 font-medium leading-relaxed">
                <Info className="w-4 h-4 text-brand-emerald shrink-0 mt-0.5" />
                <span>
                  SIM MWC NU Karangpawitan menggunakan metode login cepat berbasis Email dalam demo ini. Pengguna dapat login dengan email dan password apa saja sesaat setelah didaftarkan.
                </span>
              </div>

              {/* Name Field */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase block">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: H. Akhmad Fauzi, M.Ag"
                  className="w-full bg-white text-slate-800 px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-emerald"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Email Field */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase block">Alamat Email</label>
                <input
                  type="email"
                  required
                  placeholder="Contoh: fauzi@mwc-karangpawitan.or.id"
                  className="w-full bg-white text-slate-800 px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-emerald"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              {/* Role dropdown */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase block">Kewenangan / Level (Role)</label>
                <select
                  required
                  className="w-full bg-white text-slate-800 px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-brand-emerald cursor-pointer"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserItem['role'], ranting_id: '', banom_id: '' })}
                >
                  <option value="Super Admin">Super Admin</option>
                  <option value="Ketua MWC">Ketua MWC</option>
                  <option value="Sekretaris">Sekretaris</option>
                  <option value="Bendahara">Bendahara</option>
                  <option value="Operator">Operator</option>
                  <option value="Admin Ranting">Admin Ranting (Mewakili Wilayah Ranting)</option>
                  <option value="Admin Banom">Admin Banom (Mewakili Badan Otonom)</option>
                  <option value="Viewer">Jama'ah (Hanya Melihat)</option>
                </select>
              </div>

              {/* Ranting Selector (Visible only for Admin Ranting) */}
              {formData.role === 'Admin Ranting' && (
                <div className="space-y-1 bg-emerald-50/50 p-3 border border-emerald-100 rounded-xl animate-fade-in">
                  <label className="text-[11px] font-extrabold text-brand-emerald uppercase block">Wilayah Ranting Pengurus</label>
                  <select
                    required
                    className="w-full bg-white text-slate-800 px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-brand-emerald cursor-pointer"
                    value={formData.ranting_id}
                    onChange={(e) => setFormData({ ...formData, ranting_id: e.target.value })}
                  >
                    <option value="">-- Pilih Wilayah Ranting --</option>
                    {rantings.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">Admin Ranting ini hanya akan diizinkan melihat/memverifikasi data sensus warga ranting tersebut.</p>
                </div>
              )}

              {/* Banom Selector (Visible only for Admin Banom) */}
              {formData.role === 'Admin Banom' && (
                <div className="space-y-1 bg-purple-50/50 p-3 border border-purple-100 rounded-xl animate-fade-in">
                  <label className="text-[11px] font-extrabold text-purple-700 uppercase block">Kategori Badan Otonom / Lembaga</label>
                  <select
                    required
                    className="w-full bg-white text-slate-800 px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-brand-emerald cursor-pointer"
                    value={formData.banom_id}
                    onChange={(e) => setFormData({ ...formData, banom_id: e.target.value })}
                  >
                    <option value="">-- Pilih Banom / Lembaga --</option>
                    {banoms.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.type})</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">Admin Banom ini hanya akan diizinkan mengelola dokumen, keuangan, dan inventaris organisasi terkait.</p>
                </div>
              )}

              {/* Footer buttons */}
              <div className="flex gap-2 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="py-2 px-5 bg-brand-emerald hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {actionLoading ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <span>{modalMode === 'create' ? 'Daftarkan' : 'Perbarui'}</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
