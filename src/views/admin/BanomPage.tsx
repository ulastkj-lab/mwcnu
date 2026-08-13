/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  Building2, Users, Phone, User, Plus, Search, Edit, Trash2, ExternalLink, Briefcase,
  ShieldAlert, CheckCircle2, Filter, X, Grid, List, ChevronRight, RefreshCw, AlertCircle, Check, Info, FileText, ArrowLeft, Home,
  Upload, Download, FileCheck, Layers, Calendar, MapPin, Eye, Sparkles, UserPlus
} from 'lucide-react';

interface BanomItem {
  id: number;
  name: string;
  type: 'Banom' | 'Lembaga';
  code?: string | null;
  leader_name: string | null;
  secretary_name?: string | null;
  treasurer_name?: string | null;
  contact_no: string | null;
  address?: string | null;
  description?: string | null;
  sk_number?: string | null;
  sk_file_url?: string | null;
  sk_date?: string | null;
  period_start?: number | null;
  period_end?: number | null;
  logo_url?: string | null;
  created_at: string;
  updated_at: string;
  pengurus_count?: number;
  anggota_count?: number;
}

interface PengurusItem {
  id: number;
  anggota_id: number | null;
  name: string;
  photo_url: string | null;
  level: 'MWC' | 'Ranting' | 'Banom';
  banom_id: number | null;
  position: string;
  sk_number: string | null;
  sk_file_url: string | null;
  period_start: number;
  period_end: number;
  status: 'Aktif' | 'Demisioner' | 'Wafat';
}

interface AnggotaOption {
  id: number;
  name: string;
  nik: string;
  photo_url: string | null;
  ranting_name?: string;
}

export default function BanomPage({ onBackToDashboard }: { onBackToDashboard?: () => void } = {}) {
  const { token, hasRole, user } = useAuth();
  const { successToast, errorToast } = useToast();

  // Role permissions
  const canModify = hasRole('Super Admin') || hasRole('Ketua MWC') || hasRole('Sekretaris') || hasRole('Operator') || hasRole('Admin Banom');

  // States
  const [banoms, setBanoms] = useState<BanomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'Semua' | 'Banom' | 'Lembaga'>('Semua');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Selected item for detail / pengurus management
  const [selectedBanom, setSelectedBanom] = useState<BanomItem | null>(null);
  const [detailPengurusList, setDetailPengurusList] = useState<PengurusItem[]>([]);
  const [anggotaOptions, setAnggotaOptions] = useState<AnggotaOption[]>([]);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSkModalOpen, setIsSkModalOpen] = useState(false);
  const [formType, setFormType] = useState<'create' | 'edit'>('create');

  // Add Pengurus Inline Form State inside Detail Modal
  const [isAddPengurusOpen, setIsAddPengurusOpen] = useState(false);
  const [pengurusForm, setPengurusForm] = useState({
    anggota_id: '',
    custom_name: '',
    position: 'Wakil Ketua',
    status: 'Aktif' as PengurusItem['status']
  });

  // Main Banom Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'Lembaga' as 'Banom' | 'Lembaga',
    code: '',
    leader_name: '',
    secretary_name: '',
    treasurer_name: '',
    contact_no: '',
    address: '',
    description: '',
    sk_number: '',
    sk_file_url: '',
    sk_date: '',
    period_start: new Date().getFullYear(),
    period_end: new Date().getFullYear() + 5,
    logo_url: ''
  });

  // Simulated File state for SK upload
  const [simulatedSkFile, setSimulatedSkFile] = useState<{ name: string; size: string } | null>(null);
  const [skInputMode, setSkInputMode] = useState<'file' | 'link'>('file');

  // Fetch Banoms
  const fetchBanoms = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/banoms', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBanoms(data.data || []);
      } else {
        errorToast(data.message || 'Gagal memuat data Banom & Lembaga.');
      }
    } catch (err: any) {
      errorToast('Terjadi kesalahan jaringan saat mengambil data Banom/Lembaga.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Sensus Anggota for dropdown picker
  const fetchAnggotaOptions = async () => {
    try {
      const res = await fetch('/api/sensus?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAnggotaOptions(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBanoms();
    fetchAnggotaOptions();
  }, [token]);

  // Fetch Single Banom Details & Pengurus
  const openDetailModal = async (banom: BanomItem) => {
    setSelectedBanom(banom);
    setIsDetailModalOpen(true);
    setIsAddPengurusOpen(false);
    try {
      const res = await fetch(`/api/banoms/${banom.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedBanom(data.data);
        setDetailPengurusList(data.data.pengurus || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Create Form
  const openCreateModal = () => {
    setFormType('create');
    setFormData({
      name: '',
      type: activeTab === 'Banom' ? 'Banom' : 'Lembaga',
      code: '',
      leader_name: '',
      secretary_name: '',
      treasurer_name: '',
      contact_no: '',
      address: '',
      description: '',
      sk_number: '',
      sk_file_url: '',
      sk_date: new Date().toISOString().split('T')[0],
      period_start: new Date().getFullYear(),
      period_end: new Date().getFullYear() + 5,
      logo_url: ''
    });
    setSimulatedSkFile(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Form
  const openEditModal = (banom: BanomItem) => {
    setFormType('edit');
    setSelectedBanom(banom);
    setFormData({
      name: banom.name || '',
      type: banom.type || 'Lembaga',
      code: banom.code || '',
      leader_name: banom.leader_name || '',
      secretary_name: banom.secretary_name || '',
      treasurer_name: banom.treasurer_name || '',
      contact_no: banom.contact_no || '',
      address: banom.address || '',
      description: banom.description || '',
      sk_number: banom.sk_number || '',
      sk_file_url: banom.sk_file_url || '',
      sk_date: banom.sk_date || new Date().toISOString().split('T')[0],
      period_start: banom.period_start || new Date().getFullYear(),
      period_end: banom.period_end || new Date().getFullYear() + 5,
      logo_url: banom.logo_url || ''
    });
    if (banom.sk_file_url) {
      setSimulatedSkFile({ name: banom.sk_file_url.split('/').pop() || 'SK_Document.pdf', size: '2.4 MB' });
    } else {
      setSimulatedSkFile(null);
    }
    setIsFormModalOpen(true);
  };

  // Submit Banom Form (Create / Edit)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      errorToast('Nama Banom / Lembaga wajib diisi.');
      return;
    }

    const payload = {
      ...formData,
      period_start: Number(formData.period_start),
      period_end: Number(formData.period_end)
    };

    try {
      const url = formType === 'create' ? '/api/banoms' : `/api/banoms/${selectedBanom?.id}`;
      const method = formType === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        successToast(data.message || 'Organisasi berhasil disimpan.');
        setIsFormModalOpen(false);
        fetchBanoms();
      } else {
        errorToast(data.message || 'Gagal menyimpan data organisasi.');
      }
    } catch (err: any) {
      errorToast('Terjadi kesalahan koneksi saat menyimpan.');
    }
  };

  // Delete Banom
  const handleDeleteBanom = async (banom: BanomItem) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus ${banom.type} "${banom.name}"?`)) return;

    try {
      const res = await fetch(`/api/banoms/${banom.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        successToast(data.message);
        fetchBanoms();
        if (isDetailModalOpen) setIsDetailModalOpen(false);
      } else {
        errorToast(data.message || 'Gagal menghapus organisasi.');
      }
    } catch (err) {
      errorToast('Terjadi kesalahan jaringan.');
    }
  };

  // Handle Add Pengurus to Banom
  const handleAddPengurusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBanom) return;

    if (!pengurusForm.position.trim()) {
      errorToast('Jabatan pengurus wajib diisi.');
      return;
    }

    const payload = {
      anggota_id: pengurusForm.anggota_id ? Number(pengurusForm.anggota_id) : null,
      name: pengurusForm.custom_name,
      position: pengurusForm.position,
      status: pengurusForm.status
    };

    try {
      const res = await fetch(`/api/banoms/${selectedBanom.id}/pengurus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        successToast(data.message);
        setIsAddPengurusOpen(false);
        setPengurusForm({ anggota_id: '', custom_name: '', position: 'Wakil Ketua', status: 'Aktif' });
        // Refresh detail list
        openDetailModal(selectedBanom);
        fetchBanoms();
      } else {
        errorToast(data.message || 'Gagal menambahkan pengurus.');
      }
    } catch (err) {
      errorToast('Kesalahan sistem saat menambah pengurus.');
    }
  };

  // Handle Delete Pengurus
  const handleDeletePengurus = async (pengurusId: number) => {
    if (!window.confirm('Hapus posisi pengurus ini dari struktur?')) return;
    try {
      const res = await fetch(`/api/pengurus/${pengurusId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        successToast(data.message);
        if (selectedBanom) openDetailModal(selectedBanom);
        fetchBanoms();
      } else {
        errorToast(data.message || 'Gagal menghapus pengurus.');
      }
    } catch (err) {
      errorToast('Kesalahan jaringan.');
    }
  };

  // File Upload Simulator for SK
  const handleSimulatedSkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fakeFileName = `SK_${formData.name ? formData.name.replace(/\s+/g, '_') : 'Organisasi'}_${Date.now().toString().slice(-4)}.pdf`;
    const fakeSize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    setSimulatedSkFile({ name: fakeFileName, size: fakeSize });
    setFormData(prev => ({
      ...prev,
      sk_file_url: `/documents/sk/${fakeFileName}`
    }));
    successToast(`Berkas SK "${file.name}" berhasil terunggah!`);
  };

  // Handle Custom Logo Upload
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      errorToast('Ukuran file logo terlalu besar. Maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setFormData(prev => ({
          ...prev,
          logo_url: reader.result as string
        }));
        successToast('Logo custom berhasil diunggah!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Filtered List
  const filteredBanoms = banoms.filter(b => {
    if (activeTab !== 'Semua' && b.type !== activeTab) return false;
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        (b.code && b.code.toLowerCase().includes(q)) ||
        (b.leader_name && b.leader_name.toLowerCase().includes(q)) ||
        (b.sk_number && b.sk_number.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Calculate statistics
  const totalBanomCount = banoms.filter(b => b.type === 'Banom').length;
  const totalLembagaCount = banoms.filter(b => b.type === 'Lembaga').length;
  const totalSkUploaded = banoms.filter(b => Boolean(b.sk_number || b.sk_file_url)).length;
  const totalPengurusAll = banoms.reduce((acc, b) => acc + (b.pengurus_count || 0), 0);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER & NAV BACK */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
              {onBackToDashboard && (
                <button 
                  onClick={onBackToDashboard} 
                  className="hover:text-brand-emerald flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" /> Dasbor
                </button>
              )}
              <span>/</span>
              <span className="text-brand-emerald">Banom & Lembaga MWC NU</span>
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
              <Building2 className="w-7 h-7 text-brand-emerald" />
              Badan Otonom (Banom) & Lembaga NU
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Manajemen struktur kepengurusan, legalitas SK resmi, dan rekapitilasi organ perangkat MWC NU Karangpawitan.
            </p>
          </div>

          {canModify && (
            <button
              onClick={openCreateModal}
              className="bg-brand-emerald hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 justify-center cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Lembaga / Banom
            </button>
          )}
        </div>

        {/* SUMMARY STATS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-2xs flex items-center gap-3.5">
            <div className="p-3 bg-emerald-50 text-brand-emerald rounded-xl shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Organ</span>
              <span className="text-xl font-black text-slate-800">{banoms.length} <span className="text-xs font-medium text-slate-400">Unit</span></span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-2xs flex items-center gap-3.5">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Badan Otonom</span>
              <span className="text-xl font-black text-slate-800">{totalBanomCount} <span className="text-xs font-medium text-slate-400">Banom</span></span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-2xs flex items-center gap-3.5">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lembaga NU</span>
              <span className="text-xl font-black text-slate-800">{totalLembagaCount} <span className="text-xs font-medium text-slate-400">Lembaga</span></span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-2xs flex items-center gap-3.5">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SK Terdaftar</span>
              <span className="text-xl font-black text-slate-800">{totalSkUploaded} / {banoms.length} <span className="text-xs font-medium text-slate-400">SK</span></span>
            </div>
          </div>
        </div>

        {/* CONTROLS: SEARCH & TABS & VIEW MODE */}
        <div className="bg-white border border-slate-200/80 p-3.5 rounded-2xl shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setActiveTab('Semua')}
              className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'Semua' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua ({banoms.length})
            </button>
            <button
              onClick={() => setActiveTab('Banom')}
              className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'Banom' ? 'bg-white text-brand-emerald shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Badan Otonom ({totalBanomCount})
            </button>
            <button
              onClick={() => setActiveTab('Lembaga')}
              className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'Lembaga' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Lembaga NU ({totalLembagaCount})
            </button>
          </div>

          {/* Search & View Switcher */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari Banom / Lembaga..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-brand-emerald focus:bg-white transition-all"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Tampilan Kartu Grid"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Tampilan Tabel Detail"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-2xs">
            <RefreshCw className="w-8 h-8 text-brand-emerald animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-600">Memuat data Banom & Lembaga NU...</p>
          </div>
        ) : filteredBanoms.length === 0 ? (
          /* EMPTY STATE */
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-2xs">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">Tidak ada data Banom / Lembaga</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Belum ada data yang sesuai dengan pencarian atau filter tab terpilih.
            </p>
            {canModify && (
              <button
                onClick={openCreateModal}
                className="mt-4 bg-brand-emerald text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-emerald-600 transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Tambah Organisasi Baru
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBanoms.map((item) => {
              const isBanom = item.type === 'Banom';
              const hasSk = Boolean(item.sk_number || item.sk_file_url);

              return (
                <div 
                  key={item.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        {item.logo_url ? (
                          <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                            <img src={item.logo_url} alt={item.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          </div>
                        ) : (
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                            isBanom 
                              ? 'bg-emerald-50 border-emerald-200 text-brand-emerald' 
                              : 'bg-amber-50 border-amber-200 text-amber-700'
                          }`}>
                            {item.code || (isBanom ? 'BNM' : 'LMB')}
                          </div>
                        )}
                        <div>
                          <span className={`inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                            isBanom 
                              ? 'bg-emerald-50 text-brand-emerald border-emerald-200' 
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {item.type}
                          </span>
                          <h3 className="text-sm font-extrabold text-slate-800 leading-tight mt-0.5 group-hover:text-brand-emerald transition-colors line-clamp-1">
                            {item.name}
                          </h3>
                        </div>
                      </div>

                      {/* SK Badge */}
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                        hasSk 
                          ? 'bg-emerald-50 text-brand-emerald border border-emerald-200' 
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}>
                        <FileCheck className="w-3 h-3" />
                        {hasSk ? 'SK Ada' : 'Belum SK'}
                      </span>
                    </div>

                    {/* Description */}
                    {item.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3 font-normal leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {/* Key Officials Info */}
                    <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 space-y-2 mb-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" /> Pimpinan / Ketua:
                        </span>
                        <span className="font-bold text-slate-800 truncate max-w-[150px]">{item.leader_name || '-'}</span>
                      </div>
                      
                      {item.secretary_name && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-medium flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Sekretaris:
                          </span>
                          <span className="font-semibold text-slate-700 truncate max-w-[150px]">{item.secretary_name}</span>
                        </div>
                      )}

                      {item.contact_no && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-medium flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" /> Kontak WhatsApp:
                          </span>
                          <span className="font-mono text-slate-600 font-semibold">{item.contact_no}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/50">
                        <span className="text-slate-400 font-medium flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" /> Masa Khidmat:
                        </span>
                        <span className="font-bold text-slate-700 font-mono">
                          {item.period_start || 2026} - {item.period_end || 2031}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => openDetailModal(item)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Profil & Pengurus ({item.pengurus_count || 0})
                    </button>

                    <div className="flex items-center gap-1">
                      {canModify && (
                        <>
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 text-slate-400 hover:text-brand-emerald hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                            title="Edit Data & SK"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBanom(item)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Nama Organisasi</th>
                    <th className="py-3.5 px-4">Pimpinan & Kontak</th>
                    <th className="py-3.5 px-4">Legalitas SK</th>
                    <th className="py-3.5 px-4">Masa Khidmat</th>
                    <th className="py-3.5 px-4 text-center">Jumlah Pengurus</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredBanoms.map((item) => {
                    const isBanom = item.type === 'Banom';
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          <div className="flex items-center gap-2.5">
                            {item.logo_url ? (
                              <img src={item.logo_url} alt={item.name} className="w-8 h-8 object-contain rounded-lg border border-slate-200 p-0.5 bg-white shrink-0 shadow-2xs" referrerPolicy="no-referrer" />
                            ) : (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                                isBanom ? 'bg-emerald-50 text-brand-emerald border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {item.type}
                              </span>
                            )}
                            <div>
                              <span className="font-bold text-slate-800 block">{item.name}</span>
                              {item.code && <span className="text-[10px] text-slate-400 font-mono">Kode: {item.code}</span>}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-700 block">{item.leader_name || '-'}</span>
                          {item.contact_no && <span className="text-[10px] text-slate-400 font-mono">{item.contact_no}</span>}
                        </td>

                        <td className="py-3.5 px-4">
                          {item.sk_number ? (
                            <div>
                              <span className="text-brand-emerald font-bold font-mono text-[11px] block">{item.sk_number}</span>
                              {item.sk_date && <span className="text-[10px] text-slate-400">Tgl SK: {item.sk_date}</span>}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Belum diisi</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                          {item.period_start || 2026} - {item.period_end || 2031}
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                          <span className="bg-slate-100 px-2.5 py-1 rounded-full text-slate-700">
                            {item.pengurus_count || 0} Pengurus
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-1">
                          <button
                            onClick={() => openDetailModal(item)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> Detail
                          </button>
                          {canModify && (
                            <>
                              <button
                                onClick={() => openEditModal(item)}
                                className="p-1.5 text-slate-400 hover:text-brand-emerald rounded-lg cursor-pointer"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteBanom(item)}
                                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* MODAL 1: FORM TAMBAH / EDIT BANOM ATAU LEMBAGA */}
      <AnimatePresence>
        {isFormModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-brand-emerald/10 text-brand-emerald rounded-xl">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800">
                      {formType === 'create' ? 'Tambah Lembaga / Banom Baru' : 'Edit Data Lembaga / Banom'}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Lengkapi data identitas, pimpinan harian, serta dokumen SK Kepengurusan.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsFormModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmitForm} className="p-6 overflow-y-auto space-y-4">
                
                {/* Type & Name */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Tipe Organ *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'Banom' | 'Lembaga' })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-brand-emerald focus:bg-white transition-all"
                    >
                      <option value="Lembaga">Lembaga NU</option>
                      <option value="Banom">Badan Otonom (Banom)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Nama Lembaga / Banom *</label>
                    <input
                      type="text"
                      placeholder="Contoh: LAZISNU (Lembaga Amil Zakat NU)"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-brand-emerald focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* CUSTOM LOGO INPUT & PREVIEW SECTION */}
                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-brand-emerald" /> Logo Custom / Lambang Organisasi
                    </label>
                    {formData.logo_url && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logo_url: '' })}
                        className="text-[10px] text-red-500 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" /> Hapus Logo Custom
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Logo Preview Box */}
                    <div className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-2 shrink-0 shadow-2xs relative overflow-hidden">
                      {formData.logo_url ? (
                        <img
                          src={formData.logo_url}
                          alt="Preview Logo"
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="text-center text-slate-400">
                          <Building2 className="w-6 h-6 mx-auto opacity-40 mb-1" />
                          <span className="text-[9px] font-bold block leading-none">Tanpa Logo</span>
                        </div>
                      )}
                    </div>

                    {/* Logo Controls */}
                    <div className="flex-1 w-full space-y-2">
                      <div className="flex gap-2">
                        <label className="flex-1 bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-xl px-3 py-2 text-center cursor-pointer transition-all block shadow-2xs">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoFileUpload}
                            className="hidden"
                          />
                          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700">
                            <Upload className="w-3.5 h-3.5 text-brand-emerald" />
                            <span>Unggah Logo (PNG/JPG/SVG)</span>
                          </div>
                        </label>
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Atau masukan/tempelkan URL gambar logo (https://...)"
                          value={formData.logo_url}
                          onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-brand-emerald font-mono transition-all"
                        />
                      </div>

                      {/* Presets */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className="text-[10px] text-slate-400 font-bold">Preset Logo:</span>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, logo_url: '/uploads/nahdlatul_ulama_logo.svg' })}
                          className="text-[10px] bg-white hover:bg-emerald-50 text-slate-600 border border-slate-200 rounded-lg px-2 py-0.5 font-semibold transition-all cursor-pointer"
                        >
                          Logo NU Standar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Kode Singkatan</label>
                    <input
                      type="text"
                      placeholder="Contoh: LAZISNU, GP-ANSOR, LDNU"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-brand-emerald focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">No. Kontak / WhatsApp Resmi</label>
                    <input
                      type="text"
                      placeholder="Contoh: 085222333001"
                      value={formData.contact_no}
                      onChange={(e) => setFormData({ ...formData, contact_no: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-brand-emerald focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Core Leadership Names */}
                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-brand-emerald" /> Susunan Pengurus Utama (Harian)
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Nama Ketua / Pimpinan</label>
                      <input
                        type="text"
                        placeholder="Sahabat Hilman Farid"
                        value={formData.leader_name}
                        onChange={(e) => setFormData({ ...formData, leader_name: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-brand-emerald transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Nama Sekretaris</label>
                      <input
                        type="text"
                        placeholder="Sahabat Ahmad"
                        value={formData.secretary_name}
                        onChange={(e) => setFormData({ ...formData, secretary_name: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-brand-emerald transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Nama Bendahara</label>
                      <input
                        type="text"
                        placeholder="Sahabat Fajar"
                        value={formData.treasurer_name}
                        onChange={(e) => setFormData({ ...formData, treasurer_name: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-brand-emerald transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* SK & Masa Khidmat */}
                <div className="bg-emerald-50/40 border border-emerald-100 p-4 rounded-2xl space-y-3">
                  <h4 className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-brand-emerald" /> Surat Keputusan (SK) & Masa Khidmat
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Nomor SK Kepengurusan</label>
                      <input
                        type="text"
                        placeholder="Contoh: 045/PCNU/SK/VII/2026"
                        value={formData.sk_number}
                        onChange={(e) => setFormData({ ...formData, sk_number: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono outline-none focus:border-brand-emerald transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Tanggal Penetapan SK</label>
                      <input
                        type="date"
                        value={formData.sk_date}
                        onChange={(e) => setFormData({ ...formData, sk_date: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-brand-emerald transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Tahun Awal Khidmat</label>
                      <input
                        type="number"
                        value={formData.period_start}
                        onChange={(e) => setFormData({ ...formData, period_start: Number(e.target.value) })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono outline-none focus:border-brand-emerald transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Tahun Akhir Khidmat</label>
                      <input
                        type="number"
                        value={formData.period_end}
                        onChange={(e) => setFormData({ ...formData, period_end: Number(e.target.value) })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono outline-none focus:border-brand-emerald transition-all"
                      />
                    </div>
                  </div>

                  {/* SK FILE ATTACHMENT */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Unggah Berkas SK Kepengurusan (PDF/DOCX)</label>
                    <div className="flex gap-2">
                      <label className="flex-1 border-2 border-dashed border-emerald-300 hover:border-brand-emerald bg-white rounded-xl p-3 text-center cursor-pointer transition-all block">
                        <input
                          type="file"
                          accept=".pdf,.docx,.doc"
                          onChange={handleSimulatedSkUpload}
                          className="hidden"
                        />
                        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
                          <Upload className="w-4 h-4 text-brand-emerald" />
                          <span>{simulatedSkFile ? simulatedSkFile.name : 'Pilih Berkas SK (PDF/DOCX)'}</span>
                        </div>
                      </label>
                    </div>
                    {formData.sk_file_url && (
                      <span className="text-[10px] text-brand-emerald font-semibold block mt-1">
                        ✓ Berkas SK Siap Dihubungkan: {formData.sk_file_url}
                      </span>
                    )}
                  </div>
                </div>

                {/* Description & Address */}
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Alamat Sekretariat / Basecamp</label>
                  <input
                    type="text"
                    placeholder="Gedung MWC NU Karangpawitan Lt. 2, Jl. Raya Karangpawitan No. 45"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-brand-emerald focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Deskripsi & Tusi Organisasi</label>
                  <textarea
                    rows={3}
                    placeholder="Tugas pokok dan bidang layanan organisasi ini..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-brand-emerald focus:bg-white transition-all resize-none"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-emerald hover:bg-emerald-600 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Simpan Data Organisasi
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: DETAIL ORGANISASI & MANAJEMEN STRUKTUR PENGURUS */}
      <AnimatePresence>
        {isDetailModalOpen && selectedBanom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-3">
                  {selectedBanom.logo_url ? (
                    <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                      <img src={selectedBanom.logo_url} alt={selectedBanom.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                  ) : (
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-xs ${
                      selectedBanom.type === 'Banom' ? 'bg-emerald-100 text-brand-emerald' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedBanom.code || selectedBanom.type[0]}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                        {selectedBanom.type}
                      </span>
                      <span className="text-xs font-mono font-bold text-brand-emerald">
                        Khidmat {selectedBanom.period_start || 2026} - {selectedBanom.period_end || 2031}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-800 leading-tight mt-0.5">
                      {selectedBanom.name}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-5">
                
                {/* SK Card Info */}
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-emerald block">SURAT KEPUTUSAN (SK) PENGESAHAN</span>
                    <span className="text-sm font-black font-mono text-slate-800">{selectedBanom.sk_number || 'Nomor SK belum diisi'}</span>
                    {selectedBanom.sk_date && <span className="text-xs text-slate-500 block">Ditetapkan tgl: {selectedBanom.sk_date}</span>}
                  </div>

                  {selectedBanom.sk_file_url ? (
                    <a
                      href={selectedBanom.sk_file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-brand-emerald hover:bg-emerald-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Download className="w-4 h-4" /> Unduh Dokumen SK (PDF)
                    </a>
                  ) : (
                    <button
                      onClick={() => { setIsDetailModalOpen(false); openEditModal(selectedBanom); }}
                      className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Upload className="w-4 h-4 text-brand-emerald" /> Upload File SK
                    </button>
                  )}
                </div>

                {/* Structure Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                        <Users className="w-4 h-4 text-brand-emerald" /> Structure & Personil Kepengurusan
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Daftar personil pengurus {selectedBanom.name} yang terdaftar resmi.
                      </p>
                    </div>

                    {canModify && (
                      <button
                        onClick={() => setIsAddPengurusOpen(!isAddPengurusOpen)}
                        className="bg-brand-emerald hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        {isAddPengurusOpen ? 'Tutup Form' : 'Tambah Pengurus'}
                      </button>
                    )}
                  </div>

                  {/* Inline Add Pengurus Form */}
                  <AnimatePresence>
                    {isAddPengurusOpen && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleAddPengurusSubmit}
                        className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3"
                      >
                        <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Tambah Personil Pengurus Baru
                        </h5>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">Pilih dari Sensus Warga (Opsional)</label>
                            <select
                              value={pengurusForm.anggota_id}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPengurusForm(prev => ({ ...prev, anggota_id: val }));
                                if (val) {
                                  const m = anggotaOptions.find(a => a.id === Number(val));
                                  if (m) setPengurusForm(prev => ({ ...prev, custom_name: m.name }));
                                }
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-medium outline-none focus:border-brand-emerald transition-all"
                            >
                              <option value="">-- Manual Type (Non Sensus) --</option>
                              {anggotaOptions.map(a => (
                                <option key={a.id} value={a.id}>
                                  {a.name} ({a.nik})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">Nama Lengkap Pengurus *</label>
                            <input
                              type="text"
                              placeholder="Nama Pengurus"
                              value={pengurusForm.custom_name}
                              onChange={(e) => setPengurusForm(prev => ({ ...prev, custom_name: e.target.value }))}
                              required
                              className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold outline-none focus:border-brand-emerald transition-all"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">Jabatan / Posisi *</label>
                            <input
                              type="text"
                              placeholder="Contoh: Wakil Ketua, Koordinator Divisi Dakwah"
                              value={pengurusForm.position}
                              onChange={(e) => setPengurusForm(prev => ({ ...prev, position: e.target.value }))}
                              required
                              className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold outline-none focus:border-brand-emerald transition-all"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">Status Keanggotaan</label>
                            <select
                              value={pengurusForm.status}
                              onChange={(e) => setPengurusForm(prev => ({ ...prev, status: e.target.value as PengurusItem['status'] }))}
                              className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold outline-none focus:border-brand-emerald transition-all"
                            >
                              <option value="Aktif">Aktif</option>
                              <option value="Demisioner">Demisioner</option>
                              <option value="Wafat">Wafat</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setIsAddPengurusOpen(false)}
                            className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-lg cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 text-xs font-bold bg-brand-emerald text-white rounded-lg hover:bg-emerald-600 transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Simpan Pengurus
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {/* List Pengurus Table */}
                  {detailPengurusList.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200/80 p-6 rounded-2xl text-center">
                      <p className="text-xs text-slate-400 font-medium">
                        Belum ada personil tambahan yang dimasukkan ke struktur pengurus ini.
                      </p>
                    </div>
                  ) : (
                    <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-200">
                            <th className="p-3">Nama Pengurus</th>
                            <th className="p-3">Jabatan / Posisi</th>
                            <th className="p-3">Status</th>
                            {canModify && <th className="p-3 text-right">Aksi</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {detailPengurusList.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="p-3 font-bold text-slate-800">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-brand-emerald font-extrabold flex items-center justify-center text-[10px]">
                                    {p.name[0]}
                                  </div>
                                  <span>{p.name}</span>
                                </div>
                              </td>

                              <td className="p-3 font-semibold text-slate-700">
                                <span className="bg-emerald-50 text-brand-emerald px-2 py-0.5 rounded border border-emerald-100">
                                  {p.position}
                                </span>
                              </td>

                              <td className="p-3">
                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                                  {p.status}
                                </span>
                              </td>

                              {canModify && (
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => handleDeletePengurus(p.id)}
                                    className="p-1 text-slate-400 hover:text-red-500 rounded cursor-pointer"
                                    title="Hapus Pengurus"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  ID Organisasi: #{selectedBanom.id}
                </span>

                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-white hover:bg-slate-900 transition-all cursor-pointer"
                >
                  Tutup
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
