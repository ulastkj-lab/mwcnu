/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Calendar, MapPin, Clock, User, Search, Plus, Trash2, Edit, X, 
  CheckCircle2, AlertCircle, Filter, Info, Tag, Users, Layers, ExternalLink, RefreshCw
} from 'lucide-react';
import { Agenda, agendaService } from '../../services/agendaService';

export default function AgendaPage() {
  const { user } = useAuth();
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Selected agenda for action
  const [selectedAgenda, setSelectedAgenda] = useState<Agenda | null>(null);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Form State
  const [formData, setFormData] = useState<Omit<Agenda, 'id'>>({
    title: '',
    category: 'Rapat Pleno',
    date: '',
    time_start: '',
    time_end: '',
    location: '',
    notes: '',
    target_audience: 'Semua Pengurus',
    organizer: 'MWC NU',
    pj_name: '',
    status: 'Mendatang',
    is_public: true
  });

  // Load from service on mount
  useEffect(() => {
    setAgendas(agendaService.getAgendas());

    // Listen for storage sync events from other tabs/views (like dashboard updates)
    const handleStorageChange = () => {
      setAgendas(agendaService.getAgendas());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Handle Form Change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Proactively clear error indicator on change
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  // Helper for input styles based on validation error
  const getInputClass = (fieldName: string, isSelectOrDate = false) => {
    const base = "w-full bg-slate-50 border rounded-xl py-2 px-3 text-xs outline-none transition-all";
    const status = isSelectOrDate ? "font-semibold text-slate-700" : "font-medium text-slate-700";
    const errorState = validationErrors[fieldName]
      ? "border-red-500 focus:border-red-500 focus:ring-red-500/10 text-red-900 bg-red-50/10"
      : "border-slate-200 focus:border-brand-emerald focus:ring-emerald-500/10";
    return `${base} ${status} ${errorState}`;
  };

  // Open Create Modal
  const openCreateModal = () => {
    setValidationErrors({});
    setFormData({
      title: '',
      category: 'Rapat Pleno',
      date: new Date().toISOString().split('T')[0],
      time_start: '09:00',
      time_end: '12:00',
      location: '',
      notes: '',
      target_audience: 'Semua Pengurus',
      organizer: user?.ranting_name || 'MWC NU Karangpawitan',
      pj_name: user?.name || '',
      status: 'Mendatang',
      is_public: true
    });
    setIsCreateModalOpen(true);
  };

  // Submit Create Agenda
  const handleCreateAgenda = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    const result = agendaService.createAgenda(formData);
    if (!result.success) {
      setValidationErrors(result.errors || {});
      return;
    }

    // Refresh and close
    setAgendas(agendaService.getAgendas());
    setIsCreateModalOpen(false);
  };

  // Open Edit Modal
  const openEditModal = (agenda: Agenda) => {
    setValidationErrors({});
    setSelectedAgenda(agenda);
    setFormData({
      title: agenda.title,
      category: agenda.category,
      date: agenda.date,
      time_start: agenda.time_start,
      time_end: agenda.time_end,
      location: agenda.location,
      notes: agenda.notes,
      target_audience: agenda.target_audience,
      organizer: agenda.organizer,
      pj_name: agenda.pj_name,
      status: agenda.status,
      is_public: agenda.is_public
    });
    setIsEditModalOpen(true);
  };

  // Submit Edit Agenda
  const handleEditAgenda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgenda) return;
    setValidationErrors({});

    const result = agendaService.updateAgenda(selectedAgenda.id, formData);
    if (!result.success) {
      setValidationErrors(result.errors || {});
      return;
    }

    // Refresh and close
    setAgendas(agendaService.getAgendas());
    setIsEditModalOpen(false);
    setSelectedAgenda(null);
  };

  // Delete Agenda
  const handleDeleteAgenda = (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus agenda kegiatan ini dari jadwal?')) {
      const result = agendaService.deleteAgenda(id);
      if (result.success) {
        setAgendas(agendaService.getAgendas());
        if (selectedAgenda?.id === id) {
          setIsDetailModalOpen(false);
          setSelectedAgenda(null);
        }
      } else {
        alert(result.error || 'Gagal menghapus agenda.');
      }
    }
  };

  // Update Status Quick Action
  const handleUpdateStatus = (id: number, newStatus: Agenda['status']) => {
    const agendaToUpdate = agendas.find(a => a.id === id);
    if (!agendaToUpdate) return;

    const { id: _, ...rest } = { ...agendaToUpdate, status: newStatus };
    const result = agendaService.updateAgenda(id, rest);
    
    if (result.success) {
      setAgendas(agendaService.getAgendas());
      if (selectedAgenda && selectedAgenda.id === id) {
        setSelectedAgenda(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } else {
      alert(result.errors?.general || 'Gagal memperbarui status agenda.');
    }
  };

  // Categories & Statuses lists for filters
  const categories = ['Semua', 'Rapat Pleno', 'Pengajian', 'Sosial', 'Konferensi', 'Pelatihan'];
  const statuses = ['Semua', 'Mendatang', 'Sedang Berlangsung', 'Selesai', 'Dibatalkan'];

  // Formatting date for Indonesian locale
  const formatIndonesianDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

  // Filter schedules
  const filteredAgendas = agendas.filter(agenda => {
    const matchesSearch = 
      agenda.title.toLowerCase().includes(search.toLowerCase()) ||
      agenda.location.toLowerCase().includes(search.toLowerCase()) ||
      agenda.pj_name.toLowerCase().includes(search.toLowerCase()) ||
      agenda.organizer.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === 'Semua' || agenda.category === selectedCategory;
    const matchesStatus = selectedStatus === 'Semua' || agenda.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Count items for statistics widgets
  const stats = {
    total: agendas.length,
    upcoming: agendas.filter(a => a.status === 'Mendatang').length,
    ongoing: agendas.filter(a => a.status === 'Sedang Berlangsung').length,
    completed: agendas.filter(a => a.status === 'Selesai').length
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-emerald-950 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-brand-emerald" />
            <span>Manajemen Agenda & Kegiatan MWC</span>
          </h2>
          <p className="text-slate-500 text-xs mt-0.5 font-medium font-sans">
            Atur koordinasi, jadwal rapat pleno, lailatul ijtima, pengajian syuriah, pengkaderan banom, dan kegiatan sosial MWC NU Karangpawitan secara terstruktur.
          </p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-brand-emerald hover:bg-emerald-800 text-white font-semibold py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-emerald-900/10 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Kegiatan Baru
        </button>
      </div>

      {/* STATS SUMMARY CARD GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* TOTAL AGENDA */}
        <div className="bg-white p-4 border border-slate-150 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400">Total Jadwal</span>
            <p className="text-xl font-bold font-display text-slate-800">{stats.total}</p>
          </div>
          <div className="p-2 bg-slate-50 text-slate-500 rounded-xl">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        {/* MENDATANG */}
        <div className="bg-white p-4 border border-slate-150 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400">Akan Datang</span>
            <p className="text-xl font-bold font-display text-blue-600">{stats.upcoming}</p>
          </div>
          <div className="p-2 bg-blue-50 text-blue-500 rounded-xl">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* BERLANGSUNG */}
        <div className="bg-white p-4 border border-slate-150 rounded-2xl shadow-sm flex items-center justify-between animate-pulse">
          <div className="space-y-1">
            <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400">Sedang Berjalan</span>
            <p className="text-xl font-bold font-display text-amber-600">{stats.ongoing}</p>
          </div>
          <div className="p-2 bg-amber-50 text-amber-500 rounded-xl">
            <RefreshCw className="w-4 h-4 text-amber-600 animate-spin" />
          </div>
        </div>

        {/* SELESAI */}
        <div className="bg-white p-4 border border-slate-150 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400">Telah Selesai</span>
            <p className="text-xl font-bold font-display text-emerald-600">{stats.completed}</p>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

      </div>

      {/* FILTER & TOOLBAR PANEL */}
      <div className="bg-white p-4 border border-slate-150 rounded-2xl shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          
          {/* Search Box */}
          <div className="relative flex-grow">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari agenda berdasarkan judul, lokasi, panitia, atau PJ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-brand-emerald focus:ring-1 focus:ring-emerald-500/10 rounded-xl py-2 pl-9 pr-4 text-xs font-medium outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Filters Selector */}
          <div className="flex flex-wrap gap-2.5 items-center">
            
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-semibold text-slate-600 cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat === 'Semua' ? 'Semua Kategori' : cat}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select 
                value={selectedStatus} 
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-semibold text-slate-600 cursor-pointer"
              >
                {statuses.map(st => (
                  <option key={st} value={st}>{st === 'Semua' ? 'Semua Status' : st}</option>
                ))}
              </select>
            </div>

          </div>

        </div>
      </div>

      {/* AGENDA TIMELINE/LIST CARD GRID */}
      {filteredAgendas.length === 0 ? (
        <div className="bg-white border border-slate-150 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-3">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="font-display font-bold text-slate-700 text-sm">Tidak Ada Kegiatan yang Cocok</h4>
          <p className="text-slate-400 text-xs">Coba sesuaikan pencarian Anda atau hilangkan beberapa filter untuk melihat agenda kegiatan MWC NU Karangpawitan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgendas.map((agenda) => {
            // Determine badge colors for Status
            let statusStyle = 'bg-slate-100 text-slate-600 border-slate-200';
            if (agenda.status === 'Mendatang') statusStyle = 'bg-blue-50 text-blue-600 border-blue-200';
            else if (agenda.status === 'Sedang Berlangsung') statusStyle = 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
            else if (agenda.status === 'Selesai') statusStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            else if (agenda.status === 'Dibatalkan') statusStyle = 'bg-red-50 text-red-600 border-red-200';

            // Determine category color accent line
            let categoryAccent = 'border-l-brand-gold';
            if (agenda.category === 'Pengajian') categoryAccent = 'border-l-emerald-600';
            else if (agenda.category === 'Rapat Pleno') categoryAccent = 'border-l-blue-600';
            else if (agenda.category === 'Sosial') categoryAccent = 'border-l-pink-600';
            else if (agenda.category === 'Pelatihan') categoryAccent = 'border-l-amber-600';
            else if (agenda.category === 'Konferensi') categoryAccent = 'border-l-indigo-600';

            return (
              <div 
                key={agenda.id} 
                className={`bg-white border-l-4 ${categoryAccent} border-y border-r border-slate-150 rounded-xl p-5 hover:shadow-md transition-all flex flex-col justify-between space-y-4`}
              >
                <div className="space-y-2.5 text-left">
                  
                  {/* Category & Status Header */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="bg-slate-100 border border-slate-200 text-slate-600 font-mono text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      {agenda.category}
                    </span>
                    <span className={`border text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${statusStyle}`}>
                      {agenda.status}
                    </span>
                  </div>

                  {/* Agenda Title */}
                  <h3 
                    onClick={() => { setSelectedAgenda(agenda); setIsDetailModalOpen(true); }}
                    className="font-display font-bold text-sm text-slate-800 leading-snug cursor-pointer hover:text-brand-emerald hover:underline transition-all line-clamp-2"
                  >
                    {agenda.title}
                  </h3>

                  {/* Public or Private mark */}
                  <div className="flex items-center gap-1.5 text-[10px] font-bold">
                    {agenda.is_public ? (
                      <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">Publik (Terbuka)</span>
                    ) : (
                      <span className="text-slate-500 bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded">Internal (Pengurus Only)</span>
                    )}
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-500 font-mono">{agenda.organizer}</span>
                  </div>

                  {/* Time & Location details */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] font-medium text-slate-500">
                    <p className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{formatIndonesianDate(agenda.date)}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{agenda.time_start} - {agenda.time_end || 'selesai'} WIB</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{agenda.location}</span>
                    </p>
                  </div>

                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  
                  {/* Quick PIC Info */}
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold truncate max-w-[120px]">
                    <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span className="truncate" title={`PJ: ${agenda.pj_name}`}>{agenda.pj_name}</span>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => { setSelectedAgenda(agenda); setIsDetailModalOpen(true); }}
                      className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 border border-slate-200 hover:text-slate-800 transition-all cursor-pointer"
                      title="Lihat Detail"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => openEditModal(agenda)}
                      className="p-1.5 hover:bg-slate-50 rounded-lg text-amber-500 border border-slate-200 hover:text-amber-700 transition-all cursor-pointer"
                      title="Sunting Agenda"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteAgenda(agenda.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 border border-slate-200 hover:text-red-700 transition-all cursor-pointer"
                      title="Hapus Agenda"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: ADD AGENDA (CREATE) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col text-left">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-brand-emerald-dark to-emerald-950 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-sm">Tambah Agenda Kegiatan Baru</h3>
                <p className="text-[10px] text-emerald-200">Sertakan koordinasi terintegrasi organisasi MWC NU.</p>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)} 
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Form Body */}
            <form onSubmit={handleCreateAgenda} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Title */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Nama Kegiatan / Agenda *</label>
                  <input
                    type="text"
                    name="title"
                    placeholder="Contoh: Pengajian Rutin Lailatul Ijtima Ranting"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={getInputClass('title')}
                  />
                  {validationErrors.title && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {validationErrors.title}
                    </p>
                  )}
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Kategori Kegiatan *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={getInputClass('category', true)}
                  >
                    <option value="Rapat Pleno">Rapat Pleno</option>
                    <option value="Pengajian">Pengajian</option>
                    <option value="Sosial">Sosial / Baksos</option>
                    <option value="Konferensi">Konferensi</option>
                    <option value="Pelatihan">Pelatihan / Kaderisasi</option>
                  </select>
                  {validationErrors.category && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {validationErrors.category}
                    </p>
                  )}
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Tanggal Pelaksanaan *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className={getInputClass('date', true)}
                  />
                  {validationErrors.date && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {validationErrors.date}
                    </p>
                  )}
                </div>

                {/* Start Time */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Waktu Mulai *</label>
                  <input
                    type="time"
                    name="time_start"
                    value={formData.time_start}
                    onChange={handleInputChange}
                    className={getInputClass('time_start')}
                  />
                  {validationErrors.time_start && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {validationErrors.time_start}
                    </p>
                  )}
                </div>

                {/* End Time */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Waktu Selesai</label>
                  <input
                    type="time"
                    name="time_end"
                    placeholder="HH:MM"
                    value={formData.time_end}
                    onChange={handleInputChange}
                    className={getInputClass('time_end')}
                  />
                  {validationErrors.time_end && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {validationErrors.time_end}
                    </p>
                  )}
                </div>

                {/* Location */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Lokasi / Tempat Acara *</label>
                  <input
                    type="text"
                    name="location"
                    placeholder="Contoh: Masjid Jami Al-Hidayah atau Aula MWC"
                    value={formData.location}
                    onChange={handleInputChange}
                    className={getInputClass('location')}
                  />
                  {validationErrors.location && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {validationErrors.location}
                    </p>
                  )}
                </div>

                {/* Organizer */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Penyelenggara / Panitia *</label>
                  <input
                    type="text"
                    name="organizer"
                    placeholder="Contoh: PAC GP Ansor / Tanfidziyah"
                    value={formData.organizer}
                    onChange={handleInputChange}
                    className={getInputClass('organizer')}
                  />
                  {validationErrors.organizer && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {validationErrors.organizer}
                    </p>
                  )}
                </div>

                {/* PJ Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Penanggung Jawab (PJ) *</label>
                  <input
                    type="text"
                    name="pj_name"
                    placeholder="Contoh: Sahabat Ridwan"
                    value={formData.pj_name}
                    onChange={handleInputChange}
                    className={getInputClass('pj_name')}
                  />
                  {validationErrors.pj_name && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {validationErrors.pj_name}
                    </p>
                  )}
                </div>

                {/* Target Audience */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Target Sasaran / Peserta</label>
                  <input
                    type="text"
                    name="target_audience"
                    placeholder="Contoh: Semua Pengurus, Umum, Nahdliyin"
                    value={formData.target_audience}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-brand-emerald focus:ring-1 focus:ring-emerald-500/10 rounded-xl py-2 px-3 text-xs outline-none transition-all font-medium text-slate-700"
                  />
                </div>

                {/* Visibility/Public Checkbox */}
                <div className="flex items-center space-x-2 pt-5">
                  <input
                    type="checkbox"
                    id="is_public_check"
                    name="is_public"
                    checked={formData.is_public}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-brand-emerald/10 cursor-pointer"
                  />
                  <label htmlFor="is_public_check" className="text-xs font-semibold text-slate-600 cursor-pointer select-none">
                    Tampilkan agenda untuk umum (Publik)
                  </label>
                </div>

                {/* Description/Notes */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Keterangan / Deskripsi Kegiatan</label>
                  <textarea
                    name="notes"
                    rows={3}
                    placeholder="Tuliskan detail, pokok bahasan rapat, penceramah, atau instruksi kehadiran..."
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-brand-emerald focus:ring-1 focus:ring-emerald-500/10 rounded-xl py-2 px-3 text-xs outline-none transition-all font-medium text-slate-700"
                  />
                </div>

              </div>

              {/* Form Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-2 px-4 rounded-xl text-xs transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-brand-emerald hover:bg-emerald-800 text-white font-semibold py-2 px-5 rounded-xl text-xs transition-all cursor-pointer"
                >
                  Simpan Jadwal Kegiatan
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: EDIT AGENDA */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col text-left">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-600 to-amber-950 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-sm">Sunting Agenda Kegiatan</h3>
                <p className="text-[10px] text-amber-200">Perbarui rincian logistik, waktu, atau status kegiatan.</p>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Form Body */}
            <form onSubmit={handleEditAgenda} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Title */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Nama Kegiatan / Agenda *</label>
                  <input
                    type="text"
                    name="title"
                    placeholder="Contoh: Pengajian Rutin Lailatul Ijtima Ranting"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={getInputClass('title')}
                  />
                  {validationErrors.title && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {validationErrors.title}
                    </p>
                  )}
                </div>

                {/* Status Selector */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Status Kegiatan *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className={getInputClass('status', true)}
                  >
                    <option value="Mendatang">Mendatang</option>
                    <option value="Sedang Berlangsung">Sedang Berlangsung</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Dibatalkan">Dibatalkan</option>
                  </select>
                  {validationErrors.status && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {validationErrors.status}
                    </p>
                  )}
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Kategori Kegiatan *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={getInputClass('category', true)}
                  >
                    <option value="Rapat Pleno">Rapat Pleno</option>
                    <option value="Pengajian">Pengajian</option>
                    <option value="Sosial">Sosial / Baksos</option>
                    <option value="Konferensi">Konferensi</option>
                    <option value="Pelatihan">Pelatihan / Kaderisasi</option>
                  </select>
                  {validationErrors.category && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {validationErrors.category}
                    </p>
                  )}
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Tanggal Pelaksanaan *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className={getInputClass('date', true)}
                  />
                  {validationErrors.date && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {validationErrors.date}
                    </p>
                  )}
                </div>

                {/* Start Time */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Waktu Mulai *</label>
                  <input
                    type="time"
                    name="time_start"
                    value={formData.time_start}
                    onChange={handleInputChange}
                    className={getInputClass('time_start')}
                  />
                  {validationErrors.time_start && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {validationErrors.time_start}
                    </p>
                  )}
                </div>

                {/* End Time */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Waktu Selesai</label>
                  <input
                    type="time"
                    name="time_end"
                    placeholder="HH:MM"
                    value={formData.time_end}
                    onChange={handleInputChange}
                    className={getInputClass('time_end')}
                  />
                  {validationErrors.time_end && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {validationErrors.time_end}
                    </p>
                  )}
                </div>

                {/* Location */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Lokasi / Tempat Acara *</label>
                  <input
                    type="text"
                    name="location"
                    placeholder="Contoh: Masjid Jami Al-Hidayah atau Aula MWC"
                    value={formData.location}
                    onChange={handleInputChange}
                    className={getInputClass('location')}
                  />
                  {validationErrors.location && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {validationErrors.location}
                    </p>
                  )}
                </div>

                {/* Organizer */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Penyelenggara / Panitia *</label>
                  <input
                    type="text"
                    name="organizer"
                    placeholder="Contoh: PAC GP Ansor / Tanfidziyah"
                    value={formData.organizer}
                    onChange={handleInputChange}
                    className={getInputClass('organizer')}
                  />
                  {validationErrors.organizer && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {validationErrors.organizer}
                    </p>
                  )}
                </div>

                {/* PJ Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Penanggung Jawab (PJ) *</label>
                  <input
                    type="text"
                    name="pj_name"
                    placeholder="Contoh: Sahabat Ridwan"
                    value={formData.pj_name}
                    onChange={handleInputChange}
                    className={getInputClass('pj_name')}
                  />
                  {validationErrors.pj_name && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {validationErrors.pj_name}
                    </p>
                  )}
                </div>

                {/* Target Audience */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Target Sasaran / Peserta</label>
                  <input
                    type="text"
                    name="target_audience"
                    placeholder="Contoh: Semua Pengurus, Umum, Nahdliyin"
                    value={formData.target_audience}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-brand-emerald focus:ring-1 focus:ring-emerald-500/10 rounded-xl py-2 px-3 text-xs outline-none transition-all font-medium text-slate-700"
                  />
                </div>

                {/* Visibility/Public Checkbox */}
                <div className="flex items-center space-x-2 pt-5">
                  <input
                    type="checkbox"
                    id="is_public_edit_check"
                    name="is_public"
                    checked={formData.is_public}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-brand-emerald/10 cursor-pointer"
                  />
                  <label htmlFor="is_public_edit_check" className="text-xs font-semibold text-slate-600 cursor-pointer select-none">
                    Tampilkan agenda untuk umum (Publik)
                  </label>
                </div>

                {/* Description/Notes */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Keterangan / Deskripsi Kegiatan</label>
                  <textarea
                    name="notes"
                    rows={3}
                    placeholder="Tuliskan detail, pokok bahasan rapat, penceramah, atau instruksi kehadiran..."
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-brand-emerald focus:ring-1 focus:ring-emerald-500/10 rounded-xl py-2 px-3 text-xs outline-none transition-all font-medium"
                  />
                </div>

              </div>

              {/* Form Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-2 px-4 rounded-xl text-xs transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-5 rounded-xl text-xs transition-all cursor-pointer"
                >
                  Perbarui Jadwal Kegiatan
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL 3: VIEW DETAILS OF AGENDA */}
      {isDetailModalOpen && selectedAgenda && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col text-left">
            
            {/* Modal Header */}
            <div className="bg-brand-emerald-dark text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="bg-white/15 border border-white/15 text-emerald-200 font-mono text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  Detail Kegiatan resmi
                </span>
                <h3 className="font-display font-bold text-sm text-white mt-1 leading-normal">{selectedAgenda.title}</h3>
              </div>
              <button 
                onClick={() => { setIsDetailModalOpen(false); setSelectedAgenda(null); }} 
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Details Body */}
            <div className="p-6 space-y-4">
              
              {/* Event Meta Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Kategori</span>
                  <p className="text-xs font-bold text-slate-800">{selectedAgenda.category}</p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`inline-block w-2 h-2 rounded-full ${
                      selectedAgenda.status === 'Mendatang' ? 'bg-blue-500' :
                      selectedAgenda.status === 'Sedang Berlangsung' ? 'bg-amber-500 animate-pulse' :
                      selectedAgenda.status === 'Selesai' ? 'bg-emerald-500' : 'bg-red-500'
                    }`}></span>
                    <p className="text-xs font-bold text-slate-800">{selectedAgenda.status}</p>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Sifat Agenda</span>
                  <p className="text-xs font-bold text-slate-800">
                    {selectedAgenda.is_public ? 'Terbuka (Publik)' : 'Internal (Khusus Pengurus)'}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Penyelenggara</span>
                  <p className="text-xs font-bold text-slate-800">{selectedAgenda.organizer}</p>
                </div>

              </div>

              {/* Time & Place Details */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase">Hari & Tanggal</h5>
                    <p className="text-xs font-semibold text-slate-800">{formatIndonesianDate(selectedAgenda.date)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase">Waktu Kegiatan</h5>
                    <p className="text-xs font-semibold text-slate-800">{selectedAgenda.time_start} - {selectedAgenda.time_end || 'selesai'} WIB</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase">Lokasi / Tempat</h5>
                    <p className="text-xs font-semibold text-slate-800">{selectedAgenda.location}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase">Target Sasaran</h5>
                    <p className="text-xs font-semibold text-slate-800">{selectedAgenda.target_audience}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase">Penanggung Jawab (PJ)</h5>
                    <p className="text-xs font-bold text-brand-emerald">{selectedAgenda.pj_name}</p>
                  </div>
                </div>
              </div>

              {/* Description / Notes block */}
              {selectedAgenda.notes && (
                <div className="pt-3 border-t border-slate-100 space-y-1">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase">Deskripsi Kegiatan</h5>
                  <p className="text-xs text-slate-600 bg-slate-50 border border-slate-150 p-3 rounded-xl leading-relaxed whitespace-pre-line">
                    {selectedAgenda.notes}
                  </p>
                </div>
              )}

              {/* Quick Status Update buttons */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <h5 className="text-[10px] font-bold text-slate-400 uppercase">Ubah Status Kegiatan Cepat</h5>
                <div className="flex flex-wrap gap-1.5">
                  <button 
                    onClick={() => handleUpdateStatus(selectedAgenda.id, 'Mendatang')}
                    disabled={selectedAgenda.status === 'Mendatang'}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      selectedAgenda.status === 'Mendatang' 
                        ? 'bg-blue-50 text-blue-600 border-blue-200' 
                        : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Mendatang
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(selectedAgenda.id, 'Sedang Berlangsung')}
                    disabled={selectedAgenda.status === 'Sedang Berlangsung'}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      selectedAgenda.status === 'Sedang Berlangsung' 
                        ? 'bg-amber-50 text-amber-600 border-amber-200' 
                        : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Sedang Berlangsung
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(selectedAgenda.id, 'Selesai')}
                    disabled={selectedAgenda.status === 'Selesai'}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      selectedAgenda.status === 'Selesai' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                        : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Selesai
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(selectedAgenda.id, 'Dibatalkan')}
                    disabled={selectedAgenda.status === 'Dibatalkan'}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      selectedAgenda.status === 'Dibatalkan' 
                        ? 'bg-red-50 text-red-600 border-red-200' 
                        : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Dibatalkan
                  </button>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-150 p-4 flex items-center justify-between">
              <button 
                onClick={() => { handleDeleteAgenda(selectedAgenda.id); }}
                className="text-red-600 hover:bg-red-50 hover:text-red-700 font-bold border border-transparent hover:border-red-200 py-1.5 px-3 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus
              </button>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setIsDetailModalOpen(false); openEditModal(selectedAgenda); }}
                  className="bg-white hover:bg-slate-100 border border-slate-250 text-slate-700 font-bold py-1.5 px-3 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Sunting
                </button>
                <button 
                  onClick={() => { setIsDetailModalOpen(false); setSelectedAgenda(null); }}
                  className="bg-brand-emerald hover:bg-emerald-800 text-white font-bold py-1.5 px-4 rounded-lg text-xs transition-all cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
