/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { 
  FileText, Folder, Upload, Download, History, Search, Plus, Trash2, Edit, X, 
  CheckCircle2, AlertCircle, Filter, Tag, Info, Layers, ExternalLink, Calendar,
  User, Check, ChevronDown, RefreshCw, FileUp, ShieldAlert
} from 'lucide-react';
import { Document, DocumentVersion, documentService } from '../../services/documentService';

export default function DokumenPage() {
  const { hasRole, user } = useAuth();
  
  // Can modify if Admin or Pengurus
  const canModify = hasRole('admin') || hasRole('pengurus') || hasRole('operator');

  // Core Document State
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  
  // UI Panels
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [selectedTag, setSelectedTag] = useState<string>('Semua');

  // Form Fields State
  const [inputMethod, setInputMethod] = useState<'file' | 'manual'>('file');
  const [formData, setFormData] = useState({
    title: '',
    number: '',
    category: 'SK Kepengurusan' as Document['category'],
    status: 'Aktif' as Document['status'],
    description: '',
    file_name: '',
    file_size: '',
    file_url: '',
    tagsString: '' // comma separated tags
  });

  // Version Upload State
  const [versionForm, setVersionForm] = useState({
    version: '',
    notes: '',
    file_name: '',
    file_size: ''
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [dragActive, setDragActive] = useState(false);
  const [simulatedFile, setSimulatedFile] = useState<{ name: string; size: string } | null>(null);

  // Load documents
  useEffect(() => {
    setDocuments(documentService.getDocuments());

    const handleStorageChange = () => {
      setDocuments(documentService.getDocuments());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Sync details modal if document updates
  useEffect(() => {
    if (selectedDoc) {
      const updated = documents.find(d => d.id === selectedDoc.id);
      if (updated) {
        setSelectedDoc(updated);
      }
    }
  }, [documents, selectedDoc?.id]);

  // Handle Drag Over / Enter
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file.name, file.size);
    }
  };

  // Handle Manual File Input
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleFileSelected(file.name, file.size);
    }
  };

  const handleFileSelected = (name: string, sizeInBytes: number) => {
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(1);
    const sizeStr = `${sizeInMB} MB`;
    
    setSimulatedFile({ name, size: sizeStr });
    
    // Auto fill form fields
    setFormData(prev => ({
      ...prev,
      file_name: name,
      file_size: sizeStr,
      // If title is empty, propose title based on file name
      title: prev.title || name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ")
    }));

    setVersionForm(prev => ({
      ...prev,
      file_name: name,
      file_size: sizeStr
    }));

    // Clear validation error on file if any
    setValidationErrors(prev => {
      const copy = { ...prev };
      delete copy.file_name;
      return copy;
    });
  };

  // Handle Input Changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleVersionInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setVersionForm(prev => ({ ...prev, [name]: value }));

    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setValidationErrors({});
    setSimulatedFile(null);
    setInputMethod('file');
    setFormData({
      title: '',
      number: '',
      category: 'SK Kepengurusan',
      status: 'Aktif',
      description: '',
      file_name: '',
      file_size: '',
      file_url: '',
      tagsString: ''
    });
    setIsCreateModalOpen(true);
  };

  // Submit Create Document
  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    if (inputMethod === 'file' && !formData.file_name) {
      setValidationErrors(prev => ({ ...prev, file_name: 'Silakan unggah draf berkas / file terlebih dahulu.' }));
      return;
    }

    const finalFileName = inputMethod === 'manual'
      ? (formData.file_name.trim() || `${formData.title.trim().replace(/\s+/g, '_') || 'dokumen_mwc'}.pdf`)
      : formData.file_name;

    const finalFileSize = inputMethod === 'manual'
      ? (formData.file_size.trim() || 'Manual / Cloud')
      : formData.file_size;

    const tags = formData.tagsString
      ? formData.tagsString.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    const result = documentService.createDocument(
      {
        title: formData.title,
        number: formData.number,
        category: formData.category,
        status: formData.status,
        description: formData.description,
        file_name: finalFileName,
        file_size: finalFileSize,
        file_url: formData.file_url ? formData.file_url.trim() : undefined,
        input_method: inputMethod,
        tags
      },
      user?.name || 'Operator MWC',
      inputMethod === 'manual' ? 'Dokumen diinput secara manual ke dalam repositori MWC.' : 'Dokumen diinisiasi pertama kali via unggah berkas.'
    );

    if (!result.success) {
      setValidationErrors(result.errors || {});
      return;
    }

    setDocuments(documentService.getDocuments());
    setIsCreateModalOpen(false);
  };

  // Open Edit Modal
  const openEditModal = (doc: Document) => {
    setValidationErrors({});
    setSimulatedFile({ name: doc.file_name, size: doc.file_size });
    setInputMethod(doc.input_method || 'file');
    setFormData({
      title: doc.title,
      number: doc.number,
      category: doc.category,
      status: doc.status,
      description: doc.description,
      file_name: doc.file_name,
      file_size: doc.file_size,
      file_url: doc.file_url || '',
      tagsString: doc.tags.join(', ')
    });
    setSelectedDoc(doc);
    setIsEditModalOpen(true);
  };

  // Submit Edit Document (Metadata only, preserving version history)
  const handleEditDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;
    setValidationErrors({});

    const tags = formData.tagsString
      ? formData.tagsString.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    const result = documentService.updateDocument(
      selectedDoc.id,
      {
        title: formData.title,
        number: formData.number,
        category: formData.category,
        status: formData.status,
        description: formData.description,
        file_name: formData.file_name,
        file_size: formData.file_size,
        file_url: formData.file_url ? formData.file_url.trim() : undefined,
        input_method: inputMethod,
        tags
      },
      false, // isNewVersion
      '',
      '',
      user?.name || 'Operator MWC'
    );

    if (!result.success) {
      setValidationErrors(result.errors || {});
      return;
    }

    setDocuments(documentService.getDocuments());
    setIsEditModalOpen(false);
    setSelectedDoc(null);
  };

  // Quick Change Status (CRUD Update shortcut)
  const handleQuickStatusChange = (doc: Document, newStatus: Document['status']) => {
    const result = documentService.updateDocument(
      doc.id,
      {
        title: doc.title,
        number: doc.number,
        category: doc.category,
        status: newStatus,
        description: doc.description,
        file_name: doc.file_name,
        file_size: doc.file_size,
        file_url: doc.file_url,
        input_method: doc.input_method,
        tags: doc.tags
      },
      false,
      '',
      '',
      user?.name || 'Operator MWC'
    );
    if (result.success) {
      setDocuments(documentService.getDocuments());
    }
  };

  // Open Version Upload Modal
  const openVersionModal = (doc: Document) => {
    setValidationErrors({});
    setSimulatedFile(null);
    setSelectedDoc(doc);
    
    // Auto increment version suggestion (e.g. 1.0 -> 1.1 or 2.0)
    let nextVersion = '2.0';
    if (doc.versions && doc.versions.length > 0) {
      const currentVerNum = parseFloat(doc.versions[0].version);
      if (!isNaN(currentVerNum)) {
        nextVersion = (currentVerNum + 0.1).toFixed(1);
      }
    }

    setVersionForm({
      version: nextVersion,
      notes: '',
      file_name: '',
      file_size: ''
    });

    setFormData({
      title: doc.title,
      number: doc.number,
      category: doc.category,
      status: doc.status,
      description: doc.description,
      file_name: doc.file_name,
      file_size: doc.file_size,
      tagsString: doc.tags.join(', ')
    });

    setIsVersionModalOpen(true);
  };

  // Submit New Version
  const handleNewVersionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;
    setValidationErrors({});

    if (!versionForm.file_name) {
      setValidationErrors(prev => ({ ...prev, file_name: 'Silakan pilih berkas revisi baru.' }));
      return;
    }

    if (!versionForm.version || !versionForm.version.trim()) {
      setValidationErrors(prev => ({ ...prev, version: 'Nomor versi wajib ditentukan.' }));
      return;
    }

    const result = documentService.updateDocument(
      selectedDoc.id,
      {
        title: formData.title,
        number: formData.number,
        category: formData.category,
        status: formData.status,
        description: formData.description,
        file_name: versionForm.file_name,
        file_size: versionForm.file_size,
        tags: selectedDoc.tags
      },
      true, // isNewVersion
      versionForm.version,
      versionForm.notes,
      user?.name || 'Operator MWC'
    );

    if (!result.success) {
      setValidationErrors(result.errors || {});
      return;
    }

    setDocuments(documentService.getDocuments());
    setIsVersionModalOpen(false);
    
    // If details modal was open, update it
    const updated = result.data;
    if (updated) {
      setSelectedDoc(updated);
    }
  };

  // Delete Document
  const handleDeleteDocument = (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus dokumen organisasi ini? Semua berkas lama dan histori versi akan dihapus permanen.')) {
      const result = documentService.deleteDocument(id);
      if (result.success) {
        setDocuments(documentService.getDocuments());
        setIsDetailModalOpen(false);
        setSelectedDoc(null);
      } else {
        alert(result.error || 'Gagal menghapus dokumen.');
      }
    }
  };

  // Handle Download or Open Link
  const handleDownload = (doc: Document) => {
    documentService.incrementDownload(doc.id);
    setDocuments(documentService.getDocuments());

    if (doc.file_url && (doc.file_url.startsWith('http://') || doc.file_url.startsWith('https://'))) {
      window.open(doc.file_url, '_blank');
      return;
    }

    // Trigger standard visual notification or toast-like effect by making a fake link download
    const link = document.createElement('a');
    link.href = '#';
    link.setAttribute('download', doc.file_name);
    document.body.appendChild(link);
    
    // Show download prompt alert or confirm
    alert(`Mensimulasikan unduhan file: "${doc.file_name}" (${doc.file_size}). Unduhan berhasil dicatat di log audit dokumen.`);
    document.body.removeChild(link);
  };

  // Get all unique tags for filter options
  const allTags = Array.from(new Set(documents.flatMap(d => d.tags)));

  // Filter Documents based on state
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'Semua' || doc.category === selectedCategory;
    const matchesStatus = selectedStatus === 'Semua' || doc.status === selectedStatus;
    const matchesTag = selectedTag === 'Semua' || doc.tags.includes(selectedTag);

    return matchesSearch && matchesCategory && matchesStatus && matchesTag;
  });

  // Get Category badge colors
  const getCategoryColor = (category: Document['category']) => {
    switch (category) {
      case 'SK Kepengurusan': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'AD/ART': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Proposal & LPJ': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Surat Resmi': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Pedoman & Panduan': return 'bg-teal-50 text-teal-700 border-teal-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  // Get Status badge colors
  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'Aktif': return 'bg-green-100 text-green-800 border-green-200';
      case 'Arsip': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'Ditinjau': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Draf': return 'bg-gray-100 text-gray-500 border-gray-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getInputClass = (fieldName: string, isSelectOrDate = false) => {
    const base = "w-full bg-slate-50 border rounded-xl py-2 px-3 text-xs outline-none transition-all";
    const status = isSelectOrDate ? "font-semibold text-slate-700" : "font-medium text-slate-700";
    const errorState = validationErrors[fieldName]
      ? "border-red-500 focus:border-red-500 focus:ring-red-500/10 text-red-900 bg-red-50/10"
      : "border-slate-200 focus:border-brand-emerald focus:ring-emerald-500/10";
    return `${base} ${status} ${errorState}`;
  };

  return (
    <div id="dokumen_container" className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* Dashboard / Title Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] bg-brand-emerald/10 text-brand-emerald font-bold rounded-full uppercase tracking-wider">
              Arsip & Regulasi
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-[11px] text-slate-400 font-medium">MWC NU Karangpawitan</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Folder className="w-6 h-6 text-brand-emerald" /> Manajemen Dokumen Digital
          </h1>
          <p className="text-xs text-slate-500">
            Unggah, kategorisasi, cari, dan kelola kontrol versi AD/ART, SK Kepengurusan, Proposal, serta LPJ secara teratur dan akuntabel.
          </p>
        </div>

        {canModify && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 bg-brand-emerald text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-sm hover:bg-emerald-600 transition-colors"
          >
            <Upload className="w-4 h-4" /> Unggah Dokumen Baru
          </motion.button>
        )}
      </div>

      {/* Analytics Info Block */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Dokumen', count: documents.length, icon: FileText, color: 'text-brand-emerald bg-emerald-50' },
          { label: 'SK Kepengurusan', count: documents.filter(d => d.category === 'SK Kepengurusan').length, icon: Folder, color: 'text-blue-600 bg-blue-50' },
          { label: 'Aktif / Berlaku', count: documents.filter(d => d.status === 'Aktif').length, icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
          { label: 'Total Unduhan', count: documents.reduce((acc, d) => acc + d.download_count, 0), icon: Download, color: 'text-amber-600 bg-amber-50' },
        ].map((item, index) => (
          <div key={index} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">{item.label}</span>
              <span className="text-lg font-bold text-slate-800">{item.count}</span>
            </div>
            <div className={`p-2.5 rounded-xl ${item.color}`}>
              <item.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Advanced Filter Control Bar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan judul, nomor SK, isi, atau label..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 text-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/10 focus:border-brand-emerald outline-none transition-all placeholder:text-slate-400 font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tag Quick Select */}
          <div className="flex items-center gap-1.5 self-start md:self-auto overflow-x-auto max-w-full pb-1 md:pb-0">
            <span className="text-slate-400 text-[10px] font-bold uppercase flex items-center gap-1">
              <Tag className="w-3 h-3" /> Label:
            </span>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="bg-slate-50 border border-slate-100 rounded-lg text-slate-700 py-1.5 px-2 text-xs outline-none focus:ring-1 focus:ring-brand-emerald font-semibold"
            >
              <option value="Semua">Semua Label</option>
              {allTags.map((t, idx) => (
                <option key={idx} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dropdowns for Categories and Statuses */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-50">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Filter Kategori:
          </span>
          
          {['Semua', 'SK Kepengurusan', 'AD/ART', 'Proposal & LPJ', 'Surat Resmi', 'Pedoman & Panduan', 'Dokumen Lainnya'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`py-1 px-3 text-xs font-semibold rounded-lg border transition-all ${
                selectedCategory === cat 
                  ? 'bg-brand-emerald text-white border-brand-emerald shadow-sm' 
                  : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}

          <span className="text-slate-300 mx-2 hidden md:inline">|</span>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-100 rounded-lg text-slate-700 py-1 px-2.5 text-xs outline-none font-semibold"
          >
            <option value="Semua">Semua Status</option>
            <option value="Aktif">Status: Aktif</option>
            <option value="Arsip">Status: Arsip</option>
            <option value="Ditinjau">Status: Ditinjau</option>
            <option value="Draf">Status: Draf</option>
          </select>
        </div>
      </div>

      {/* Document Records View */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-700">Tidak Ada Dokumen yang Ditemukan</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1 mx-auto">
            Gunakan kata kunci pencarian lain atau ubah pengaturan filter kategori untuk menemukan file organisasi.
          </p>
          {(searchQuery || selectedCategory !== 'Semua' || selectedStatus !== 'Semua' || selectedTag !== 'Semua') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Semua');
                setSelectedStatus('Semua');
                setSelectedTag('Semua');
              }}
              className="mt-4 text-xs text-brand-emerald hover:underline font-bold flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Bersihkan Filter Pencarian
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          {/* Table View for large screens, grid list for small screens */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-5">Nama Dokumen & Nomor</th>
                  <th className="py-4 px-5">Kategori</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5">Versi Terbaru</th>
                  <th className="py-4 px-5">Tanggal Diunggah</th>
                  <th className="py-4 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Name and Number */}
                    <td className="py-4 px-5 max-w-sm">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-500 mt-1">
                          <FileText className="w-5 h-5 text-brand-emerald" />
                        </div>
                        <div>
                          <button
                            onClick={() => { setSelectedDoc(doc); setIsDetailModalOpen(true); }}
                            className="font-bold text-slate-700 text-xs hover:text-brand-emerald text-left focus:outline-none"
                          >
                            {doc.title}
                          </button>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{doc.number}</p>
                          {doc.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {doc.tags.map((tag, idx) => (
                                <span key={idx} className="bg-slate-50 text-[9px] font-bold text-slate-500 py-0.5 px-1.5 rounded border border-slate-100">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-5 align-middle">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryColor(doc.category)}`}>
                        {doc.category}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-5 align-middle">
                      {canModify ? (
                        <select
                          value={doc.status}
                          onChange={(e) => handleQuickStatusChange(doc, e.target.value as Document['status'])}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border outline-none cursor-pointer ${getStatusColor(doc.status)}`}
                          title="Klik untuk mengubah status dokumen"
                        >
                          <option value="Aktif">Aktif</option>
                          <option value="Arsip">Arsip</option>
                          <option value="Ditinjau">Ditinjau</option>
                          <option value="Draf">Draf</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md border ${getStatusColor(doc.status)}`}>
                          {doc.status}
                        </span>
                      )}
                    </td>

                    {/* Version */}
                    <td className="py-4 px-5 align-middle">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-slate-100 text-slate-800 font-bold text-[10px] py-0.5 px-2 rounded-full border border-slate-200">
                          v{doc.versions[0]?.version || '1.0'}
                        </span>
                        {doc.versions.length > 1 && (
                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5">
                            <History className="w-3 h-3" /> {doc.versions.length} revisi
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Upload date */}
                    <td className="py-4 px-5 align-middle">
                      <div className="text-xs font-semibold text-slate-600">{doc.uploaded_at}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <User className="w-2.5 h-2.5" /> Oleh {doc.uploaded_by}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 align-middle text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          title="Lihat Detail & Riwayat Versi"
                          onClick={() => { setSelectedDoc(doc); setIsDetailModalOpen(true); }}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        <button
                          title="Unduh Berkas Terbaru"
                          onClick={() => handleDownload(doc)}
                          className="p-1.5 hover:bg-emerald-50 text-brand-emerald hover:text-emerald-700 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {canModify && (
                          <>
                            <button
                              title="Unggah Versi Baru (Revisi)"
                              onClick={() => openVersionModal(doc)}
                              className="p-1.5 hover:bg-purple-50 text-purple-600 hover:text-purple-800 rounded-lg transition-colors"
                            >
                              <History className="w-4 h-4" />
                            </button>
                            <button
                              title="Edit Metadata"
                              onClick={() => openEditModal(doc)}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              title="Hapus Dokumen"
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
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

          {/* Cards Layout for Mobile screens */}
          <div className="block md:hidden divide-y divide-slate-100">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${getCategoryColor(doc.category)}`}>
                      {doc.category}
                    </span>
                    <button
                      onClick={() => { setSelectedDoc(doc); setIsDetailModalOpen(true); }}
                      className="font-bold text-slate-700 text-xs text-left block hover:text-brand-emerald"
                    >
                      {doc.title}
                    </button>
                    <p className="text-[10px] text-slate-400 font-mono">{doc.number}</p>
                  </div>
                  <span className={`inline-flex text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${getStatusColor(doc.status)}`}>
                    {doc.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-700 block">v{doc.versions[0]?.version || '1.0'}</span>
                    <span className="text-[9px] text-slate-400">Terbaru ({doc.uploaded_at})</span>
                  </div>
                  <div>
                    <span className="font-semibold block">{doc.file_size}</span>
                    <span className="text-[9px] text-slate-400 font-mono block truncate max-w-[120px]">{doc.file_name}</span>
                  </div>
                  <div>
                    <span className="font-semibold block">{doc.download_count}x unduh</span>
                    <span className="text-[9px] text-slate-400 block">Unduhan</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1 pt-1">
                  <button
                    onClick={() => { setSelectedDoc(doc); setIsDetailModalOpen(true); }}
                    className="flex-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-600 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1"
                  >
                    <Info className="w-3.5 h-3.5" /> Detail
                  </button>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-brand-emerald border border-emerald-100 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Unduh
                  </button>
                  {canModify && (
                    <button
                      onClick={() => openVersionModal(doc)}
                      className="py-1.5 px-2.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-xl text-[11px] font-bold flex items-center justify-center"
                      title="Unggah Versi Baru"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: Create Document */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-xl shadow-xl overflow-hidden border border-slate-100"
            >
              {/* Header */}
              <div className="bg-brand-emerald text-white p-5 flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold flex items-center gap-1.5"><FileUp className="w-4 h-4" /> Unggah Dokumen Baru</h3>
                  <p className="text-[10px] text-emerald-100">Gunakan draf atau dokumen final bertipe PDF, DOCX, atau XLSX.</p>
                </div>
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg text-emerald-100 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreateDocument} className="p-6 space-y-4">
                
                {/* Method Switcher Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setInputMethod('file')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      inputMethod === 'file'
                        ? 'bg-white text-brand-emerald shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Unggah Berkas File
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMethod('manual')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      inputMethod === 'manual'
                        ? 'bg-white text-brand-emerald shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Input Manual & Link Cloud
                  </button>
                </div>

                {/* File Upload Zone OR Manual Fields */}
                {inputMethod === 'file' ? (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Unggah File / Berkas *</label>
                    
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                        dragActive 
                          ? 'border-brand-emerald bg-emerald-50/20' 
                          : simulatedFile 
                          ? 'border-emerald-200 bg-emerald-50/5' 
                          : 'border-slate-200 hover:border-brand-emerald bg-slate-50/50'
                      }`}
                    >
                      <input
                        type="file"
                        id="file-upload-input"
                        onChange={handleFileInput}
                        className="hidden"
                        accept=".pdf,.docx,.doc,.xlsx,.xls"
                      />

                      {simulatedFile ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="p-3 bg-emerald-50 text-brand-emerald rounded-xl">
                            <Check className="w-6 h-6" />
                          </div>
                          <div className="text-left">
                            <span className="text-xs font-bold text-slate-800 block truncate max-w-xs">{simulatedFile.name}</span>
                            <span className="text-[10px] text-slate-400 font-semibold">{simulatedFile.size} • Siap diunggah</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setSimulatedFile(null); setFormData(p => ({ ...p, file_name: '', file_size: '' })); }}
                            className="ml-auto p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label htmlFor="file-upload-input" className="cursor-pointer space-y-1.5 block">
                          <Upload className="w-7 h-7 text-slate-400 mx-auto" />
                          <span className="text-xs font-bold text-slate-600 block">Seret & taruh file di sini, atau <span className="text-brand-emerald underline">pilih file</span></span>
                          <span className="text-[10px] text-slate-400 block font-semibold">PDF, DOCX, atau XLSX (Maks. 10MB)</span>
                        </label>
                      )}
                    </div>
                    {validationErrors.file_name && (
                      <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {validationErrors.file_name}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 bg-emerald-50/30 border border-emerald-100 p-4 rounded-2xl">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Nama File / Judul Berkas</label>
                      <input
                        type="text"
                        name="file_name"
                        placeholder="Contoh: SK_Pengurus_MWC_2026.pdf"
                        value={formData.file_name}
                        onChange={handleInputChange}
                        className={getInputClass('file_name')}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Ukuran / Keterangan Berkas</label>
                        <input
                          type="text"
                          name="file_size"
                          placeholder="Contoh: 2.5 MB / Dokumen Cetak Fisik"
                          value={formData.file_size}
                          onChange={handleInputChange}
                          className={getInputClass('file_size')}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Link Cloud Drive / Lokasi Fisik</label>
                        <input
                          type="text"
                          name="file_url"
                          placeholder="https://drive.google.com/... atau Rak A-02"
                          value={formData.file_url}
                          onChange={handleInputChange}
                          className={getInputClass('file_url')}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Judul Dokumen *</label>
                    <input
                      type="text"
                      name="title"
                      placeholder="Contoh: SK Reshuffle Pengurus Ranting NU Godog"
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

                  {/* Document Number */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Nomor Dokumen / SK *</label>
                    <input
                      type="text"
                      name="number"
                      placeholder="Contoh: 042/A.II/04/MWC-KP/2026"
                      value={formData.number}
                      onChange={handleInputChange}
                      className={getInputClass('number')}
                    />
                    {validationErrors.number && (
                      <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {validationErrors.number}
                      </p>
                    )}
                  </div>

                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Kategori Dokumen *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={getInputClass('category', true)}
                    >
                      <option value="SK Kepengurusan">SK Kepengurusan</option>
                      <option value="AD/ART">AD/ART</option>
                      <option value="Proposal & LPJ">Proposal & LPJ</option>
                      <option value="Surat Resmi">Surat Resmi</option>
                      <option value="Pedoman & Panduan">Pedoman & Panduan</option>
                      <option value="Dokumen Lainnya">Dokumen Lainnya</option>
                    </select>
                    {validationErrors.category && (
                      <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {validationErrors.category}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Status Dokumen *</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className={getInputClass('status', true)}
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Arsip">Arsip</option>
                      <option value="Ditinjau">Ditinjau</option>
                      <option value="Draf">Draf</option>
                    </select>
                    {validationErrors.status && (
                      <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {validationErrors.status}
                      </p>
                    )}
                  </div>

                  {/* Tags (comma sep) */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Label / Tag (Pisahkan Koma)</label>
                    <input
                      type="text"
                      name="tagsString"
                      placeholder="SK, Ranting, 2026, Revisi"
                      value={formData.tagsString}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-brand-emerald focus:ring-emerald-500/10 rounded-xl py-2 px-3 text-xs outline-none transition-all font-medium text-slate-700 font-mono"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block font-sans">Deskripsi Ringkasan Dokumen</label>
                  <textarea
                    name="description"
                    rows={2}
                    placeholder="Tuliskan keterangan singkat, isi pokok, atau tujuan dibuatnya berkas regulasi ini..."
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-brand-emerald rounded-xl py-2 px-3 text-xs outline-none transition-all font-medium text-slate-700"
                  />
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="py-2 px-4 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 text-xs font-bold transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 bg-brand-emerald hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Simpan Dokumen
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Edit Metadata */}
      <AnimatePresence>
        {isEditModalOpen && selectedDoc && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-xl shadow-xl overflow-hidden border border-slate-100"
            >
              {/* Header */}
              <div className="bg-slate-800 text-white p-5 flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold flex items-center gap-1.5"><Edit className="w-4 h-4" /> Edit Informasi Dokumen</h3>
                  <p className="text-[10px] text-slate-300">Mengedit metadata dokumen tanpa mengganggu riwayat versi.</p>
                </div>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleEditDocument} className="p-6 space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Judul Dokumen *</label>
                    <input
                      type="text"
                      name="title"
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

                  {/* Document Number */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Nomor Dokumen / SK *</label>
                    <input
                      type="text"
                      name="number"
                      value={formData.number}
                      onChange={handleInputChange}
                      className={getInputClass('number')}
                    />
                    {validationErrors.number && (
                      <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {validationErrors.number}
                      </p>
                    )}
                  </div>

                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Kategori Dokumen *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={getInputClass('category', true)}
                    >
                      <option value="SK Kepengurusan">SK Kepengurusan</option>
                      <option value="AD/ART">AD/ART</option>
                      <option value="Proposal & LPJ">Proposal & LPJ</option>
                      <option value="Surat Resmi">Surat Resmi</option>
                      <option value="Pedoman & Panduan">Pedoman & Panduan</option>
                      <option value="Dokumen Lainnya">Dokumen Lainnya</option>
                    </select>
                    {validationErrors.category && (
                      <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {validationErrors.category}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Status Dokumen *</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className={getInputClass('status', true)}
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Arsip">Arsip</option>
                      <option value="Ditinjau">Ditinjau</option>
                      <option value="Draf">Draf</option>
                    </select>
                    {validationErrors.status && (
                      <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {validationErrors.status}
                      </p>
                    )}
                  </div>

                  {/* Tags (comma sep) */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Label / Tag (Pisahkan Koma)</label>
                    <input
                      type="text"
                      name="tagsString"
                      value={formData.tagsString}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-brand-emerald focus:ring-emerald-500/10 rounded-xl py-2 px-3 text-xs outline-none transition-all font-medium text-slate-700 font-mono"
                    />
                  </div>

                  {/* File URL / Cloud Link */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Link Cloud Drive / Tautan Berkas / Lokasi Fisik</label>
                    <input
                      type="text"
                      name="file_url"
                      placeholder="https://drive.google.com/... atau Lemari Arsip Rak A-02"
                      value={formData.file_url}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-brand-emerald focus:ring-emerald-500/10 rounded-xl py-2 px-3 text-xs outline-none transition-all font-medium text-slate-700"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Deskripsi Ringkasan Dokumen</label>
                  <textarea
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-brand-emerald rounded-xl py-2 px-3 text-xs outline-none transition-all font-medium text-slate-700"
                  />
                </div>

                {/* File Reference Info */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-2.5">
                  <Info className="w-4 h-4 text-slate-400 shrink-0" />
                  <p className="text-[10px] text-slate-500 leading-normal font-medium">
                    Pembaruan informasi ini tidak memodifikasi file <span className="font-mono text-slate-700 font-semibold">"{selectedDoc.file_name}"</span>. Untuk mengubah file fisik berkas, silakan gunakan menu <span className="font-bold text-purple-600">Unggah Versi Baru</span>.
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="py-2 px-4 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 text-xs font-bold transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Simpan Pembaruan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Upload New Version (Revision) */}
      <AnimatePresence>
        {isVersionModalOpen && selectedDoc && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-xl shadow-xl overflow-hidden border border-slate-100"
            >
              {/* Header */}
              <div className="bg-purple-700 text-white p-5 flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold flex items-center gap-1.5"><History className="w-4 h-4" /> Unggah Revisi / Versi Baru</h3>
                  <p className="text-[10px] text-purple-100">Menyimpan draf file baru untuk dokumen: <span className="font-bold underline">{selectedDoc.title}</span></p>
                </div>
                <button 
                  onClick={() => setIsVersionModalOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg text-purple-100 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleNewVersionSubmit} className="p-6 space-y-4">
                
                {/* Drag and Drop Zone for Revision */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Unggah Berkas Revisi Baru *</label>
                  
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                      dragActive 
                        ? 'border-purple-500 bg-purple-50/20' 
                        : simulatedFile 
                        ? 'border-purple-200 bg-purple-50/5' 
                        : 'border-slate-200 hover:border-purple-500 bg-slate-50/50'
                    }`}
                  >
                    <input
                      type="file"
                      id="version-file-input"
                      onChange={handleFileInput}
                      className="hidden"
                      accept=".pdf,.docx,.doc,.xlsx,.xls"
                    />

                    {simulatedFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                          <Check className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-bold text-slate-800 block truncate max-w-xs">{simulatedFile.name}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{simulatedFile.size} • Terpilih</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setSimulatedFile(null); setVersionForm(p => ({ ...p, file_name: '', file_size: '' })); }}
                          className="ml-auto p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label htmlFor="version-file-input" className="cursor-pointer space-y-1.5 block">
                        <Upload className="w-7 h-7 text-slate-400 mx-auto" />
                        <span className="text-xs font-bold text-slate-600 block">Tarik draf revisi di sini, atau <span className="text-purple-600 underline">pilih file</span></span>
                        <span className="text-[10px] text-slate-400 block font-semibold">PDF, DOCX, atau XLSX (Maks. 10MB)</span>
                      </label>
                    )}
                  </div>
                  {validationErrors.file_name && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {validationErrors.file_name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Version Number */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Nomor Versi Baru *</label>
                    <input
                      type="text"
                      name="version"
                      placeholder="Contoh: 1.2 atau 2.0"
                      value={versionForm.version}
                      onChange={handleVersionInputChange}
                      className={getInputClass('version')}
                    />
                    {validationErrors.version && (
                      <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {validationErrors.version}
                      </p>
                    )}
                    <span className="text-[9px] text-slate-400 leading-normal block">
                      Versi aktif saat ini: <span className="font-bold text-slate-600">v{selectedDoc.versions[0]?.version || '1.0'}</span>
                    </span>
                  </div>

                  {/* Status update shortcut */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Perbarui Status Dokumen</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className={getInputClass('status', true)}
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Arsip">Arsip</option>
                      <option value="Ditinjau">Ditinjau</option>
                      <option value="Draf">Draf</option>
                    </select>
                  </div>
                </div>

                {/* Notes/Changelog */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Catatan Perubahan (Changelog) *</label>
                  <textarea
                    name="notes"
                    rows={3}
                    placeholder="Tuliskan alasan perubahan, pasal apa saja yang direvisi, atau perbaikan draf..."
                    value={versionForm.notes}
                    onChange={handleVersionInputChange}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl py-2 px-3 text-xs outline-none transition-all font-medium text-slate-700"
                    required
                  />
                </div>

                {/* Alert Warning */}
                <div className="bg-purple-50 border border-purple-100 rounded-2xl p-3.5 flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-purple-900 block font-sans">Kontrol Versi Terbuka</span>
                    <p className="text-[9px] text-purple-700 leading-normal">
                      Mengunggah revisi baru akan memindahkan versi lama ke daftar histori secara otomatis. Anggota pengurus NU masih dapat melihat dan mengunduh versi-versi sebelumnya secara transparan.
                    </p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsVersionModalOpen(false)}
                    className="py-2 px-4 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 text-xs font-bold transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Simpan Versi Baru
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: Document Detail & Version History Timeline */}
      <AnimatePresence>
        {isDetailModalOpen && selectedDoc && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-2xl shadow-xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="bg-slate-50 border-b border-slate-100 p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getCategoryColor(selectedDoc.category)}`}>
                      {selectedDoc.category}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${getStatusColor(selectedDoc.status)}`}>
                      {selectedDoc.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 leading-tight">{selectedDoc.title}</h3>
                </div>
                <button 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                
                {/* Meta details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 border border-slate-100 p-4 rounded-2xl font-medium text-slate-600">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Nomor Dokumen</span>
                    <span className="font-mono text-slate-800 font-bold block mt-0.5">{selectedDoc.number}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Versi Berlaku</span>
                    <span className="text-slate-800 font-bold block mt-0.5">v{selectedDoc.versions[0]?.version || '1.0'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Nama Berkas</span>
                    <span className="text-slate-800 block mt-0.5 font-mono truncate" title={selectedDoc.file_name}>{selectedDoc.file_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Ukuran Berkas</span>
                    <span className="text-slate-800 font-semibold block mt-0.5">{selectedDoc.file_size}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Diunggah Pada</span>
                    <span className="text-slate-800 font-semibold block mt-0.5">{selectedDoc.uploaded_at}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Diunggah Oleh</span>
                    <span className="text-slate-800 font-semibold block mt-0.5">{selectedDoc.uploaded_by}</span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Deskripsi / Ringkasan Isi</h4>
                  <p className="text-slate-600 leading-relaxed font-medium bg-slate-50/40 p-3 rounded-xl border border-slate-100">
                    {selectedDoc.description || 'Tidak ada keterangan tambahan untuk dokumen ini.'}
                  </p>
                </div>

                {/* Label Tags */}
                {selectedDoc.tags.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Label Pencarian</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedDoc.tags.map((tag, idx) => (
                        <span key={idx} className="bg-slate-50 text-[10px] font-bold text-slate-600 py-1 px-2.5 rounded-lg border border-slate-100 flex items-center gap-1">
                          <Tag className="w-3 h-3 text-slate-400" /> {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Version History Timeline */}
                <div className="space-y-3.5">
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <History className="w-4 h-4 text-purple-600" /> Riwayat Perubahan & Kontrol Versi (Version History)
                  </h4>

                  <div className="relative border-l-2 border-slate-100 ml-3 pl-5 space-y-5">
                    {selectedDoc.versions.map((v, idx) => {
                      const isLatest = idx === 0;
                      return (
                        <div key={idx} className="relative">
                          {/* Timeline dot */}
                          <div className={`absolute -left-[27px] top-1 w-3 h-3 rounded-full border-2 ${
                            isLatest 
                              ? 'bg-brand-emerald border-emerald-200 ring-4 ring-emerald-500/10' 
                              : 'bg-slate-200 border-white'
                          }`} />

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-[10px] font-bold py-0.5 px-2 rounded-full border ${
                                isLatest 
                                  ? 'bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20' 
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                Versi {v.version} {isLatest && '(Terbaru)'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {v.updated_at}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                                <User className="w-3 h-3" /> {v.updated_by}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-[9px] font-mono text-slate-400 font-semibold">
                                {v.file_size}
                              </span>
                            </div>

                            <p className="text-slate-600 font-semibold text-xs leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-1">
                              {v.notes || 'Revisi regulasi organisasi.'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Footer / Actions panel */}
              <div className="bg-slate-50 border-t border-slate-100 p-5 flex flex-wrap items-center justify-between gap-3">
                <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" /> Total diunduh {selectedDoc.download_count} kali oleh pengurus
                </div>

                <div className="flex items-center gap-1.5 ml-auto">
                  {canModify && (
                    <>
                      <button
                        onClick={() => handleDeleteDocument(selectedDoc.id)}
                        className="py-2 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Hapus Dokumen Ini"
                      >
                        <Trash2 className="w-4 h-4" /> Hapus
                      </button>
                      <button
                        onClick={() => { setIsDetailModalOpen(false); openEditModal(selectedDoc); }}
                        className="py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit className="w-4 h-4 text-slate-400" /> Edit Metadata
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDownload(selectedDoc)}
                    className="py-2 px-4 bg-brand-emerald hover:bg-emerald-600 text-white rounded-xl font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {selectedDoc.file_url ? <ExternalLink className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                    {selectedDoc.file_url ? 'Buka Link / Drive' : 'Unduh Dokumen'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
