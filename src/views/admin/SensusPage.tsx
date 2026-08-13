/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  Plus, Search, Filter, CheckCircle2, AlertCircle, XCircle, FileSpreadsheet, Eye, UserCheck, 
  X, Landmark, Award, BookOpen, Briefcase, GraduationCap, ArrowRight, ArrowLeft, Heart, Sparkles, AlertTriangle,
  User, Upload, Calendar, ChevronRight, Users, Printer, Edit2, Trash2, MessageCircle
} from 'lucide-react';

interface Potensi {
  id: number;
  name: string;
  category: string;
}

interface Member {
  id: number;
  nik: string;
  no_kk: string;
  name: string;
  gender: 'L' | 'P';
  place_of_birth: string | null;
  date_of_birth: string | null;
  marital_status: string | null;
  address: string | null;
  rt: string | null;
  rw: string | null;
  phone: string | null;
  email: string | null;
  ranting_id: number;
  ranting_name: string;
  banom_id: number | null;
  banom_name: string | null;
  jamiyah: string | null;
  year_joined: number | null;
  kta_number: string | null;
  status_sensus: 'Draft' | 'Menunggu Verifikasi' | 'Revisi' | 'Disetujui' | 'Ditolak';
  notes: string | null;
  mwc_posisi?: string | null;
  mwc_posisi_nama?: string | null;
  mwc_jabatan?: string | null;
  pendidikan?: {
    last_education: string | null;
    school_name: string | null;
    major: string | null;
    pesantren_name: string | null;
    pesantren_duration_years: number | null;
    skills: string | null;
    certifications: string | null;
  } | null;
  pekerjaan?: {
    profession: string | null;
    company_name: string | null;
    position: string | null;
    has_umkm: boolean;
    umkm_name: string | null;
    umkm_sector: string | null;
    monthly_income: string | null;
  } | null;
  potensi?: Potensi[];
}

interface Ranting {
  id: number;
  code: string;
  name: string;
}

const LIST_POTENSI = [
  { id: 1, name: 'Kyai / Ulama', category: 'Keagamaan' },
  { id: 2, name: 'Ustadz / Guru Ngaji', category: 'Keagamaan' },
  { id: 3, name: 'Qori / Qoriah', category: 'Keagamaan' },
  { id: 4, name: 'Praktisi IT / Programmer', category: 'Teknologi' },
  { id: 5, name: 'Pelaku UMKM', category: 'Ekonomi' },
  { id: 6, name: 'Dosen / Tenaga Pendidik', category: 'Pendidikan' },
  { id: 7, name: 'Tenaga Medis', category: 'Kesehatan' },
  { id: 8, name: 'Aktivis Sosial', category: 'Sosial' }
];

export default function SensusPage() {
  const { user, token, hasRole } = useAuth();
  const { successToast, errorToast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [allUnfilteredMembers, setAllUnfilteredMembers] = useState<Member[]>([]);
  const [rantings, setRantings] = useState<Ranting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRecapOpen, setIsRecapOpen] = useState(true);
  const [recapSubTab, setRecapSubTab] = useState<'demografi' | 'ranting_rt'>('demografi');
  
  // Search and Filters
  const [search, setSearch] = useState('');
  const [filterRanting, setFilterRanting] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'diri' | 'pendidikan' | 'pekerjaan' | 'potensi'>('diri');
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'Disetujui' | 'Revisi' | 'Ditolak'>('Disetujui');
  const [verifyNotes, setVerifyNotes] = useState('');

  // Form states
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formData, setFormData] = useState({
    nik: '',
    no_kk: '',
    name: '',
    gender: 'L' as 'L' | 'P',
    place_of_birth: '',
    date_of_birth: '',
    marital_status: 'Belum Kawin',
    address: '',
    rt: '',
    rw: '',
    phone: '',
    email: '',
    ranting_id: '',
    banom_id: '',
    jamiyah: 'Warga Biasa',
    year_joined: new Date().getFullYear(),
    photo_url: '',
    mwc_posisi: '',
    mwc_posisi_nama: '',
    mwc_jabatan: '',
    
    // Pendidikan
    last_education: 'SMA',
    school_name: '',
    major: '',
    pesantren_name: '',
    pesantren_duration_years: '',
    skills: '',
    certifications: '',

    // Pekerjaan
    profession: '',
    company_name: '',
    position: '',
    has_umkm: false,
    umkm_name: '',
    umkm_sector: '',
    monthly_income: '< Rp 1.500.000',

    // Potensi Many-to-Many
    potensi_ids: [] as number[]
  });

  const [allPotensi, setAllPotensi] = useState<{ id: number; name: string; category: string }[]>(LIST_POTENSI);
  const [customPotensiInput, setCustomPotensiInput] = useState('');
  const [customPotensiList, setCustomPotensiList] = useState<string[]>([]);

  // Load Main Data
  const loadData = async () => {
    setLoading(true);
    try {
      const rantingRes = await fetch('/api/public/rantings');
      if (rantingRes.ok) {
        const data = await rantingRes.json();
        setRantings(data.data || []);
      }

      // Fetch dynamic system potentials list
      const potRes = await fetch('/api/potensi', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (potRes.ok) {
        const potData = await potRes.json();
        if (potData.data && potData.data.length > 0) {
          setAllPotensi(potData.data);
        }
      }

      // Build query string
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (filterRanting) query.append('ranting_id', filterRanting);
      if (filterStatus) query.append('status_sensus', filterStatus);

      // Fetch filtered members for the table
      const sensusRes = await fetch(`/api/sensus?${query.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (sensusRes.ok) {
        const data = await sensusRes.json();
        setMembers(data.data || []);
      }

      // Fetch absolute unfiltered authorised members for recap calculations
      const absoluteRes = await fetch(`/api/sensus`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (absoluteRes.ok) {
        const data = await absoluteRes.json();
        setAllUnfilteredMembers(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load sensus page data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Pre-populate user's ranting restriction if Admin Ranting
    if (user && user.role === 'Admin Ranting' && user.ranting_id) {
      setFormData(prev => ({ ...prev, ranting_id: String(user.ranting_id) }));
    }
  }, [search, filterRanting, filterStatus, user]);

  const handleTogglePotensi = (id: number) => {
    setFormData(prev => {
      const alreadyChecked = prev.potensi_ids.includes(id);
      return {
        ...prev,
        potensi_ids: alreadyChecked 
          ? prev.potensi_ids.filter(pId => pId !== id)
          : [...prev.potensi_ids, id]
      };
    });
  };

  const handleAddCustomPotensi = () => {
    const trimmed = customPotensiInput.trim();
    if (!trimmed) return;
    if (customPotensiList.some(p => p.toLowerCase() === trimmed.toLowerCase())) {
      errorToast('Potensi custom sudah ada dalam daftar.');
      return;
    }
    setCustomPotensiList(prev => [...prev, trimmed]);
    setCustomPotensiInput('');
  };

  const handleRemoveCustomPotensi = (nameToRemove: string) => {
    setCustomPotensiList(prev => prev.filter(p => p !== nameToRemove));
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (formData.nik.length !== 16 || formData.no_kk.length !== 16) {
      setFormError('Nomor NIK KTP dan KK harus tepat 16 digit.');
      return;
    }

    if (!formData.name.trim()) {
      setFormError('Nama lengkap warga wajib diisi.');
      return;
    }

    const rId = formData.ranting_id || (user?.role === 'Admin Ranting' ? user.ranting_id : '');
    if (!rId) {
      setFormError('Silakan pilih ranting asal domisili warga.');
      return;
    }

    const body = {
      ...formData,
      ranting_id: Number(rId),
      banom_id: formData.banom_id ? Number(formData.banom_id) : null,
      pendidikan: {
        last_education: formData.last_education,
        school_name: formData.school_name || null,
        major: formData.major || null,
        pesantren_name: formData.pesantren_name || null,
        pesantren_duration_years: formData.pesantren_duration_years ? Number(formData.pesantren_duration_years) : null,
        skills: formData.skills || null,
        certifications: formData.certifications || null
      },
      pekerjaan: {
        profession: formData.profession || null,
        company_name: formData.company_name || null,
        position: formData.position || null,
        has_umkm: formData.has_umkm,
        umkm_name: formData.has_umkm ? formData.umkm_name : null,
        umkm_sector: formData.has_umkm ? formData.umkm_sector : null,
        monthly_income: formData.monthly_income || null
      },
      custom_potensi_names: customPotensiList
    };

    try {
      const url = editingId ? `/api/sensus/${editingId}` : '/api/sensus';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const result = await response.json();
      if (result.success) {
        const successMsg = editingId ? 'Data warga berhasil diperbarui!' : 'Warga berhasil didaftarkan ke sistem Sensus!';
        setFormSuccess(successMsg);
        successToast(successMsg);
        setTimeout(() => {
          setIsAddModalOpen(false);
          setEditingId(null);
          // Reset form
          setFormData({
            nik: '', no_kk: '', name: '', gender: 'L', place_of_birth: '', date_of_birth: '',
            marital_status: 'Belum Kawin', address: '', rt: '', rw: '', phone: '', email: '',
            ranting_id: user?.role === 'Admin Ranting' ? String(user.ranting_id) : '', banom_id: '',
            jamiyah: 'Warga Biasa', year_joined: new Date().getFullYear(), photo_url: '',
            mwc_posisi: '', mwc_posisi_nama: '', mwc_jabatan: '',
            last_education: 'SMA',
            school_name: '', major: '', pesantren_name: '', pesantren_duration_years: '', skills: '',
            certifications: '', profession: '', company_name: '', position: '', has_umkm: false,
            umkm_name: '', umkm_sector: '', monthly_income: '< Rp 1.500.000', potensi_ids: []
          });
          setActiveTab('diri');
          loadData();
        }, 1000);
      } else {
        const errorMsg = result.message || 'Gagal menyimpan data warga.';
        setFormError(errorMsg);
        errorToast(errorMsg);
      }
    } catch (err) {
      setFormError('Gangguan jaringan. Gagal menghubungi server.');
      errorToast('Gangguan jaringan. Gagal menghubungi server.');
    }
  };

  const handleEditClick = (m: Member) => {
    setEditingId(m.id);
    setFormData({
      nik: m.nik || '',
      no_kk: m.no_kk || '',
      name: m.name || '',
      gender: m.gender || 'L',
      place_of_birth: m.place_of_birth || '',
      date_of_birth: m.date_of_birth ? m.date_of_birth.substring(0, 10) : '',
      marital_status: m.marital_status || 'Belum Kawin',
      address: m.address || '',
      rt: m.rt || '',
      rw: m.rw || '',
      phone: m.phone || '',
      email: m.email || '',
      ranting_id: String(m.ranting_id),
      banom_id: m.banom_id ? String(m.banom_id) : '',
      jamiyah: m.jamiyah || 'Warga Biasa',
      year_joined: m.year_joined || new Date().getFullYear(),
      photo_url: '',
      mwc_posisi: m.mwc_posisi || '',
      mwc_posisi_nama: m.mwc_posisi_nama || '',
      mwc_jabatan: m.mwc_jabatan || '',

      // Pendidikan
      last_education: m.pendidikan?.last_education || 'SMA',
      school_name: m.pendidikan?.school_name || '',
      major: m.pendidikan?.major || '',
      pesantren_name: m.pendidikan?.pesantren_name || '',
      pesantren_duration_years: m.pendidikan?.pesantren_duration_years ? String(m.pendidikan.pesantren_duration_years) : '',
      skills: m.pendidikan?.skills || '',
      certifications: m.pendidikan?.certifications || '',

      // Pekerjaan
      profession: m.pekerjaan?.profession || '',
      company_name: m.pekerjaan?.company_name || '',
      position: m.pekerjaan?.position || '',
      has_umkm: !!m.pekerjaan?.has_umkm,
      umkm_name: m.pekerjaan?.umkm_name || '',
      umkm_sector: m.pekerjaan?.umkm_sector || '',
      monthly_income: m.pekerjaan?.monthly_income || '< Rp 1.500.000',

      // Potensi
      potensi_ids: m.potensi ? m.potensi.map(p => p.id) : []
    });
    const customNames = m.potensi ? m.potensi.filter(p => p.category === 'Keahlian Khusus / Custom' || !LIST_POTENSI.some(lp => lp.id === p.id)).map(p => p.name) : [];
    setCustomPotensiList(customNames);
    setCustomPotensiInput('');
    setFormError('');
    setFormSuccess('');
    setActiveTab('diri');
    setIsAddModalOpen(true);
  };

  const handleDeleteClick = async (id: number, name: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus data warga "${name}"? Tindakan ini bersifat permanen.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/sensus/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      if (result.success) {
        successToast('Data warga berhasil dihapus dari sistem Sensus.');
        loadData();
      } else {
        errorToast(result.message || 'Gagal menghapus data warga.');
      }
    } catch (err) {
      console.error('Failed to delete member:', err);
      errorToast('Gangguan jaringan. Gagal menghubungi server.');
    }
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingId(null);
    setFormData({
      nik: '', no_kk: '', name: '', gender: 'L', place_of_birth: '', date_of_birth: '',
      marital_status: 'Belum Kawin', address: '', rt: '', rw: '', phone: '', email: '',
      ranting_id: user?.role === 'Admin Ranting' ? String(user.ranting_id) : '', banom_id: '',
      jamiyah: 'Warga Biasa', year_joined: new Date().getFullYear(), photo_url: '',
      mwc_posisi: '', mwc_posisi_nama: '', mwc_jabatan: '',
      last_education: 'SMA',
      school_name: '', major: '', pesantren_name: '', pesantren_duration_years: '', skills: '',
      certifications: '', profession: '', company_name: '', position: '', has_umkm: false,
      umkm_name: '', umkm_sector: '', monthly_income: '< Rp 1.500.000', potensi_ids: []
    });
    setCustomPotensiList([]);
    setCustomPotensiInput('');
    setFormError('');
    setFormSuccess('');
    setActiveTab('diri');
  };

  const handleNewSensusClick = () => {
    handleCloseModal();
    setIsAddModalOpen(true);
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingMember) return;

    try {
      const response = await fetch(`/api/sensus/${viewingMember.id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status_sensus: verifyStatus,
          notes: verifyNotes
        })
      });

      const result = await response.json();
      if (result.success) {
        successToast(`Sensus warga berhasil diverifikasi dengan status: ${verifyStatus}`);
        setIsVerifying(false);
        setViewingMember(null);
        loadData();
      } else {
        errorToast(result.message || 'Gagal memproses verifikasi.');
      }
    } catch (err) {
      console.error('Failed to verify:', err);
      errorToast('Kesalahan jaringan. Gagal menghubungi server.');
    }
  };

  // Helper status color map
  const getStatusBadge = (status: Member['status_sensus']) => {
    switch (status) {
      case 'Disetujui':
        return <span className="bg-emerald-50 text-brand-emerald text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 w-fit"><CheckCircle2 className="w-3.5 h-3.5" /> DISETUJUI</span>;
      case 'Menunggu Verifikasi':
        return <span className="bg-amber-50 text-amber-600 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 w-fit"><AlertCircle className="w-3.5 h-3.5 animate-pulse" /> VERIFIKASI</span>;
      case 'Revisi':
        return <span className="bg-blue-50 text-blue-600 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 w-fit"><AlertTriangle className="w-3.5 h-3.5" /> REVISI</span>;
      default:
        return <span className="bg-red-50 text-red-600 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 w-fit"><XCircle className="w-3.5 h-3.5" /> DITOLAK</span>;
    }
  };

  // Statistical calculations based on unfiltered dataset
  const totalSensus = allUnfilteredMembers.length;
  const approvedCount = allUnfilteredMembers.filter(m => m.status_sensus === 'Disetujui').length;
  const pendingCount = allUnfilteredMembers.filter(m => m.status_sensus === 'Menunggu Verifikasi').length;
  const revisionCount = allUnfilteredMembers.filter(m => m.status_sensus === 'Revisi').length;
  
  const maleCount = allUnfilteredMembers.filter(m => m.gender === 'L').length;
  const femaleCount = allUnfilteredMembers.filter(m => m.gender === 'P').length;
  const malePercent = totalSensus > 0 ? Math.round((maleCount / totalSensus) * 100) : 0;
  const femalePercent = totalSensus > 0 ? Math.round((femaleCount / totalSensus) * 100) : 0;

  const hasUmkmCount = allUnfilteredMembers.filter(m => m.pekerjaan?.has_umkm).length;

  // Group Jam'iyah types
  const jamiyahWargaBiasa = allUnfilteredMembers.filter(m => m.jamiyah === 'Warga Biasa').length;
  const jamiyahPengurusRanting = allUnfilteredMembers.filter(m => m.jamiyah === 'Pengurus Ranting').length;
  const jamiyahPengurusMWC = allUnfilteredMembers.filter(m => m.jamiyah === 'Pengurus MWC').length;
  const jamiyahBanom = allUnfilteredMembers.filter(m => m.jamiyah === 'Pengurus Banom / Lembaga').length;

  // Educations
  const eduSMA = allUnfilteredMembers.filter(m => m.pendidikan?.last_education === 'SMA').length;
  const eduS1 = allUnfilteredMembers.filter(m => m.pendidikan?.last_education === 'S1').length;
  const eduSMP = allUnfilteredMembers.filter(m => m.pendidikan?.last_education === 'SMP').length;
  const eduSD = allUnfilteredMembers.filter(m => m.pendidikan?.last_education === 'SD').length;
  const eduPesantren = allUnfilteredMembers.filter(m => m.pendidikan?.pesantren_name).length;

  // RT/RW Grouping for Admin Ranting
  const rtrwMap: { [key: string]: { total: number; approved: number; pending: number } } = {};
  allUnfilteredMembers.forEach(m => {
    const rt = m.rt || '-';
    const rw = m.rw || '-';
    const key = `RT ${rt} / RW ${rw}`;
    if (!rtrwMap[key]) {
      rtrwMap[key] = { total: 0, approved: 0, pending: 0 };
    }
    rtrwMap[key].total++;
    if (m.status_sensus === 'Disetujui') rtrwMap[key].approved++;
    if (m.status_sensus === 'Menunggu Verifikasi') rtrwMap[key].pending++;
  });
  const rtrwStats = Object.entries(rtrwMap).map(([name, stats]) => ({
    name,
    ...stats
  })).sort((a, b) => b.total - a.total);

  // Ranting Grouping for Admin MWC
  const rantingMap: { [key: string]: { id: number; total: number; approved: number; pending: number } } = {};
  // Initialize with all known rantings
  rantings.forEach(r => {
    rantingMap[r.name] = { id: r.id, total: 0, approved: 0, pending: 0 };
  });
  // Distribute counts
  allUnfilteredMembers.forEach(m => {
    const rantingName = m.ranting?.name || 'Tidak Diketahui';
    if (!rantingMap[rantingName]) {
      rantingMap[rantingName] = { id: m.ranting_id || 0, total: 0, approved: 0, pending: 0 };
    }
    rantingMap[rantingName].total++;
    if (m.status_sensus === 'Disetujui') rantingMap[rantingName].approved++;
    if (m.status_sensus === 'Menunggu Verifikasi') rantingMap[rantingName].pending++;
  });
  const rantingStats = Object.entries(rantingMap).map(([name, stats]) => ({
    name,
    ...stats
  })).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-emerald-950">Sensus Anggota & Potensi</h2>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">Pengumpulan basis data warga, klasifikasi pendidikan formal/non-formal, profesi, serta pemetaan potensi SDM Nahdliyin.</p>
        </div>
        
        {/* Only Admin Ranting and Operator can register citizens */}
        {hasRole(['Super Admin', 'Operator', 'Admin Ranting']) && (
          <button
            onClick={handleNewSensusClick}
            className="bg-brand-emerald text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-emerald-800/10 hover:bg-brand-emerald-dark transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Sensus Warga Baru
          </button>
        )}
      </div>

      {/* REKAPITULASI SENSUS WARGA NU PANEL */}
      <div className="bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden transition-all">
        {/* Toggle header */}
        <button 
          onClick={() => setIsRecapOpen(!isRecapOpen)}
          className="w-full bg-slate-50/80 hover:bg-slate-50 p-4 flex items-center justify-between border-b border-slate-100 transition-colors focus:outline-none cursor-pointer"
        >
          <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
            <Users className="w-5 h-5 text-brand-emerald" />
            <span>Dashboard Rekapitulasi Sensus Warga NU</span>
            <span className="bg-emerald-100 text-brand-emerald text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ml-2">
              {user?.role === 'Admin Ranting' ? 'Sisi Ranting' : 'Sisi MWC'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
            <span>{isRecapOpen ? 'Sembunyikan' : 'Tampilkan Analisis'}</span>
            <ChevronRight className={`w-4 h-4 transition-transform ${isRecapOpen ? 'rotate-90' : 'rotate-0'}`} />
          </div>
        </button>

        {isRecapOpen && (
          <div className="p-5 space-y-6">
            {/* Summary Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Sensus */}
              <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-xl p-4 flex items-center gap-4 shadow-2xs">
                <div className="p-3 bg-emerald-500 text-white rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Total Sensus Warga</span>
                  <span className="text-xl font-extrabold text-slate-800">{totalSensus} <span className="text-xs font-semibold text-slate-400">Jiwa</span></span>
                </div>
              </div>

              {/* Terbit KTA (Disetujui) */}
              <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-4 flex items-center gap-4 shadow-2xs">
                <div className="p-3 bg-blue-500 text-white rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Disetujui / Terbit KTA</span>
                  <span className="text-xl font-extrabold text-slate-800">{approvedCount} <span className="text-xs font-semibold text-slate-400">Jiwa</span></span>
                </div>
              </div>

              {/* Menunggu Verifikasi */}
              <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-100 rounded-xl p-4 flex items-center gap-4 shadow-2xs">
                <div className="p-3 bg-amber-500 text-white rounded-xl">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Menunggu Verifikasi</span>
                  <span className="text-xl font-extrabold text-slate-800">{pendingCount} <span className="text-xs font-semibold text-slate-400">Jiwa</span></span>
                </div>
              </div>

              {/* Potensi UMKM */}
              <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-4 flex items-center gap-4 shadow-2xs">
                <div className="p-3 bg-indigo-500 text-white rounded-xl">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Sektor UMKM Nahdliyin</span>
                  <span className="text-xl font-extrabold text-slate-800">{hasUmkmCount} <span className="text-xs font-semibold text-slate-400">Unit</span></span>
                </div>
              </div>
            </div>

            {/* Sub-tabs controls */}
            <div className="border-b border-slate-100 flex gap-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setRecapSubTab('demografi')}
                className={`pb-2.5 transition-all focus:outline-none cursor-pointer ${
                  recapSubTab === 'demografi' 
                    ? 'border-b-2 border-brand-emerald text-brand-emerald' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Distribusi & Demografi
              </button>
              <button
                type="button"
                onClick={() => setRecapSubTab('ranting_rt')}
                className={`pb-2.5 transition-all focus:outline-none cursor-pointer ${
                  recapSubTab === 'ranting_rt' 
                    ? 'border-b-2 border-brand-emerald text-brand-emerald' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {user?.role === 'Admin Ranting' ? 'Rekap RT / RW Ranting' : 'Rekapitulasi Seluruh Ranting'}
              </button>
            </div>

            {/* Sub-tabs content */}
            {recapSubTab === 'demografi' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Gender Breakdown */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-3">Rasio Gender</span>
                    <div className="space-y-3.5">
                      {/* Male */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span>Laki-laki ({maleCount})</span>
                          <span>{malePercent}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${malePercent}%` }}></div>
                        </div>
                      </div>
                      {/* Female */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span>Perempuan ({femaleCount})</span>
                          <span>{femalePercent}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-pink-500 h-full rounded-full transition-all duration-500" style={{ width: `${femalePercent}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium mt-4 pt-3 border-t border-slate-200/50">
                    Proporsi sebaran sensus warga NU berdasarkan jenis kelamin.
                  </div>
                </div>

                {/* Jam'iyah & Banom Breakdown */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Status Keanggotaan</span>
                  <div className="space-y-2.5 text-xs">
                    {[
                      { label: 'Warga NU Biasa', count: jamiyahWargaBiasa },
                      { label: 'Pengurus Ranting', count: jamiyahPengurusRanting },
                      { label: 'Pengurus Banom / Lembaga', count: jamiyahBanom },
                      { label: 'Pengurus MWC', count: jamiyahPengurusMWC },
                    ].map((item, idx) => {
                      const pct = totalSensus > 0 ? Math.round((item.count / totalSensus) * 100) : 0;
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between font-semibold text-slate-600">
                            <span>{item.label}</span>
                            <span className="font-bold text-slate-700">{item.count} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Education formal / non-formal */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Sektor Pendidikan</span>
                  <div className="space-y-2.5 text-xs">
                    {[
                      { label: 'Pernah / Sedang di Pesantren', count: eduPesantren },
                      { label: 'Pendidikan Tinggi (S1/D3)', count: eduS1 },
                      { label: 'Pendidikan Menengah (SMA/SMK)', count: eduSMA },
                      { label: 'Pendidikan Dasar (SMP/SD)', count: eduSMP + eduSD },
                    ].map((item, idx) => {
                      const pct = totalSensus > 0 ? Math.round((item.count / totalSensus) * 100) : 0;
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between font-semibold text-slate-600">
                            <span>{item.label}</span>
                            <span className="font-bold text-slate-700">{item.count} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {/* Ranting / RT/RW list */}
                {user?.role === 'Admin Ranting' ? (
                  <div className="border border-slate-150 rounded-xl overflow-hidden bg-white max-h-60 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400">
                          <th className="py-2.5 px-4">Wilayah RT / RW</th>
                          <th className="py-2.5 px-4 text-center">Total Sensus</th>
                          <th className="py-2.5 px-4 text-center">Disetujui (KTA)</th>
                          <th className="py-2.5 px-4 text-center">Menunggu Verifikasi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rtrwStats.length > 0 ? (
                          rtrwStats.map((stat, idx) => (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                              <td className="py-2 px-4 font-bold text-slate-700">{stat.name}</td>
                              <td className="py-2 px-4 text-center font-bold text-slate-800">{stat.total} Jiwa</td>
                              <td className="py-2 px-4 text-center">
                                <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md text-[10px]">
                                  {stat.approved} Jiwa
                                </span>
                              </td>
                              <td className="py-2 px-4 text-center">
                                <span className="bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-md text-[10px]">
                                  {stat.pending} Jiwa
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-slate-400 italic">Belum ada warga yang disensus di ranting ini.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="border border-slate-150 rounded-xl overflow-hidden bg-white max-h-72 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400">
                          <th className="py-2.5 px-4">Nama Ranting</th>
                          <th className="py-2.5 px-4 text-center">Total Sensus</th>
                          <th className="py-2.5 px-4 text-center">Disetujui (KTA)</th>
                          <th className="py-2.5 px-4 text-center">Menunggu Verifikasi</th>
                          <th className="py-2.5 px-4 text-center">Kontribusi MWC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rantingStats.map((stat, idx) => {
                          const contr = totalSensus > 0 ? Math.round((stat.total / totalSensus) * 100) : 0;
                          return (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                              <td className="py-2 px-4 font-bold text-slate-700">{stat.name}</td>
                              <td className="py-2 px-4 text-center font-bold text-slate-800">{stat.total} Jiwa</td>
                              <td className="py-2 px-4 text-center">
                                <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md text-[10px]">
                                  {stat.approved} Jiwa
                                </span>
                              </td>
                              <td className="py-2 px-4 text-center">
                                <span className="bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-md text-[10px]">
                                  {stat.pending} Jiwa
                                </span>
                              </td>
                              <td className="py-2 px-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden shrink-0">
                                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${contr}%` }}></div>
                                  </div>
                                  <span className="font-extrabold text-[10px] text-slate-500 w-6 text-right">{contr}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FILTERS TOOLBAR */}
      <div className="bg-white p-4 border border-slate-150 rounded-2xl shadow-sm flex flex-col md:flex-row gap-3">
        {/* Text Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari NIK, KK, Nama atau Telepon warga..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-brand-emerald focus:ring-1 focus:ring-emerald-500/10 rounded-xl py-2 pl-10 pr-4 text-xs font-medium outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Ranting filter (disabled if user is Admin Ranting) */}
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterRanting}
              disabled={user?.role === 'Admin Ranting'}
              onChange={(e) => setFilterRanting(e.target.value)}
              className="bg-transparent border-none outline-none font-medium text-slate-600"
            >
              <option value="">Semua Ranting (20)</option>
              {rantings.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent border-none outline-none font-medium text-slate-600"
            >
              <option value="">Semua Status Sensus</option>
              <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
              <option value="Disetujui">Disetujui (KTA Terbit)</option>
              <option value="Revisi">Perlu Revisi</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>
        </div>
      </div>

      {/* SENSUS TABLE CARDS */}
      <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Memuat basis data warga, harap tunggu...</div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">Tidak ada warga NU terdaftar yang cocok dengan pencarian Anda.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-mono border-b border-slate-100 uppercase tracking-wider text-[10px]">
                  <th className="py-4 px-6 font-semibold">Profil Warga (3NF)</th>
                  <th className="py-4 px-6 font-semibold">Identitas NIK / KK</th>
                  <th className="py-4 px-6 font-semibold">Ranting & Banom</th>
                  <th className="py-4 px-6 font-semibold">Status Berkas</th>
                  <th className="py-4 px-6 font-semibold">No. KTA (Sensus)</th>
                  <th className="py-4 px-6 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-sm">{m.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">{m.gender === 'L' ? 'Laki-Laki' : 'Perempuan'} &bull; HP: {m.phone || '-'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-600">
                      <div className="flex flex-col">
                        <span>NIK: {m.nik}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">KK: {m.no_kk}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col text-slate-700">
                        <span>{m.ranting_name}</span>
                        {m.banom_name && (
                          <span className="text-[10px] text-brand-emerald-dark font-semibold mt-0.5">{m.banom_name}</span>
                        )}
                        {m.mwc_posisi && (
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[10px] text-amber-700 font-extrabold" title={`${m.mwc_posisi}: ${m.mwc_posisi_nama} (${m.mwc_jabatan})`}>
                              {m.mwc_posisi}: {m.mwc_jabatan}
                            </span>
                            {m.phone && (
                              <a
                                href={`https://wa.me/${m.phone.replace(/\D/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(
                                  `Assalamu'alaikum Wr. Wb. Yth. Bpk/Ibu ${m.name} (${m.mwc_jabatan || 'Pengurus MWC NU Karangpawitan'})...\n`
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-extrabold border border-emerald-200 transition-colors shrink-0"
                                title={`Kirim Pengumuman WA ke ${m.name}`}
                              >
                                <MessageCircle className="w-2.5 h-2.5 text-emerald-600" />
                                <span>Kirim WA</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(m.status_sensus)}
                    </td>
                    <td className="py-4 px-6">
                      {m.kta_number ? (
                        <span className="font-mono font-bold text-brand-emerald">{m.kta_number}</span>
                      ) : (
                        <span className="text-slate-400 italic font-normal text-[10px]">Belum Diterbitkan</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewingMember(m)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-brand-emerald transition-all inline-flex items-center gap-1 cursor-pointer"
                          title="Lihat Profil Detail"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Detail</span>
                        </button>
                        {hasRole(['Super Admin', 'Operator']) && (
                          <>
                            <button
                              onClick={() => handleEditClick(m)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-all inline-flex items-center gap-1 cursor-pointer"
                              title="Edit Data Warga"
                            >
                              <Edit2 className="w-4 h-4" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteClick(m.id, m.name)}
                              className="p-1.5 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-600 transition-all inline-flex items-center gap-1 cursor-pointer"
                              title="Hapus Data Warga"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Hapus</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL VIEW MODAL */}
      {viewingMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-brand-emerald rounded-xl">
                  <Landmark className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-lg text-slate-800">Detail Sensus & Potensi Warga</h4>
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">ID Warga: #{viewingMember.id} &bull; Register: {viewingMember.year_joined}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setViewingMember(null);
                  setIsVerifying(false);
                }}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-8">
              
              {/* Virtual KTA Card Section for Approved Members */}
              {viewingMember.status_sensus === 'Disetujui' && viewingMember.kta_number && (
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl border border-slate-200/60 shadow-inner">
                  {/* Style tag for print handling */}
                  <style dangerouslySetInnerHTML={{ __html: `
                    @media print {
                      /* Hide everything except the printable KTA area */
                      body > *:not(#print-kta-wrapper) {
                        display: none !important;
                      }
                      #print-kta-wrapper {
                        display: block !important;
                        position: fixed !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100vw !important;
                        height: 100vh !important;
                        z-index: 99999 !important;
                        background: white !important;
                        padding: 2cm !important;
                      }
                      .print-card-container {
                        display: flex !important;
                        flex-direction: row !important;
                        gap: 20px !important;
                        justify-content: center !important;
                        align-items: center !important;
                        flex-wrap: wrap !important;
                      }
                      .print-card {
                        width: 85.6mm !important;
                        height: 53.98mm !important;
                        border-radius: 4.7mm !important;
                        box-shadow: none !important;
                        border: 1px solid rgba(0,0,0,0.1) !important;
                        page-break-inside: avoid !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        position: relative !important;
                        overflow: hidden !important;
                        background-image: linear-gradient(to bottom, #064e3b, #022c22) !important;
                        color: white !important;
                      }
                      .print-card-back {
                        background-image: linear-gradient(to bottom, #022c22, #064e3b) !important;
                      }
                      @page {
                        size: landscape;
                        margin: 0;
                      }
                    }
                  `}} />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-brand-gold animate-pulse" />
                      <h5 className="text-xs font-bold font-mono text-slate-600 uppercase tracking-wider">Simulasi KTA Virtual Terbit (3NF)</h5>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="bg-brand-emerald hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 hover:shadow"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Cetak KTA Anggota</span>
                    </button>
                  </div>
                  
                  {/* Two Sided Card Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    
                    {/* Front of KTA */}
                    <div className="bg-gradient-to-b from-brand-emerald-dark to-emerald-950 text-white rounded-xl p-5 shadow-lg border border-yellow-500/20 relative overflow-hidden aspect-[1.58/1]">
                      {/* Logo watermark */}
                      <div className="absolute right-2 bottom-2 opacity-[0.05] pointer-events-none">
                        <img 
                          src="/uploads/nahdlatul_ulama_logo.svg" 
                          alt="NU Watermark" 
                          className="w-24 h-24 object-contain grayscale brightness-200"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex items-center gap-3 border-b border-white/10 pb-2 mb-3">
                        <div className="bg-white p-1 rounded-lg w-10 h-10 flex items-center justify-center shrink-0">
                          <img 
                            src="/uploads/nahdlatul_ulama_logo.svg" 
                            alt="Logo NU" 
                            className="w-8 h-8 object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <h6 className="font-display font-bold text-xs tracking-tight">KARTU TANDA ANGGOTA NU</h6>
                          <p className="text-[7px] font-mono tracking-wider uppercase text-emerald-300">MWC NU Karangpawitan Garut</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 justify-between items-stretch h-[calc(100%-2.5rem)] relative z-10">
                        {/* Left Side: Info */}
                        <div className="flex-1 space-y-1 text-left min-w-0">
                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <p className="text-[5px] uppercase tracking-wider text-emerald-300 font-bold">Nomor KTA Sensus</p>
                              <p className="font-mono text-[10px] font-bold text-yellow-300 leading-none">{viewingMember.kta_number}</p>
                            </div>
                            <div>
                              <p className="text-[5px] uppercase tracking-wider text-emerald-300 font-bold">NIK KTP</p>
                              <p className="font-mono text-[8px] font-bold text-slate-200 leading-none">{viewingMember.nik}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-[5px] uppercase tracking-wider text-emerald-300 font-bold">Nama Lengkap</p>
                            <p className="font-bold text-[10px] uppercase tracking-tight truncate text-white leading-none">{viewingMember.name}</p>
                          </div>
                          <div>
                            <p className="text-[5px] uppercase tracking-wider text-emerald-300 font-bold">Tempat & Tgl Lahir</p>
                            <p className="font-semibold text-[8px] text-slate-100 truncate leading-none">
                              {viewingMember.place_of_birth || '-'}, {viewingMember.date_of_birth || '-'}
                            </p>
                          </div>
                          <div className="grid grid-cols-3 gap-1 pt-0.5">
                            <div>
                              <p className="text-[5px] uppercase tracking-wider text-emerald-300 font-bold">Ranting</p>
                              <p className="font-semibold text-[8px] text-slate-100 truncate leading-none">{viewingMember.ranting_name}</p>
                            </div>
                            <div>
                              <p className="text-[5px] uppercase tracking-wider text-emerald-300 font-bold">Banom/Lembaga</p>
                              <p className="font-semibold text-[8px] text-slate-100 truncate leading-none">
                                {viewingMember.banom_name || viewingMember.mwc_posisi_nama || '-'}
                              </p>
                            </div>
                            <div>
                              <p className="text-[5px] uppercase tracking-wider text-emerald-300 font-bold">Jabatan</p>
                              <p className="font-semibold text-[8px] text-slate-100 truncate leading-none">
                                {viewingMember.mwc_jabatan || 'Anggota'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Right Side: Passport Photo */}
                        <div className="w-14 h-18 sm:w-16 sm:h-20 bg-white/10 rounded-lg border border-yellow-500/30 overflow-hidden flex flex-col items-center justify-center flex-shrink-0 self-end mb-1">
                          {viewingMember.photo_url ? (
                            <img
                              src={viewingMember.photo_url}
                              alt={viewingMember.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-[7px] text-emerald-200/70 text-center flex flex-col items-center p-1">
                              <User className="w-5 h-5 text-emerald-400/40 mb-1" />
                              <span>FOTO</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Back of KTA */}
                    <div className="bg-gradient-to-b from-emerald-950 to-brand-emerald-dark text-white rounded-xl p-5 shadow-lg border border-yellow-500/20 flex flex-col justify-between aspect-[1.58/1]">
                      <div className="text-[7px] leading-relaxed text-emerald-200/95 font-medium">
                        <p className="font-bold text-[8px] text-yellow-400 mb-1 border-b border-white/10 pb-1">KETENTUAN KEANGGOTAAN</p>
                        <ul className="list-disc list-inside space-y-0.5">
                          <li>KTA ini sah dalam basis data Sensus Warga MWC NU Karangpawitan.</li>
                          <li>Pemegang kartu wajib taat pada AD/ART Nahdlatul Ulama.</li>
                          <li>Kartu ini memuat potensi SDM & keahlian tersensus.</li>
                        </ul>
                      </div>
                      
                      <div className="flex items-end justify-between border-t border-white/10 pt-2">
                        <div className="text-left font-mono">
                          <p className="text-[5px] text-emerald-300 uppercase">Validasi Keamanan</p>
                          <p className="text-[6px] text-slate-300">SIM-MWCNU-OK-2026</p>
                        </div>
                        <div className="bg-white/10 p-1 rounded font-mono text-[8px] font-bold tracking-widest text-center text-yellow-400 border border-white/5">
                          320512-OK
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* PRINT WINDOW BACKUP (Perfect 1:1 dimensions for printer, hidden on screen) */}
                  {createPortal(
                    <div id="print-kta-wrapper" className="hidden">
                      <div className="text-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">Cetak Kartu Tanda Anggota (KTA) Nahdlatul Ulama</h2>
                        <p className="text-xs text-slate-500">SIM Sensus MWC NU Karangpawitan, Garut</p>
                      </div>
                      <div className="print-card-container">
                        {/* FRONT CARD */}
                        <div className="print-card p-4 flex flex-col justify-between">
                          {/* Watermark */}
                          <div className="absolute right-2 bottom-2 opacity-[0.06] pointer-events-none">
                            <img 
                              src="/uploads/nahdlatul_ulama_logo.svg" 
                              alt="NU Watermark" 
                              className="w-16 h-16 object-contain grayscale brightness-200"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          {/* Header */}
                          <div className="flex items-center gap-2 border-b border-white/15 pb-1.5">
                            <div className="bg-white p-0.5 rounded w-7 h-7 flex items-center justify-center shrink-0">
                              <img 
                                src="/uploads/nahdlatul_ulama_logo.svg" 
                                alt="Logo NU" 
                                className="w-6 h-6 object-contain"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="text-left">
                              <h6 className="font-sans font-extrabold text-[8px] leading-tight text-white uppercase tracking-tight">Kartu Tanda Anggota NU</h6>
                              <p className="text-[5px] font-mono tracking-wider uppercase text-emerald-300 leading-none">MWC NU Karangpawitan Garut</p>
                            </div>
                          </div>
                          {/* Body content */}
                          <div className="flex gap-2 justify-between items-stretch h-[calc(100%-2.2rem)] relative z-10 pt-1">
                            <div className="flex-1 space-y-0.5 text-left min-w-0">
                              <div className="grid grid-cols-2 gap-1">
                                <div>
                                  <p className="text-[4px] uppercase text-emerald-300 font-bold leading-none">Nomor KTA Sensus</p>
                                  <p className="font-mono text-[8px] font-extrabold text-yellow-300 leading-none">{viewingMember.kta_number}</p>
                                </div>
                                <div>
                                  <p className="text-[4px] uppercase text-emerald-300 font-bold leading-none">NIK KTP</p>
                                  <p className="font-mono text-[6.5px] text-slate-200 leading-none">{viewingMember.nik}</p>
                                </div>
                              </div>
                              <div>
                                <p className="text-[4px] uppercase text-emerald-300 font-bold leading-none">Nama Lengkap</p>
                                <p className="font-extrabold text-[8px] uppercase tracking-tight truncate text-white leading-none">{viewingMember.name}</p>
                              </div>
                              <div>
                                <p className="text-[4px] uppercase text-emerald-300 font-bold leading-none">Tempat & Tgl Lahir</p>
                                <p className="font-semibold text-[6.5px] text-slate-100 truncate leading-none">
                                  {viewingMember.place_of_birth || '-'}, {viewingMember.date_of_birth || '-'}
                                </p>
                              </div>
                              <div className="grid grid-cols-3 gap-1 pt-0.5">
                                <div>
                                  <p className="text-[4px] uppercase text-emerald-300 font-bold leading-none">Ranting</p>
                                  <p className="font-semibold text-[6.5px] text-slate-100 truncate leading-none">{viewingMember.ranting_name}</p>
                                </div>
                                <div>
                                  <p className="text-[4px] uppercase text-emerald-300 font-bold leading-none">Banom/Lembaga</p>
                                  <p className="font-semibold text-[6.5px] text-slate-100 truncate leading-none">
                                    {viewingMember.banom_name || viewingMember.mwc_posisi_nama || '-'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[4px] uppercase text-emerald-300 font-bold leading-none">Jabatan</p>
                                  <p className="font-semibold text-[6.5px] text-slate-100 truncate leading-none">
                                    {viewingMember.mwc_jabatan || 'Anggota'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            {/* Passport photo */}
                            <div className="w-10 h-13 bg-white/10 rounded-md border border-yellow-500/30 overflow-hidden flex flex-col items-center justify-center shrink-0 self-end mb-0.5">
                              {viewingMember.photo_url ? (
                                <img
                                  src={viewingMember.photo_url}
                                  alt={viewingMember.name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="text-[5px] text-emerald-200/70 text-center flex flex-col items-center p-0.5">
                                  <User className="w-3 h-3 text-emerald-400/40 mb-0.5" />
                                  <span>FOTO</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* BACK CARD */}
                        <div className="print-card print-card-back p-4 flex flex-col justify-between">
                          <div className="text-[5.5px] leading-relaxed text-emerald-100 font-medium text-left">
                            <p className="font-extrabold text-[7px] text-yellow-400 mb-1 border-b border-white/10 pb-1 uppercase tracking-wider">Ketentuan Keanggotaan</p>
                            <ul className="list-disc list-inside space-y-0.5">
                              <li>KTA ini sah dalam basis data Sensus Warga MWC NU Karangpawitan.</li>
                              <li>Pemegang kartu wajib taat pada AD/ART Nahdlatul Ulama.</li>
                              <li>Kartu ini memuat potensi SDM & keahlian tersensus.</li>
                            </ul>
                          </div>
                          
                          <div className="flex items-end justify-between border-t border-white/10 pt-1.5">
                            <div className="text-left font-mono">
                              <p className="text-[4px] text-emerald-300 uppercase leading-none">Validasi Keamanan</p>
                              <p className="text-[5px] text-slate-300 leading-none">SIM-MWCNU-OK-2026</p>
                            </div>
                            <div className="bg-white/10 px-1 py-0.5 rounded font-mono text-[6px] font-extrabold tracking-widest text-center text-yellow-400 border border-white/5 leading-none">
                              320512-OK
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>,
                    document.body
                  )}

                </div>
              )}

              {/* Grid 3NF Data details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. DATA DIRI CARD */}
                <div className="bg-white p-5 border border-slate-150 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Award className="w-5 h-5 text-brand-emerald" />
                    <h5 className="font-bold text-slate-800 text-sm">Informasi Kependudukan</h5>
                  </div>
                  {viewingMember.photo_url && (
                    <div className="flex justify-center pb-2">
                      <div className="w-20 h-24 rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                        <img
                          src={viewingMember.photo_url}
                          alt="Pas Foto Warga"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-3 text-xs">
                    <div>
                      <p className="text-slate-400 font-mono text-[10px]">NAMA LENGKAP</p>
                      <p className="font-bold text-slate-800 mt-0.5">{viewingMember.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-mono text-[10px]">TEMPAT & TANGGAL LAHIR</p>
                      <p className="font-semibold text-slate-700 mt-0.5">
                        {viewingMember.place_of_birth || '-'}, {viewingMember.date_of_birth ? new Date(viewingMember.date_of_birth).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-mono text-[10px]">NIK KTP (16 DIGIT)</p>
                      <p className="font-mono font-semibold text-slate-700 mt-0.5">{viewingMember.nik}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-mono text-[10px]">NO. KARTU KELUARGA (KK)</p>
                      <p className="font-mono font-semibold text-slate-700 mt-0.5">{viewingMember.no_kk}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-mono text-[10px]">ALAMAT DOMISILI</p>
                      <p className="text-slate-700 mt-0.5">{viewingMember.address || '-'} RT {viewingMember.rt || '00'}/RW {viewingMember.rw || '00'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-mono text-[10px]">AFILIASI STRUKTUR</p>
                      <p className="font-bold text-slate-700 mt-0.5">{viewingMember.ranting_name}</p>
                      {viewingMember.banom_name && (
                        <p className="text-[10px] text-brand-emerald font-mono font-bold mt-0.5">{viewingMember.banom_name}</p>
                      )}
                    </div>
                    {viewingMember.mwc_posisi && (
                      <div className="bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-xl">
                        <p className="text-brand-emerald-dark font-mono text-[9px] font-bold">POSISI DI MWC</p>
                        <p className="font-extrabold text-slate-800 text-xs mt-0.5">
                          {viewingMember.mwc_posisi}: {viewingMember.mwc_posisi_nama || '-'}
                        </p>
                        {viewingMember.mwc_jabatan && (
                          <p className="font-medium text-slate-600 text-[11px] mt-0.5">
                            Jabatan: <span className="font-bold text-slate-800">{viewingMember.mwc_jabatan}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. PENDIDIKAN CARD */}
                <div className="bg-white p-5 border border-slate-150 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <GraduationCap className="w-5 h-5 text-brand-emerald" />
                    <h5 className="font-bold text-slate-800 text-sm">Riwayat Pendidikan & Pesantren</h5>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div>
                      <p className="text-slate-400 font-mono text-[10px]">PENDIDIKAN TERAKHIR</p>
                      <p className="font-bold text-slate-800 mt-0.5">{viewingMember.pendidikan?.last_education || 'Tidak Ada Data'}</p>
                    </div>
                    {viewingMember.pendidikan?.school_name && (
                      <div>
                        <p className="text-slate-400 font-mono text-[10px]">NAMA SEKOLAH / UNIVERSITAS</p>
                        <p className="font-semibold text-slate-700 mt-0.5">{viewingMember.pendidikan.school_name} {viewingMember.pendidikan.major ? `(${viewingMember.pendidikan.major})` : ''}</p>
                      </div>
                    )}
                    {viewingMember.pendidikan?.pesantren_name && (
                      <div>
                        <p className="text-slate-400 font-mono text-[10px]">RIWAYAT PESANTREN</p>
                        <p className="font-semibold text-slate-700 mt-0.5">{viewingMember.pendidikan.pesantren_name} {viewingMember.pendidikan.pesantren_duration_years ? `(${viewingMember.pendidikan.pesantren_duration_years} Tahun)` : ''}</p>
                      </div>
                    )}
                    {viewingMember.pendidikan?.skills && (
                      <div>
                        <p className="text-slate-400 font-mono text-[10px]">KEAHLIAN / SKILL</p>
                        <p className="text-slate-700 mt-0.5">{viewingMember.pendidikan.skills}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. PEKERJAAN & POTENSI CARD */}
                <div className="bg-white p-5 border border-slate-150 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Briefcase className="w-5 h-5 text-brand-emerald" />
                    <h5 className="font-bold text-slate-800 text-sm">Ekonomi, Profesi & Potensi</h5>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div>
                      <p className="text-slate-400 font-mono text-[10px]">PEKERJAAN / PROFESI</p>
                      <p className="font-bold text-slate-800 mt-0.5">{viewingMember.pekerjaan?.profession || 'Tidak Bekerja'}</p>
                    </div>
                    {viewingMember.pekerjaan?.company_name && (
                      <div>
                        <p className="text-slate-400 font-mono text-[10px]">INSTANSI / KANTOR</p>
                        <p className="font-semibold text-slate-700 mt-0.5">{viewingMember.pekerjaan.company_name} {viewingMember.pekerjaan.position ? `(${viewingMember.pekerjaan.position})` : ''}</p>
                      </div>
                    )}
                    {viewingMember.pekerjaan?.has_umkm && (
                      <div>
                        <p className="text-slate-400 font-mono text-[10px]">KEPEMILIKAN UMKM</p>
                        <p className="font-bold text-amber-700 mt-0.5">{viewingMember.pekerjaan.umkm_name} {viewingMember.pekerjaan.umkm_sector ? `(Sektor: ${viewingMember.pekerjaan.umkm_sector})` : ''}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-slate-400 font-mono text-[10px] mb-1.5">PEMETAAN KLASIFIKASI POTENSI</p>
                      {viewingMember.potensi && viewingMember.potensi.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {viewingMember.potensi.map(p => (
                            <span key={p.id} className="bg-emerald-50 text-brand-emerald text-[9px] font-bold px-2 py-0.5 rounded border border-emerald-100/40">
                              {p.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 italic">Belum diklasifikasikan</p>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Rejection / Verificator notes if exists */}
              {viewingMember.notes && (
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl flex gap-3 text-slate-600 text-xs">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="font-bold uppercase tracking-wider text-[10px]">Catatan Verifikator:</p>
                    <p className="mt-0.5 font-medium">{viewingMember.notes}</p>
                  </div>
                </div>
              )}

              {/* WORKFLOW VERIFICATION DRAWER (For authorized users checking waiting sensuses) */}
              {['Super Admin', 'Ketua MWC', 'Sekretaris', 'Operator'].includes(user?.role || '') && (
                <div className="border-t border-slate-100 pt-6">
                  {!isVerifying ? (
                    <button
                      onClick={() => setIsVerifying(true)}
                      className="bg-brand-emerald text-white text-xs font-bold py-2.5 px-5 rounded-xl cursor-pointer hover:bg-brand-emerald-dark transition-all flex items-center gap-2 shadow-md shadow-emerald-800/10"
                    >
                      <UserCheck className="w-4 h-4" />
                      Proses Verifikasi Sensus
                    </button>
                  ) : (
                    <form onSubmit={handleVerifySubmit} className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-4 max-w-xl">
                      <h6 className="font-bold text-xs font-mono uppercase text-slate-500 tracking-wider">Formulir Keputusan Verifikasi</h6>
                      
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                          <input
                            type="radio"
                            name="v_status"
                            checked={verifyStatus === 'Disetujui'}
                            onChange={() => setVerifyStatus('Disetujui')}
                            className="text-brand-emerald focus:ring-brand-emerald"
                          />
                          <span>Setujui Berkas & Terbitkan KTA</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                          <input
                            type="radio"
                            name="v_status"
                            checked={verifyStatus === 'Revisi'}
                            onChange={() => setVerifyStatus('Revisi')}
                            className="text-brand-emerald focus:ring-brand-emerald"
                          />
                          <span>Butuh Revisi Berkas</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                          <input
                            type="radio"
                            name="v_status"
                            checked={verifyStatus === 'Ditolak'}
                            onChange={() => setVerifyStatus('Ditolak')}
                            className="text-brand-emerald focus:ring-brand-emerald"
                          />
                          <span>Tolak Pendaftaran</span>
                        </label>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-500 font-bold uppercase tracking-wider mb-1.5">Catatan/Alasan Pendukung</label>
                        <textarea
                          placeholder="Contoh: Berkas disetujui, NIK cocok. Atau: Mohon upload KK ulang karena buram..."
                          value={verifyNotes}
                          onChange={(e) => setVerifyNotes(e.target.value)}
                          className="w-full bg-white border border-slate-200 focus:border-brand-emerald focus:ring-1 focus:ring-emerald-500/10 rounded-xl p-3 text-xs font-medium outline-none transition-all placeholder:text-slate-400"
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="bg-brand-emerald text-white font-bold py-2 px-4 rounded-xl text-xs hover:bg-brand-emerald-dark transition-all cursor-pointer"
                        >
                          Simpan Keputusan
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsVerifying(false)}
                          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-2 px-4 rounded-xl text-xs transition-all cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* SENSUS REGISTER MULTI-STEP MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-emerald text-white rounded-xl">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-lg text-emerald-950">
                    {editingId ? 'Formulir Edit Data Sensus Warga' : 'Formulir Sensus Warga NU'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {editingId ? 'Pembaruan data warga berbasis normalisasi database 3NF.' : 'Pendaftaran mandiri data warga berbasis normalisasi database 3NF.'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB SELECTOR */}
            <div className="bg-slate-100/60 p-1.5 mx-6 mt-4 rounded-xl grid grid-cols-4 gap-1 text-[11px] font-bold font-mono tracking-wider uppercase text-center">
              <button
                onClick={() => setActiveTab('diri')}
                className={`py-2 px-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'diri' ? 'bg-white text-brand-emerald shadow-sm' : 'text-slate-400'}`}
              >
                1. Data Diri
              </button>
              <button
                onClick={() => setActiveTab('pendidikan')}
                className={`py-2 px-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'pendidikan' ? 'bg-white text-brand-emerald shadow-sm' : 'text-slate-400'}`}
              >
                2. Pendidikan
              </button>
              <button
                onClick={() => setActiveTab('pekerjaan')}
                className={`py-2 px-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'pekerjaan' ? 'bg-white text-brand-emerald shadow-sm' : 'text-slate-400'}`}
              >
                3. Ekonomi
              </button>
              <button
                onClick={() => setActiveTab('potensi')}
                className={`py-2 px-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'potensi' ? 'bg-white text-brand-emerald shadow-sm' : 'text-slate-400'}`}
              >
                4. Potensi
              </button>
            </div>

            {/* Form submission */}
            <form onSubmit={handleAddSubmit} className="p-6 space-y-6 flex-grow flex flex-col justify-between">
              
              {formError && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex gap-3 text-red-700 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p>{formError}</p>
                </div>
              )}

              {formSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex gap-3 text-brand-emerald text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <p>{formSuccess}</p>
                </div>
              )}

              {/* STEP 1: GENERAL PERSONAL DATA */}
              {activeTab === 'diri' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">NIK KTP (16 Digit)*</label>
                    <input
                      type="text"
                      maxLength={16}
                      required
                      placeholder="320512..."
                      value={formData.nik}
                      onChange={(e) => setFormData(prev => ({ ...prev, nik: e.target.value.replace(/\D/g, '') }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-brand-emerald font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">NO. KARTU KELUARGA (KK)*</label>
                    <input
                      type="text"
                      maxLength={16}
                      required
                      placeholder="320512..."
                      value={formData.no_kk}
                      onChange={(e) => setFormData(prev => ({ ...prev, no_kk: e.target.value.replace(/\D/g, '') }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-brand-emerald font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-500 font-bold mb-1">NAMA LENGKAP WARGA (Sesuai KTP)*</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: H. Endang Mukhtar"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-brand-emerald uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">JENIS KELAMIN*</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as any }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-brand-emerald"
                    >
                      <option value="L">LAKI-LAKI (IKHWAN)</option>
                      <option value="P">PEREMPUAN (AKHWAT)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">RANTING DOMISILI*</label>
                    <select
                      required
                      value={formData.ranting_id}
                      disabled={user?.role === 'Admin Ranting'}
                      onChange={(e) => setFormData(prev => ({ ...prev, ranting_id: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-brand-emerald"
                    >
                      <option value="">Pilih Ranting Kelurahan/Desa</option>
                      {rantings.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">TEMPAT LAHIR</label>
                    <input
                      type="text"
                      placeholder="Contoh: Garut"
                      value={formData.place_of_birth}
                      onChange={(e) => setFormData(prev => ({ ...prev, place_of_birth: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-brand-emerald"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">TANGGAL LAHIR</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pr-10 outline-none focus:border-brand-emerald font-mono uppercase"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2 border border-dashed border-slate-200 p-4 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-16 h-20 bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col items-center justify-center flex-shrink-0 relative shadow-sm">
                      {formData.photo_url ? (
                        <img
                          src={formData.photo_url}
                          alt="Pas Foto Warga"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-[8px] text-slate-400 text-center flex flex-col items-center p-1">
                          <User className="w-6 h-6 text-slate-300 mb-1" />
                          <span>PAS FOTO</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="block text-slate-500 font-bold text-xs uppercase tracking-wider">Unggah Pas Foto KTA</label>
                      <p className="text-[10px] text-slate-400">Gunakan foto formal berlatar belakang polos (merah/biru) untuk keperluan pencetakan KTA NU virtual.</p>
                      <div className="flex items-center gap-3 pt-1.5">
                        <label className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-bold py-1.5 px-3 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm">
                          <Upload className="w-3.5 h-3.5 text-slate-400" />
                          <span>Pilih Foto</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 1024 * 1024 * 2) {
                                  alert('Gagal: Ukuran pas foto terlalu besar. Maksimal 2MB.');
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setFormData(prev => ({ ...prev, photo_url: reader.result as string }));
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                        {formData.photo_url && (
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, photo_url: '' }))}
                            className="text-[11px] font-bold text-red-600 hover:text-red-700 cursor-pointer"
                          >
                            Hapus Foto
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-500 font-bold mb-1">ALAMAT JALAN / KP / RT / RW</label>
                    <div className="grid grid-cols-4 gap-2">
                      <input
                        type="text"
                        placeholder="Nama Kampung / Jalan..."
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        className="col-span-2 w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-brand-emerald"
                      />
                      <input
                        type="text"
                        placeholder="RT"
                        maxLength={3}
                        value={formData.rt}
                        onChange={(e) => setFormData(prev => ({ ...prev, rt: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-brand-emerald font-mono text-center"
                      />
                      <input
                        type="text"
                        placeholder="RW"
                        maxLength={3}
                        value={formData.rw}
                        onChange={(e) => setFormData(prev => ({ ...prev, rw: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-brand-emerald font-mono text-center"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">NOMOR HP / WHATSAPP</label>
                    <input
                      type="text"
                      placeholder="08123456..."
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-brand-emerald font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">ALAMAT EMAIL (Jika Ada)</label>
                    <input
                      type="email"
                      placeholder="contoh@domain.com"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-brand-emerald"
                    />
                  </div>
                  <div className="sm:col-span-2 border-t border-slate-100 pt-4 mt-2">
                    <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 text-brand-emerald">
                      <Award className="w-4 h-4" />
                      <span>Posisi Kepengurusan MWC (Opsional)</span>
                    </h5>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">POSISI DI MWC</label>
                    <select
                      value={formData.mwc_posisi}
                      onChange={(e) => setFormData(prev => ({ ...prev, mwc_posisi: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-brand-emerald"
                    >
                      <option value="">-- Bukan Pengurus MWC --</option>
                      <option value="Lembaga">Lembaga MWC</option>
                      <option value="Banom">Banom MWC</option>
                      <option value="Ranting">Ranting MWC</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">NAMA LEMBAGA / BANOM / RANTING</label>
                    <input
                      type="text"
                      disabled={!formData.mwc_posisi}
                      placeholder={formData.mwc_posisi ? `Contoh: LP Ma'arif, GP Ansor, dsb` : "Pilih Posisi di MWC terlebih dahulu"}
                      value={formData.mwc_posisi_nama}
                      onChange={(e) => setFormData(prev => ({ ...prev, mwc_posisi_nama: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-brand-emerald disabled:opacity-50"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-500 font-bold mb-1">JABATAN KEPENGURUSAN</label>
                    <input
                      type="text"
                      disabled={!formData.mwc_posisi}
                      placeholder={formData.mwc_posisi ? `Contoh: Ketua, Sekretaris, Bendahara, Anggota, dsb` : "Pilih Posisi di MWC terlebih dahulu"}
                      value={formData.mwc_jabatan}
                      onChange={(e) => setFormData(prev => ({ ...prev, mwc_jabatan: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-brand-emerald disabled:opacity-50"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: EDUCATION (1:1 RELATION) */}
              {activeTab === 'pendidikan' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">PENDIDIKAN TERAKHIR</label>
                    <select
                      value={formData.last_education}
                      onChange={(e) => setFormData(prev => ({ ...prev, last_education: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-brand-emerald"
                    >
                      <option value="SD">SD / MI</option>
                      <option value="SMP">SMP / MTS</option>
                      <option value="SMA">SMA / MA / SMK</option>
                      <option value="D3">DIPLOMA (D3)</option>
                      <option value="S1">SARJANA (S1)</option>
                      <option value="S2">MAGISTER (S2)</option>
                      <option value="S3">DOKTOR (S3)</option>
                      <option value="Pesantren">HANYA PESANTREN (NON-FORMAL)</option>
                      <option value="Lainnya">LAINNYA</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">NAMA SEKOLAH / UNIVERSITAS TERAKHIR</label>
                    <input
                      type="text"
                      placeholder="Sebutkan nama lembaga..."
                      value={formData.school_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, school_name: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-brand-emerald"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">NAMA PONDOK PESANTREN (Jika Pernah)</label>
                    <input
                      type="text"
                      placeholder="Pondok Pesantren Al-Falah, dll."
                      value={formData.pesantren_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, pesantren_name: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-brand-emerald"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">LAMA NYANTRI (Dalam Hitungan Tahun)</label>
                    <input
                      type="number"
                      placeholder="Contoh: 3"
                      value={formData.pesantren_duration_years}
                      onChange={(e) => setFormData(prev => ({ ...prev, pesantren_duration_years: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-brand-emerald font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-500 font-bold mb-1">KEAHLIAN UTAMA / SKILLSET</label>
                    <input
                      type="text"
                      placeholder="Contoh: Desain Grafis, Pertanian Hidroponik, Mekanik Motor, Mengajar..."
                      value={formData.skills}
                      onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-brand-emerald"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: WORK & ECONOMY (1:1 RELATION) */}
              {activeTab === 'pekerjaan' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">PROFESI / PEKERJAAN UTAMA</label>
                    <input
                      type="text"
                      placeholder="Contoh: Wiraswasta, Buruh Tani, PNS, Guru..."
                      value={formData.profession}
                      onChange={(e) => setFormData(prev => ({ ...prev, profession: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-brand-emerald"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">RENTANG PENDAPATAN BULANAN</label>
                    <select
                      value={formData.monthly_income}
                      onChange={(e) => setFormData(prev => ({ ...prev, monthly_income: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-brand-emerald"
                    >
                      <option value="< Rp 1.500.000">&lt; Rp 1.500.000</option>
                      <option value="Rp 1.500.000 - Rp 3.000.000">Rp 1.500.000 - Rp 3.000.000</option>
                      <option value="Rp 3.000.000 - Rp 5.000.000">Rp 3.000.000 - Rp 5.000.000</option>
                      <option value="> Rp 5.000.000">&gt; Rp 5.000.000</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2 border-t border-slate-100 pt-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-brand-emerald font-bold">
                      <input
                        type="checkbox"
                        checked={formData.has_umkm}
                        onChange={(e) => setFormData(prev => ({ ...prev, has_umkm: e.target.checked }))}
                        className="rounded border-slate-300 focus:ring-brand-emerald text-brand-emerald"
                      />
                      <span>Warga Ini Memiliki Usaha Mikro / UMKM</span>
                    </label>
                  </div>
                  {formData.has_umkm && (
                    <>
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">NAMA USAHA / WARUNG / MERK</label>
                        <input
                          type="text"
                          placeholder="Warung Sembako Barokah, dll."
                          value={formData.umkm_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, umkm_name: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-brand-emerald"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">SEKTOR UMKM</label>
                        <input
                          type="text"
                          placeholder="Contoh: Kuliner, Pertanian, Kelontong, Jasa..."
                          value={formData.umkm_sector}
                          onChange={(e) => setFormData(prev => ({ ...prev, umkm_sector: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-brand-emerald"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* STEP 4: POTENTIALS SELECTION (M:M JUNCTION TABLE RELATION) */}
              {activeTab === 'potensi' && (
                <div className="space-y-5">
                  <div className="bg-slate-50 p-4 border border-slate-200/60 rounded-2xl">
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Sensus MWC mengelompokkan potensi warga untuk memudahkan koordinasi pimpinan ketika membutuhkan tenaga ahli (keagamaan, kemaslahatan umat, hingga teknologi digital). Pilih klasifikasi potensi yang sesuai atau tambahkan potensi custom di bawah:
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">1. Pilih Potensi Standar / Presets</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {allPotensi.map((p) => {
                        const isChecked = formData.potensi_ids.includes(p.id);
                        return (
                          <button
                            type="button"
                            key={p.id}
                            onClick={() => handleTogglePotensi(p.id)}
                            className={`text-left p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                              isChecked 
                                ? 'border-brand-emerald bg-emerald-50 text-brand-emerald ring-1 ring-brand-emerald' 
                                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            <div className="flex flex-col min-w-0 pr-1">
                              <span className="truncate">{p.name}</span>
                              <span className="text-[9px] text-slate-400 font-normal font-mono mt-0.5 truncate">{p.category}</span>
                            </div>
                            {isChecked && <CheckCircle2 className="w-4 h-4 text-brand-emerald flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* CUSTOM POTENTIAL INPUT SECTION */}
                  <div className="pt-3 border-t border-slate-200/60">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">2. Tambah Potensi Custom (Spesifik / Khusus)</h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ketik potensi/keahlian custom (misal: Ahli Herbal, Pengrajin Batik, Desainer, dll)"
                        value={customPotensiInput}
                        onChange={(e) => setCustomPotensiInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomPotensi();
                          }
                        }}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-brand-emerald focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomPotensi}
                        className="bg-brand-emerald hover:bg-brand-emerald-dark text-white text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        Tambah
                      </button>
                    </div>

                    {/* RENDER CUSTOM POTENTIAL BADGES */}
                    {customPotensiList.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                        <span className="text-[10px] text-slate-500 font-bold block w-full">POTENSI CUSTOM TERPILIH:</span>
                        {customPotensiList.map((cp, idx) => (
                          <span 
                            key={idx}
                            className="bg-white border border-emerald-200 text-brand-emerald text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-xs"
                          >
                            <span>{cp}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomPotensi(cp)}
                              className="text-slate-400 hover:text-red-500 p-0.5 rounded-full transition-colors cursor-pointer"
                              title="Hapus potensi custom"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* NAVIGATION BUTTONS */}
              <div className="border-t border-slate-100 pt-6 mt-8 flex items-center justify-between">
                <div>
                  {activeTab !== 'diri' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeTab === 'pendidikan') setActiveTab('diri');
                        else if (activeTab === 'pekerjaan') setActiveTab('pendidikan');
                        else if (activeTab === 'potensi') setActiveTab('pekerjaan');
                      }}
                      className="border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold py-2.5 px-4 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Sebelumnya
                    </button>
                  )}
                </div>
                
                <div>
                  {activeTab !== 'potensi' ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeTab === 'diri') setActiveTab('pendidikan');
                        else if (activeTab === 'pendidikan') setActiveTab('pekerjaan');
                        else if (activeTab === 'pekerjaan') setActiveTab('potensi');
                      }}
                      className="bg-brand-emerald text-white text-xs font-bold py-2.5 px-5 rounded-xl hover:bg-brand-emerald-dark transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      Selanjutnya
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="bg-brand-gold text-white text-xs font-bold py-2.5 px-6 rounded-xl hover:bg-amber-700 transition-all cursor-pointer shadow-md shadow-amber-800/15"
                    >
                      {editingId ? 'Simpan Perubahan Sensus' : 'Simpan & Selesaikan Sensus'}
                    </button>
                  )}
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
