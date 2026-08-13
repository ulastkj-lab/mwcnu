/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  MapPin, Users, Phone, User, Plus, Search, Edit, Trash2, ExternalLink, Briefcase,
  ShieldAlert, CheckCircle2, Map, Filter, X, Grid, List, Compass, 
  ChevronRight, RefreshCw, AlertCircle, Check, Info, FileText, ArrowLeft, Home,
  Upload, Camera
} from 'lucide-react';

interface RantingWithCount {
  id: number;
  code: string;
  name: string;
  address: string | null;
  rois_name: string | null;
  leader_name: string | null;
  secretary_name: string | null;
  contact_no: string | null;
  latitude: number | null;
  longitude: number | null;
  rois_photo_url?: string | null;
  leader_photo_url?: string | null;
  secretary_photo_url?: string | null;
  potensi_ekonomi?: string[] | null;
  potensi_unggulan?: string | null;
  created_at: string;
  updated_at: string;
  member_count: number;
  member_l_count?: number;
  member_p_count?: number;
  member_approved_count?: number;
  potensi_warga?: Array<{ id: number; name: string; category: string; count: number }>;
  umkm_warga?: Array<{ owner_name: string; umkm_name: string; umkm_sector: string }>;
}

export default function RantingPage({ onBackToDashboard }: { onBackToDashboard?: () => void } = {}) {
  const { token, hasRole, user } = useAuth();
  const { successToast, errorToast } = useToast();

  // Role permissions
  const canCreateOrDelete = hasRole('Super Admin') || hasRole('Ketua MWC') || hasRole('Sekretaris') || hasRole('Operator');
  
  // States
  const [rantings, setRantings] = useState<RantingWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedRanting, setSelectedRanting] = useState<RantingWithCount | null>(null);

  // Modal control
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [mapRanting, setMapRanting] = useState<RantingWithCount | null>(null);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');

  // Form states
  const [formData, setFormData] = useState({
    id: 0,
    code: '',
    name: '',
    address: '',
    rois_name: '',
    leader_name: '',
    secretary_name: '',
    contact_no: '',
    latitude: '',
    longitude: '',
    rois_photo_url: '',
    leader_photo_url: '',
    secretary_photo_url: '',
    potensi_ekonomi: [] as string[],
    potensi_unggulan: ''
  });

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [gpsLoading, setGpsLoading] = useState(false);
  const [uploadingField, setUploadingField] = useState<'rois_photo_url' | 'leader_photo_url' | 'secretary_photo_url' | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'rois_photo_url' | 'leader_photo_url' | 'secretary_photo_url') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran foto terlalu besar. Maksimal ukuran foto adalah 5MB.');
      return;
    }

    setUploadingField(fieldName);
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            image: base64String,
            filename: file.name
          })
        });

        const result = await response.json();
        if (response.ok && result.success) {
          setFormData(prev => ({ ...prev, [fieldName]: result.url }));
        } else {
          alert(result.message || 'Gagal mengunggah foto.');
        }
      } catch (err) {
        console.error('Photo upload error:', err);
        alert('Kesalahan jaringan saat mengunggah foto.');
      } finally {
        setUploadingField(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Fetch rantings
  const loadRantings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/rantings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const result = await response.json();
        setRantings(result.data || []);
      } else {
        const err = await response.json();
        console.error('Failed to load Rantings:', err.message);
      }
    } catch (err) {
      console.error('Failed to fetch Rantings from API:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRantings();
  }, [token]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field-specific validation error
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  // Toggle economic potential selection
  const togglePotensiEkonomi = (potensi: string) => {
    setFormData(prev => {
      const isSelected = prev.potensi_ekonomi.includes(potensi);
      const updated = isSelected
        ? prev.potensi_ekonomi.filter(p => p !== potensi)
        : [...prev.potensi_ekonomi, potensi];
      return { ...prev, potensi_ekonomi: updated };
    });
  };

  // Get GPS Location
  const fetchGPSLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolokasi tidak didukung oleh browser Anda.');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          latitude: String(latitude.toFixed(6)),
          longitude: String(longitude.toFixed(6))
        }));
        setGpsLoading(false);
        setValidationErrors(prev => {
          const copy = { ...prev };
          delete copy.latitude;
          delete copy.longitude;
          return copy;
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        setGpsLoading(false);
        let errorMsg = 'Gagal mendapatkan lokasi GPS Anda.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Akses lokasi ditolak. Harap izinkan izin lokasi di browser Anda.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'Informasi lokasi tidak tersedia.';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = 'Waktu permintaan habis.';
        }
        alert(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Open Create Modal
  const openCreate = () => {
    setModalType('create');
    setFormData({
      id: 0,
      code: '',
      name: '',
      address: '',
      rois_name: '',
      leader_name: '',
      secretary_name: '',
      contact_no: '',
      latitude: '',
      longitude: '',
      rois_photo_url: '',
      leader_photo_url: '',
      secretary_photo_url: '',
      potensi_ekonomi: [],
      potensi_unggulan: ''
    });
    setFormError('');
    setFormSuccess('');
    setValidationErrors({});
    setIsFormModalOpen(true);

    // Automatically trigger GPS retrieval on new creation
    setTimeout(() => {
      fetchGPSLocation();
    }, 150);
  };

  // Open Edit Modal
  const openEdit = (ranting: RantingWithCount) => {
    // Permission boundary check
    const isMwcStaff = ['Super Admin', 'Ketua MWC', 'Sekretaris', 'Operator'].includes(user?.role || '');
    const isAdminOfThisRanting = user?.role === 'Admin Ranting' && user?.ranting_id === ranting.id;

    if (!isMwcStaff && !isAdminOfThisRanting) {
      alert('Akses Ditolak: Anda tidak diperbolehkan mengubah data Ranting ini.');
      return;
    }

    setModalType('edit');
    setFormData({
      id: ranting.id,
      code: ranting.code,
      name: ranting.name,
      address: ranting.address || '',
      rois_name: ranting.rois_name || '',
      leader_name: ranting.leader_name || '',
      secretary_name: ranting.secretary_name || '',
      contact_no: ranting.contact_no || '',
      latitude: ranting.latitude ? String(ranting.latitude) : '',
      longitude: ranting.longitude ? String(ranting.longitude) : '',
      rois_photo_url: ranting.rois_photo_url || '',
      leader_photo_url: ranting.leader_photo_url || '',
      secretary_photo_url: ranting.secretary_photo_url || '',
      potensi_ekonomi: ranting.potensi_ekonomi || [],
      potensi_unggulan: ranting.potensi_unggulan || ''
    });
    setFormError('');
    setFormSuccess('');
    setValidationErrors({});
    setIsFormModalOpen(true);
  };

  // Validate form fields
  const validateForm = () => {
    const errors: Record<string, string> = {};
    const isMwcStaff = ['Super Admin', 'Ketua MWC', 'Sekretaris', 'Operator'].includes(user?.role || '');

    if (isMwcStaff) {
      if (!formData.code || !formData.code.trim()) {
        errors.code = 'Kode Ranting wajib diisi.';
      } else if (formData.code.trim().length < 3) {
        errors.code = 'Kode Ranting minimal terdiri dari 3 karakter.';
      }

      if (!formData.name || !formData.name.trim()) {
        errors.name = 'Nama Ranting wajib diisi.';
      }
    }

    if (formData.latitude && isNaN(Number(formData.latitude))) {
      errors.latitude = 'Latitude harus berupa angka koordinat.';
    }

    if (formData.longitude && isNaN(Number(formData.longitude))) {
      errors.longitude = 'Longitude harus berupa angka koordinat.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Form (Create / Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!validateForm()) return;

    const payload = {
      code: formData.code,
      name: formData.name,
      address: formData.address || null,
      rois_name: formData.rois_name || null,
      leader_name: formData.leader_name || null,
      secretary_name: formData.secretary_name || null,
      contact_no: formData.contact_no || null,
      latitude: formData.latitude ? Number(formData.latitude) : null,
      longitude: formData.longitude ? Number(formData.longitude) : null,
      rois_photo_url: formData.rois_photo_url || null,
      leader_photo_url: formData.leader_photo_url || null,
      secretary_photo_url: formData.secretary_photo_url || null,
      potensi_ekonomi: formData.potensi_ekonomi,
      potensi_unggulan: formData.potensi_unggulan || null
    };

    try {
      const url = modalType === 'create' ? '/api/rantings' : `/api/rantings/${formData.id}`;
      const method = modalType === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        setFormSuccess(result.message || 'Data Ranting berhasil disimpan!');
        successToast(result.message || 'Data Ranting berhasil disimpan!');
        setTimeout(() => {
          setIsFormModalOpen(false);
          loadRantings();
        }, 1200);
      } else {
        const errorMsg = result.message || 'Gagal menyimpan data Ranting.';
        setFormError(errorMsg);
        errorToast(errorMsg);
      }
    } catch (err) {
      setFormError('Kesalahan jaringan. Gagal menghubungi server.');
      errorToast('Kesalahan jaringan. Gagal menghubungi server.');
      console.error('Submit Ranting error:', err);
    }
  };

  // Track Ranting to delete (custom confirmation modal)
  const [rantingToDelete, setRantingToDelete] = useState<RantingWithCount | null>(null);

  // Handle Delete Ranting
  const handleDelete = (ranting: RantingWithCount) => {
    if (ranting.member_count > 0) {
      errorToast(`Ranting "${ranting.name}" tidak dapat dihapus karena terdapat ${ranting.member_count} warga yang terdaftar.`);
      return;
    }
    setRantingToDelete(ranting);
  };

  const executeDelete = async () => {
    if (!rantingToDelete) return;
    const targetRanting = rantingToDelete;
    setRantingToDelete(null);

    try {
      const response = await fetch(`/api/rantings/${targetRanting.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (response.ok) {
        successToast(result.message || 'Ranting berhasil dihapus.');
        loadRantings();
      } else {
        errorToast(result.message || 'Gagal menghapus Ranting.');
      }
    } catch (err) {
      errorToast('Kesalahan jaringan. Gagal menghubungi server.');
      console.error('Delete Ranting error:', err);
    }
  };

  // Filter Ranting list based on search text
  const filteredRantings = rantings.filter(r => {
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.code.toLowerCase().includes(q) ||
      (r.rois_name && r.rois_name.toLowerCase().includes(q)) ||
      (r.leader_name && r.leader_name.toLowerCase().includes(q)) ||
      (r.secretary_name && r.secretary_name.toLowerCase().includes(q)) ||
      (r.address && r.address.toLowerCase().includes(q))
    );
  });

  // Calculate statistics
  const totalRantings = rantings.length;
  const coveredRois = rantings.filter(r => r.rois_name && r.rois_name.trim().length > 0).length;
  const coveredLeaders = rantings.filter(r => r.leader_name && r.leader_name.trim().length > 0).length;
  const completedAddresses = rantings.filter(r => r.address && r.address.trim().length > 0).length;
  const totalWargaSensus = rantings.reduce((sum, r) => sum + r.member_count, 0);

  const getFormInputClass = (fieldName: string) => {
    const base = "w-full bg-slate-50 border rounded-xl py-2 px-3 text-xs outline-none transition-all font-medium text-slate-700";
    const errorState = validationErrors[fieldName]
      ? "border-red-500 focus:border-red-500 focus:ring-red-500/10 text-red-900 bg-red-50/10"
      : "border-slate-200 focus:border-brand-emerald focus:ring-emerald-500/10";
    return `${base} ${errorState}`;
  };

  return (
    <div id="ranting_container" className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] bg-brand-emerald/10 text-brand-emerald font-bold rounded-full uppercase tracking-wider">
              Struktur Kewilayahan
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-[11px] text-slate-400 font-medium">Pengurus Anak Cabang (PAC)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Map className="w-6 h-6 text-brand-emerald" /> Pengurusan Ranting Desa / Kelurahan
          </h1>
          <p className="text-xs text-slate-500">
            Kelola struktur kepengurusan ranting (Syuriah/Tanfidziyah), alamat sekretariat resmi, koordinat geografis, serta memantau pertumbuhan warga hasil sensus.
          </p>
        </div>

        {canCreateOrDelete && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openCreate}
            className="flex items-center justify-center gap-2 bg-brand-emerald text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-sm hover:bg-emerald-600 transition-colors self-start md:self-auto"
          >
            <Plus className="w-4 h-4" /> Tambah Ranting Resmi
          </motion.button>
        )}
      </div>

      {/* Analytics Bento Block */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Ranting Resmi', count: totalRantings, suffix: 'Desa/Kel', icon: Map, color: 'text-brand-emerald bg-emerald-50' },
          { label: 'Rois Terisi', count: coveredRois, suffix: `dari ${totalRantings}`, icon: User, color: 'text-purple-600 bg-purple-50' },
          { label: 'Ketua Terisi', count: coveredLeaders, suffix: `dari ${totalRantings}`, icon: User, color: 'text-blue-600 bg-blue-50' },
          { label: 'Sekretariat Lengkap', count: completedAddresses, suffix: `dari ${totalRantings}`, icon: MapPin, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Warga Hasil Sensus', count: totalWargaSensus, suffix: 'Jiwa Terdaftar', icon: Users, color: 'text-amber-600 bg-amber-50' },
        ].map((item, index) => (
          <div key={index} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">{item.label}</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg sm:text-xl font-bold text-slate-800">{item.count}</span>
                <span className="text-[10px] text-slate-400 font-semibold">{item.suffix}</span>
              </div>
            </div>
            <div className={`p-2.5 rounded-xl ${item.color}`}>
              <item.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Search & Layout Toggles */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Ranting berdasarkan kode, nama, ketua, sekretaris, alamat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 text-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/10 focus:border-brand-emerald outline-none transition-all placeholder:text-slate-400 font-medium"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Layout Switcher Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-end sm:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'grid' 
                ? 'bg-white text-brand-emerald shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Tampilan Kotak (Grid)"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'table' 
                ? 'bg-white text-brand-emerald shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Tampilan Tabel (List)"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Loading Block */}
      {loading ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-brand-emerald animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Memuat data Ranting resmi...</p>
        </div>
      ) : filteredRantings.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Map className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-700">Ranting Tidak Ditemukan</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1 mx-auto">
            Tidak ada Ranting resmi yang cocok dengan kata kunci pencarian "{search}". Coba gunakan nama desa/kelurahan lainnya.
          </p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="mt-4 text-xs text-brand-emerald hover:underline font-bold flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Bersihkan Filter Pencarian
            </button>
          )}
        </div>
      ) : (
        <>
          {/* GRID LAYOUT */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRantings.map((ranting) => {
                const isMyRanting = user?.role === 'Admin Ranting' && user?.ranting_id === ranting.id;
                
                return (
                  <motion.div
                    key={ranting.id}
                    layoutId={`ranting_card_${ranting.id}`}
                    className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all ${
                      isMyRanting ? 'border-brand-emerald/40 ring-1 ring-emerald-500/10' : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-100 py-0.5 px-2 rounded-full border border-slate-200">
                            {ranting.code}
                          </span>
                          <h3 className="font-bold text-slate-800 text-sm tracking-tight mt-1">
                            {ranting.name}
                          </h3>
                        </div>

                        {/* Member Counter Chip */}
                        <div className="bg-emerald-50 border border-emerald-100 text-brand-emerald text-[11px] font-bold py-1 px-2.5 rounded-xl flex items-center gap-1 shadow-sm">
                          <Users className="w-3.5 h-3.5" /> {ranting.member_count} <span className="text-[9px] font-medium text-emerald-600/80">Jiwa</span>
                        </div>
                      </div>

                      <hr className="border-slate-100 my-3" />

                      {/* Structure Row with Photos */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 my-3 text-center">
                        {/* Rois */}
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-white relative shrink-0 flex items-center justify-center p-0.5">
                            {ranting.rois_photo_url ? (
                              <img src={ranting.rois_photo_url} alt={ranting.rois_name || 'Rois'} className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                            ) : (
                              <img src="/uploads/nahdlatul_ulama_logo.svg" alt="Default Rois" className="w-full h-full object-contain opacity-80" referrerPolicy="no-referrer" />
                            )}
                          </div>
                          <span className="text-[8px] uppercase font-bold text-purple-600 mt-1 block tracking-tight truncate w-full">Rois</span>
                          <span className="text-[10px] font-bold text-slate-700 truncate w-full leading-tight" title={ranting.rois_name || 'Kosong'}>
                            {ranting.rois_name || 'Kosong'}
                          </span>
                        </div>

                        {/* Ketua Tanfidziyah */}
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-white relative shrink-0 flex items-center justify-center p-0.5">
                            {ranting.leader_photo_url ? (
                              <img src={ranting.leader_photo_url} alt={ranting.leader_name || 'Ketua'} className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                            ) : (
                              <img src="/uploads/nahdlatul_ulama_logo.svg" alt="Default Ketua" className="w-full h-full object-contain opacity-80" referrerPolicy="no-referrer" />
                            )}
                          </div>
                          <span className="text-[8px] uppercase font-bold text-blue-600 mt-1 block tracking-tight truncate w-full">Ketua</span>
                          <span className="text-[10px] font-bold text-slate-700 truncate w-full leading-tight" title={ranting.leader_name || 'Kosong'}>
                            {ranting.leader_name || 'Kosong'}
                          </span>
                        </div>

                        {/* Sekretaris */}
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-white relative shrink-0 flex items-center justify-center p-0.5">
                            {ranting.secretary_photo_url ? (
                              <img src={ranting.secretary_photo_url} alt={ranting.secretary_name || 'Sekretaris'} className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                            ) : (
                              <img src="/uploads/nahdlatul_ulama_logo.svg" alt="Default Sekretaris" className="w-full h-full object-contain opacity-80" referrerPolicy="no-referrer" />
                            )}
                          </div>
                          <span className="text-[8px] uppercase font-bold text-emerald-600 mt-1 block tracking-tight truncate w-full">Sekretaris</span>
                          <span className="text-[10px] font-bold text-slate-700 truncate w-full leading-tight" title={ranting.secretary_name || '-'}>
                            {ranting.secretary_name || '-'}
                          </span>
                        </div>
                      </div>

                      {/* Potensi Ekonomi section */}
                      <div className="my-3 space-y-1.5 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Potensi Ekonomi Wilayah</div>
                        </div>
                        {ranting.potensi_ekonomi && ranting.potensi_ekonomi.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {ranting.potensi_ekonomi.map((p, idx) => (
                              <span key={idx} className="bg-white border border-slate-200 text-slate-600 text-[9px] font-bold py-0.5 px-2 rounded-full">
                                {p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[9px] font-medium text-slate-400 italic">Belum disurvei</div>
                        )}

                        {ranting.potensi_unggulan && (
                          <div className="pt-1.5 border-t border-dashed border-slate-200 flex items-center gap-1.5 text-[9px]">
                            <span className="bg-amber-100 border border-amber-250 text-amber-800 text-[8px] uppercase font-extrabold py-0.5 px-1 rounded">
                              Unggulan
                            </span>
                            <span className="font-bold text-slate-700 truncate" title={ranting.potensi_unggulan}>
                              {ranting.potensi_unggulan}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info lines */}
                      <div className="space-y-2.5 text-xs">
                        <div className="flex items-start gap-2.5">
                          <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Sekretariat Ranting</span>
                            <span className="text-slate-600 font-medium line-clamp-1 leading-tight">
                              {ranting.address || 'Alamat sekretariat belum dilengkapi.'}
                            </span>
                          </div>
                        </div>

                        {ranting.contact_no && (
                          <div className="flex items-center gap-2.5">
                            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                            <a href={`tel:${ranting.contact_no}`} className="font-semibold text-slate-600 hover:text-brand-emerald hover:underline font-mono">
                              {ranting.contact_no}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="border-t border-slate-100 mt-5 pt-3.5 flex items-center justify-between gap-2">
                      {ranting.latitude && ranting.longitude ? (
                        <button
                          type="button"
                          onClick={() => {
                            setMapRanting(ranting);
                            setIsMapModalOpen(true);
                          }}
                          className="text-[10px] font-bold text-brand-emerald hover:text-emerald-700 flex items-center gap-1.5 focus:outline-none bg-emerald-50 px-2 py-1 rounded-lg cursor-pointer"
                        >
                          <Compass className="w-3.5 h-3.5" /> Lihat Peta
                        </button>
                      ) : (
                        <span className="text-[9px] font-semibold text-slate-400 italic bg-slate-50 px-2 py-1 rounded-lg flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Koordi belum diset
                        </span>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setSelectedRanting(ranting); setIsDetailModalOpen(true); }}
                          className="text-[11px] font-bold text-slate-500 hover:text-slate-800 py-1.5 px-3 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          Detail
                        </button>
                        
                        {(canCreateOrDelete || isMyRanting) && (
                          <button
                            onClick={() => openEdit(ranting)}
                            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                            title="Edit Ranting"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        {canCreateOrDelete && (
                          <button
                            onClick={() => handleDelete(ranting)}
                            className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors"
                            title="Hapus Ranting"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* TABLE LAYOUT */}
          {viewMode === 'table' && (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-4 px-5">Kode & Ranting Desa</th>
                      <th className="py-4 px-5">Rois & Ketua</th>
                      <th className="py-4 px-5">Sekretaris</th>
                      <th className="py-4 px-5 text-center">Warga Sensus</th>
                      <th className="py-4 px-5">Sekretariat & Hubungi</th>
                      <th className="py-4 px-5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredRantings.map((ranting) => {
                      const isMyRanting = user?.role === 'Admin Ranting' && user?.ranting_id === ranting.id;

                      return (
                        <tr key={ranting.id} className={`hover:bg-slate-50/50 transition-colors ${isMyRanting ? 'bg-emerald-50/10 font-medium' : ''}`}>
                          {/* Code & Name */}
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-100 py-0.5 px-2 rounded-full border border-slate-200">
                                {ranting.code}
                              </span>
                              <div>
                                <span className="font-bold text-slate-800 text-xs">{ranting.name}</span>
                                {isMyRanting && (
                                  <span className="ml-2 px-1.5 py-0.2 text-[8px] font-bold uppercase bg-brand-emerald text-white rounded">Ranting Anda</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Leader */}
                          <td className="py-4 px-5 align-middle text-xs">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[8px] font-bold bg-purple-50 text-purple-600 px-1 py-0.2 rounded uppercase tracking-wider scale-90 origin-left shrink-0">Rois</span>
                                <span className="font-semibold text-slate-700 truncate max-w-[150px]">{ranting.rois_name || 'Kosong'}</span>
                              </div>
                              <div className="flex items-center gap-1.5 border-t border-slate-50 pt-0.5">
                                <span className="text-[8px] font-bold bg-blue-50 text-blue-600 px-1 py-0.2 rounded uppercase tracking-wider scale-90 origin-left shrink-0">Ketua</span>
                                <span className="font-bold text-slate-800 truncate max-w-[150px]">{ranting.leader_name || 'Kosong'}</span>
                              </div>
                            </div>
                          </td>

                          {/* Secretary */}
                          <td className="py-4 px-5 align-middle text-xs">
                            <span className="font-semibold text-slate-600">{ranting.secretary_name || '-'}</span>
                          </td>

                          {/* Members */}
                          <td className="py-4 px-5 align-middle text-center">
                            <span className="bg-emerald-100/60 text-brand-emerald font-bold text-xs py-1 px-2.5 rounded-full">
                              {ranting.member_count} Jiwa
                            </span>
                          </td>

                          {/* Contact and address */}
                          <td className="py-4 px-5 align-middle text-xs max-w-xs">
                            <div className="truncate text-slate-500 mb-0.5" title={ranting.address || ''}>
                              {ranting.address || 'Alamat belum diatur'}
                            </div>
                            {ranting.contact_no && (
                              <a href={`tel:${ranting.contact_no}`} className="text-[10px] font-bold text-slate-400 hover:text-brand-emerald font-mono">
                                {ranting.contact_no}
                              </a>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-5 align-middle text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => { setSelectedRanting(ranting); setIsDetailModalOpen(true); }}
                                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                                title="Lihat Detail"
                              >
                                <Info className="w-4 h-4" />
                              </button>

                              {(canCreateOrDelete || isMyRanting) && (
                                <button
                                  onClick={() => openEdit(ranting)}
                                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                                  title="Edit Ranting"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}

                              {canCreateOrDelete && (
                                <button
                                  onClick={() => handleDelete(ranting)}
                                  className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors"
                                  title="Hapus Ranting"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* FORM MODAL (CREATE / EDIT) */}
      <AnimatePresence>
        {isFormModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-xl shadow-xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="bg-brand-emerald text-white p-5 flex items-center justify-between shrink-0">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold flex items-center gap-1.5">
                    {modalType === 'create' ? <Plus className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                    {modalType === 'create' ? 'Tambah Ranting Baru' : 'Edit Informasi Ranting'}
                  </h3>
                  <p className="text-[10px] text-emerald-100">
                    {modalType === 'create' 
                      ? 'Daftarkan cabang kepengurusan Ranting Desa baru di wilayah Karangpawitan.'
                      : 'Perbarui kontak kepengurusan, sekretariat, atau koordinat Ranting.'
                    }
                  </p>
                </div>
                <button 
                  onClick={() => setIsFormModalOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg text-emerald-100 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                  {formError && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <span className="font-semibold">{formError}</span>
                    </div>
                  )}

                  {formSuccess && (
                    <div className="p-3 bg-green-50 border border-green-100 text-green-700 rounded-xl text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      <span className="font-bold">{formSuccess}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Code */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Kode Ranting *</label>
                      <input
                        type="text"
                        name="code"
                        placeholder="Contoh: RNT-GDK"
                        value={formData.code}
                        onChange={handleInputChange}
                        disabled={modalType === 'edit' && !hasRole('Super Admin') && !hasRole('Sekretaris')}
                        className={getFormInputClass('code')}
                      />
                      {validationErrors.code && (
                        <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {validationErrors.code}
                        </p>
                      )}
                    </div>

                    {/* Name */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Nama Ranting *</label>
                      <input
                        type="text"
                        name="name"
                        placeholder="Contoh: Ranting Desa Godog"
                        value={formData.name}
                        onChange={handleInputChange}
                        disabled={modalType === 'edit' && !hasRole('Super Admin') && !hasRole('Sekretaris')}
                        className={getFormInputClass('name')}
                      />
                      {validationErrors.name && (
                        <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {validationErrors.name}
                        </p>
                      )}
                    </div>

                    {/* Rois Syuriah Name & Photo */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Nama Rois Syuriah Ranting</label>
                      <input
                        type="text"
                        name="rois_name"
                        placeholder="Nama Lengkap Rois Syuriah dengan Gelar"
                        value={formData.rois_name}
                        onChange={handleInputChange}
                        className={getFormInputClass('rois_name')}
                      />
                      <div className="flex flex-col gap-2 mt-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 block">Foto Rois Syuriah</span>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-white overflow-hidden border-2 border-emerald-500 shrink-0 shadow-sm flex items-center justify-center relative p-1">
                            {formData.rois_photo_url ? (
                              <img src={formData.rois_photo_url} alt="Preview Rois" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                            ) : (
                              <img src="/uploads/nahdlatul_ulama_logo.svg" alt="Default Rois" className="w-full h-full object-contain opacity-70" referrerPolicy="no-referrer" />
                            )}
                            {uploadingField === 'rois_photo_url' && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <RefreshCw className="w-4 h-4 text-white animate-spin" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <label className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer shadow-sm flex items-center gap-1.5">
                                <Upload className="w-3.5 h-3.5" />
                                {uploadingField === 'rois_photo_url' ? 'Mengunggah...' : 'Unggah Foto'}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handlePhotoUpload(e, 'rois_photo_url')}
                                  className="hidden"
                                  disabled={uploadingField !== null}
                                />
                              </label>
                              {formData.rois_photo_url && (
                                <button
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, rois_photo_url: '' }))}
                                  className="text-xs text-red-500 hover:text-red-700 font-bold px-2 py-1.5 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
                                >
                                  Hapus
                                </button>
                              )}
                            </div>
                            <p className="text-[9px] text-slate-400 font-medium leading-tight">Format JPG/PNG, maks 5MB. Atau masukkan URL langsung:</p>
                            <input
                              type="text"
                              name="rois_photo_url"
                              placeholder="https://example.com/photo.jpg"
                              value={formData.rois_photo_url}
                              onChange={handleInputChange}
                              className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2 text-[9px] outline-none transition-all font-mono text-slate-600"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Leader Name (Ketua Tanfidziyah) & Photo */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Nama Ketua Tanfidziyah Ranting</label>
                      <input
                        type="text"
                        name="leader_name"
                        placeholder="Nama Lengkap Ketua Tanfidziyah dengan Gelar"
                        value={formData.leader_name}
                        onChange={handleInputChange}
                        className={getFormInputClass('leader_name')}
                      />
                      <div className="flex flex-col gap-2 mt-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 block">Foto Ketua Tanfidziyah</span>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-white overflow-hidden border-2 border-emerald-500 shrink-0 shadow-sm flex items-center justify-center relative p-1">
                            {formData.leader_photo_url ? (
                              <img src={formData.leader_photo_url} alt="Preview Ketua" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                            ) : (
                              <img src="/uploads/nahdlatul_ulama_logo.svg" alt="Default Ketua" className="w-full h-full object-contain opacity-70" referrerPolicy="no-referrer" />
                            )}
                            {uploadingField === 'leader_photo_url' && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <RefreshCw className="w-4 h-4 text-white animate-spin" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <label className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer shadow-sm flex items-center gap-1.5">
                                <Upload className="w-3.5 h-3.5" />
                                {uploadingField === 'leader_photo_url' ? 'Mengunggah...' : 'Unggah Foto'}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handlePhotoUpload(e, 'leader_photo_url')}
                                  className="hidden"
                                  disabled={uploadingField !== null}
                                />
                              </label>
                              {formData.leader_photo_url && (
                                <button
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, leader_photo_url: '' }))}
                                  className="text-xs text-red-500 hover:text-red-700 font-bold px-2 py-1.5 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
                                >
                                  Hapus
                                </button>
                              )}
                            </div>
                            <p className="text-[9px] text-slate-400 font-medium leading-tight">Format JPG/PNG, maks 5MB. Atau masukkan URL langsung:</p>
                            <input
                              type="text"
                              name="leader_photo_url"
                              placeholder="https://example.com/photo.jpg"
                              value={formData.leader_photo_url}
                              onChange={handleInputChange}
                              className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2 text-[9px] outline-none transition-all font-mono text-slate-600"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Secretary Name & Photo */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Nama Sekretaris Ranting</label>
                      <input
                        type="text"
                        name="secretary_name"
                        placeholder="Nama Sekretaris Ranting"
                        value={formData.secretary_name}
                        onChange={handleInputChange}
                        className={getFormInputClass('secretary_name')}
                      />
                      <div className="flex flex-col gap-2 mt-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 block">Foto Sekretaris Ranting</span>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-white overflow-hidden border-2 border-emerald-500 shrink-0 shadow-sm flex items-center justify-center relative p-1">
                            {formData.secretary_photo_url ? (
                              <img src={formData.secretary_photo_url} alt="Preview Sekretaris" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                            ) : (
                              <img src="/uploads/nahdlatul_ulama_logo.svg" alt="Default Sekretaris" className="w-full h-full object-contain opacity-70" referrerPolicy="no-referrer" />
                            )}
                            {uploadingField === 'secretary_photo_url' && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <RefreshCw className="w-4 h-4 text-white animate-spin" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <label className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer shadow-sm flex items-center gap-1.5">
                                <Upload className="w-3.5 h-3.5" />
                                {uploadingField === 'secretary_photo_url' ? 'Mengunggah...' : 'Unggah Foto'}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handlePhotoUpload(e, 'secretary_photo_url')}
                                  className="hidden"
                                  disabled={uploadingField !== null}
                                />
                              </label>
                              {formData.secretary_photo_url && (
                                <button
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, secretary_photo_url: '' }))}
                                  className="text-xs text-red-500 hover:text-red-700 font-bold px-2 py-1.5 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
                                >
                                  Hapus
                                </button>
                              )}
                            </div>
                            <p className="text-[9px] text-slate-400 font-medium leading-tight">Format JPG/PNG, maks 5MB. Atau masukkan URL langsung:</p>
                            <input
                              type="text"
                              name="secretary_photo_url"
                              placeholder="https://example.com/photo.jpg"
                              value={formData.secretary_photo_url}
                              onChange={handleInputChange}
                              className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2 text-[9px] outline-none transition-all font-mono text-slate-600"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact Number */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Nomor HP / WhatsApp Resmi</label>
                      <input
                        type="text"
                        name="contact_no"
                        placeholder="Contoh: 081234567890"
                        value={formData.contact_no}
                        onChange={handleInputChange}
                        className={getFormInputClass('contact_no')}
                      />
                    </div>

                    {/* Latitude / Longitude */}
                    <div className="space-y-1 md:col-span-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Koordinat Lokasi (GPS)
                        </label>
                        <button
                          type="button"
                          onClick={fetchGPSLocation}
                          disabled={gpsLoading}
                          className="flex items-center gap-1 text-[10px] text-brand-emerald hover:text-emerald-700 font-bold transition-all disabled:text-slate-400 cursor-pointer animate-none"
                          title="Dapatkan koordinat lokasi GPS saat ini"
                        >
                          <RefreshCw className={`w-3 h-3 ${gpsLoading ? 'animate-spin' : ''}`} />
                          {gpsLoading ? 'Mencari...' : 'Refresh Lokasi'}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <input
                            type="text"
                            name="latitude"
                            placeholder="Latitude (e.g. -7.2185)"
                            value={formData.latitude}
                            onChange={handleInputChange}
                            className={getFormInputClass('latitude')}
                          />
                          {validationErrors.latitude && (
                            <p className="text-[9px] text-red-500 font-semibold mt-0.5">{validationErrors.latitude}</p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <input
                            type="text"
                            name="longitude"
                            placeholder="Longitude (e.g. 107.9354)"
                            value={formData.longitude}
                            onChange={handleInputChange}
                            className={getFormInputClass('longitude')}
                          />
                          {validationErrors.longitude && (
                            <p className="text-[9px] text-red-500 font-semibold mt-0.5">{validationErrors.longitude}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Alamat Sekretariat Resmi Ranting</label>
                    <textarea
                      name="address"
                      rows={2}
                      placeholder="Contoh: Dusun Pasiripis RT 02/03 Desa Godog, Karangpawitan, Garut..."
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-brand-emerald rounded-xl py-2 px-3 text-xs outline-none transition-all font-medium text-slate-700"
                    />
                  </div>

                  {/* Potensi Ekonomi (Multiple Selection) */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Potensi Ekonomi Wilayah (Bisa Pilih Lebih dari 1)</label>
                    <div className="flex flex-wrap gap-1.5">
                      {['Pertanian', 'Peternakan', 'Perdagangan', 'UMKM', 'Jasa', 'Industri Rumah Tangga', 'Perikanan', 'Perkebunan', 'Pariwisata'].map((potensi) => {
                        const isSelected = formData.potensi_ekonomi.includes(potensi);
                        return (
                          <button
                            key={potensi}
                            type="button"
                            onClick={() => togglePotensiEkonomi(potensi)}
                            className={`px-3 py-1.5 rounded-full border text-[10px] font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-50 text-brand-emerald border-brand-emerald shadow-sm'
                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {potensi}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Potensi Unggulan Daerah */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Potensi Unggulan Ranting (1 Poin Utama)</label>
                    <input
                      type="text"
                      name="potensi_unggulan"
                      placeholder="Contoh: Sentra Kerajinan Kulit Karangpawitan, Peternakan Domba Garut Unggulan..."
                      value={formData.potensi_unggulan}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-brand-emerald rounded-xl py-2 px-3 text-xs outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Submit Action Buttons */}
                <div className="flex items-center justify-end gap-2 p-5 bg-slate-50 border-t border-slate-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="py-2 px-4 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 text-xs font-bold transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 bg-brand-emerald hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Simpan Perubahan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAIL MODAL WITH MAPPING INFO AND CITIZEN DATA */}
      <AnimatePresence>
        {isDetailModalOpen && selectedRanting && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col"
            >
              {/* Header card banner */}
              <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white p-6 relative shrink-0">
                <button 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="absolute right-4 top-4 p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-emerald-100 hover:text-white transition-all cursor-pointer z-10"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <span className="font-mono text-[9px] font-bold text-emerald-200 bg-emerald-950/40 py-0.5 px-2 rounded-full border border-emerald-800">
                  RANTING RESMI • KODE: {selectedRanting.code}
                </span>
                <h3 className="text-lg font-bold mt-2 font-display">{selectedRanting.name}</h3>
                <p className="text-xs text-emerald-200 font-medium mt-1">SIM MWC NU Karangpawitan, Kabupaten Garut</p>
              </div>

              {/* Detail Content */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                
                {/* Visual statistics grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Warga</span>
                    <span className="text-lg font-black text-slate-800">{selectedRanting.member_count || 0} <span className="text-[10px] font-medium text-slate-400">Jiwa</span></span>
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-500 font-bold uppercase block">Laki-Laki</span>
                    <span className="text-lg font-black text-blue-900">{selectedRanting.member_l_count || 0} <span className="text-[10px] font-medium text-slate-400">Jiwa</span></span>
                  </div>
                  <div>
                    <span className="text-[10px] text-pink-500 font-bold uppercase block">Perempuan</span>
                    <span className="text-lg font-black text-pink-900">{selectedRanting.member_p_count || 0} <span className="text-[10px] font-medium text-slate-400">Jiwa</span></span>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-600 font-bold uppercase block">Sensus Disetujui</span>
                    <span className="text-lg font-black text-amber-900">{selectedRanting.member_approved_count || 0} <span className="text-[10px] font-medium text-slate-400">Acc</span></span>
                  </div>
                </div>                {/* Structure info lists */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Kepengurusan Ranting</h4>
                  
                  <div className="space-y-2.5 bg-white border border-slate-100 rounded-xl p-3.5 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-white shrink-0 relative flex items-center justify-center p-0.5">
                        {selectedRanting.rois_photo_url ? (
                          <img src={selectedRanting.rois_photo_url} alt="Rois Photo" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                        ) : (
                          <img src="/uploads/nahdlatul_ulama_logo.svg" alt="Default Rois" className="w-full h-full object-contain opacity-80" referrerPolicy="no-referrer" />
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-purple-500 uppercase block leading-none">Rois Syuriah Ranting</span>
                        <span className="text-xs font-bold text-slate-800 block mt-1">{selectedRanting.rois_name || 'Belum Dilaporkan'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2.5 border-t border-slate-50">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-white shrink-0 relative flex items-center justify-center p-0.5">
                        {selectedRanting.leader_photo_url ? (
                          <img src={selectedRanting.leader_photo_url} alt="Leader Photo" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                        ) : (
                          <img src="/uploads/nahdlatul_ulama_logo.svg" alt="Default Ketua" className="w-full h-full object-contain opacity-80" referrerPolicy="no-referrer" />
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-blue-500 uppercase block leading-none">Ketua Tanfidziyah Ranting</span>
                        <span className="text-xs font-bold text-slate-800 block mt-1">{selectedRanting.leader_name || 'Belum Dilaporkan'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2.5 border-t border-slate-50">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-white shrink-0 relative flex items-center justify-center p-0.5">
                        {selectedRanting.secretary_photo_url ? (
                          <img src={selectedRanting.secretary_photo_url} alt="Secretary Photo" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                        ) : (
                          <img src="/uploads/nahdlatul_ulama_logo.svg" alt="Default Sekretaris" className="w-full h-full object-contain opacity-80" referrerPolicy="no-referrer" />
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block leading-none">Sekretaris Ranting</span>
                        <span className="text-xs font-semibold text-slate-700 block mt-1">{selectedRanting.secretary_name || 'Belum Diisi'}</span>
                      </div>
                    </div>

                    {selectedRanting.contact_no && (
                      <div className="flex items-start gap-3 pt-2.5 border-t border-slate-50">
                        <div className="p-2 bg-slate-50 text-slate-500 rounded-lg shrink-0">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block leading-none">Hubungi Pengurus / WA</span>
                          <a href={`tel:${selectedRanting.contact_no}`} className="text-xs font-bold text-emerald-700 hover:underline font-mono block mt-1">
                            {selectedRanting.contact_no}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Potensi Ekonomi detail */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Potensi & Keunggulan Ekonomi</h4>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3.5 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Potensi Sektor Ekonomi</span>
                      {selectedRanting.potensi_ekonomi && selectedRanting.potensi_ekonomi.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {selectedRanting.potensi_ekonomi.map((p, idx) => (
                            <span key={idx} className="bg-white border border-slate-200 text-slate-600 text-[10px] font-bold py-1 px-2.5 rounded-full shadow-xs">
                              {p}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 italic mt-1 font-medium">Belum disurvei.</p>
                      )}
                    </div>

                    {selectedRanting.potensi_unggulan && (
                      <div className="pt-3 border-t border-dashed border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Produk/Potensi Unggulan Ranting</span>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="bg-amber-100 border border-amber-200 text-amber-800 text-[9px] uppercase font-extrabold py-0.5 px-2 rounded-md">
                            Unggulan Utama
                          </span>
                          <span className="font-extrabold text-slate-800 text-xs">
                            {selectedRanting.potensi_unggulan}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Geographical & Address details */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Alamat & Pemetaan</h4>
                  
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Alamat Sekretariat Resmi</span>
                      <p className="text-slate-700 font-medium leading-relaxed mt-1">
                        {selectedRanting.address || 'Alamat fisik sekretariat Ranting belum diunggah oleh operator.'}
                      </p>
                    </div>

                    {selectedRanting.latitude && selectedRanting.longitude ? (
                      <div className="pt-3 border-t border-slate-200/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Koordinat Geografis</span>
                            <p className="text-[11px] font-mono font-semibold text-slate-600 mt-0.5">
                              Lat: {selectedRanting.latitude}, Lng: {selectedRanting.longitude}
                            </p>
                          </div>
                        </div>
                        
                        {/* Interactive Google Map iframe embedded inside the app */}
                        <div className="w-full h-44 rounded-xl overflow-hidden border border-slate-200 shadow-sm relative bg-slate-100">
                          <iframe
                            src={`https://maps.google.com/maps?q=${selectedRanting.latitude},${selectedRanting.longitude}&hl=id&z=15&output=embed`}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen={true}
                            loading="lazy"
                            title={`Peta Lokasi ${selectedRanting.name}`}
                            className="w-full h-full"
                          ></iframe>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-200/50 text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        Koordinat GPS belum dimasukkan. Silakan edit Ranting ini untuk mengonfigurasi koordinat peta.
                      </div>
                    )}
                  </div>
                </div>

                 {/* Close Button */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsDetailModalOpen(false)}
                    className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    Tutup Detail
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      if (onBackToDashboard) onBackToDashboard();
                    }}
                    className="py-2.5 px-5 bg-brand-emerald hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Home className="w-4 h-4 text-yellow-300" />
                    Kembali ke Menu Utama
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MAP MODAL */}
      <AnimatePresence>
        {isMapModalOpen && mapRanting && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-2xl shadow-xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="bg-brand-emerald text-white p-5 flex items-center justify-between shrink-0">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold flex items-center gap-1.5">
                    <Compass className="w-4 h-4 animate-pulse" />
                    Peta Lokasi - {mapRanting.name}
                  </h3>
                  <p className="text-[10px] text-emerald-100">
                    Sistem pemetaan digital Kantor Sekretariat Ranting NU
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {onBackToDashboard && (
                    <button 
                      onClick={() => { setIsMapModalOpen(false); setMapRanting(null); onBackToDashboard(); }}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-[10px] font-bold rounded-xl text-white transition-all cursor-pointer border border-white/10"
                      title="Kembali ke Menu Utama (Dasbor)"
                    >
                      <Home className="w-3 h-3 text-yellow-300" />
                      <span>Menu Utama</span>
                    </button>
                  )}
                  <button 
                    onClick={() => { setIsMapModalOpen(false); setMapRanting(null); }}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white/15 hover:bg-white/25 text-[10px] font-bold rounded-xl text-white transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Kembali</span>
                  </button>
                  <button 
                    onClick={() => { setIsMapModalOpen(false); setMapRanting(null); }}
                    className="p-1 hover:bg-white/10 rounded-lg text-emerald-100 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Map Frame Content */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Alamat Sekretariat</span>
                    <span className="font-semibold text-slate-700 block">{mapRanting.address || 'Alamat fisik sekretariat belum dilengkapi.'}</span>
                  </div>
                  <div className="space-y-1 text-xs shrink-0 font-mono">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Koordinat GPS</span>
                    <span className="text-slate-500 font-medium">Lat: {mapRanting.latitude}, Lng: {mapRanting.longitude}</span>
                  </div>
                </div>

                {/* The Map Frame */}
                <div className="w-full h-96 rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative bg-slate-100">
                  <iframe
                    src={`https://maps.google.com/maps?q=${mapRanting.latitude},${mapRanting.longitude}&hl=id&z=15&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={true}
                    loading="lazy"
                    title={`Peta Lokasi ${mapRanting.name}`}
                    className="w-full h-full"
                  ></iframe>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center p-5 bg-slate-50 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => { setIsMapModalOpen(false); setMapRanting(null); }}
                  className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Tutup Peta
                </button>
                <button
                  type="button"
                  onClick={() => { 
                    setIsMapModalOpen(false); 
                    setMapRanting(null); 
                    if (onBackToDashboard) onBackToDashboard(); 
                  }}
                  className="py-2.5 px-5 bg-brand-emerald hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Home className="w-4 h-4 text-yellow-300" />
                  Kembali ke Menu Utama
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* CUSTOM DELETE CONFIRMATION MODAL */}
        {rantingToDelete && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-xl overflow-hidden border border-slate-100 flex flex-col"
            >
              {/* Header */}
              <div className="bg-red-50 border-b border-red-100 p-6 flex items-start gap-4 text-left">
                <div className="p-3 bg-red-100 rounded-2xl text-red-600 shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-display">Konfirmasi Hapus Ranting</h3>
                  <p className="text-xs text-slate-500 mt-1">SIM MWC NU Karangpawitan, Garut</p>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 text-left space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Apakah Anda yakin ingin menghapus unit Ranting <strong className="text-slate-900">"{rantingToDelete.name}"</strong> (Kode: <strong className="font-mono text-xs">{rantingToDelete.code}</strong>)?
                </p>
                <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-800 leading-relaxed">
                    Tindakan ini bersifat permanen dan tidak dapat dibatalkan. Log aktivitas penghapusan ini akan dicatat dalam Log Audit Keamanan.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2.5 p-5 bg-slate-50 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRantingToDelete(null)}
                  className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={executeDelete}
                  className="py-2.5 px-5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Ya, Hapus Ranting
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
