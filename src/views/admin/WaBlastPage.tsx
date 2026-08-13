/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Send, Users, MapPin, MessageSquare, History, Settings, Play, CheckCircle2, 
  XCircle, AlertCircle, RefreshCw, Eye, Info, Sparkles, Search, Filter, 
  Lock, Key, Check, Phone, HelpCircle, Loader2, ListFilter,
  MessageCircle, ExternalLink, Copy, X, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Contact {
  id: string | number;
  name: string;
  phone: string;
  ranting_name: string;
  role_name: string;
  type: 'Anggota' | 'Ranting' | 'Banom';
}

interface WaBlastLog {
  phone: string;
  name: string;
  status: 'Success' | 'Failed';
  error?: string;
  sent_at: string;
}

interface WaBlastCampaign {
  id: number;
  title: string;
  message_template: string;
  recipient_type: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  status: 'Draft' | 'Sending' | 'Completed' | 'Failed';
  logs: WaBlastLog[];
  created_at: string;
}

export default function WaBlastPage() {
  const { token } = useAuth();
  
  // Tabs: 'create' | 'history'
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  
  // Loading states
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sendingBlast, setSendingBlast] = useState(false);
  
  // Data lists
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [history, setHistory] = useState<WaBlastCampaign[]>([]);
  const [rantings, setRantings] = useState<any[]>([]);
  
  // Filter states
  const [recipientType, setRecipientType] = useState<'Anggota' | 'Ranting' | 'Banom' | 'Semua'>('Anggota');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRantingFilter, setSelectedRantingFilter] = useState('');
  
  // Selected contacts for blast
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string | number>>(new Set());
  
  // Campaign creator states
  const [campaignTitle, setCampaignTitle] = useState('');
  const [messageTemplate, setMessageTemplate] = useState(
    'Assalamu\'alaikum Wr. Wb.\n\nYth. Sahabat {nama},\n\nKami menginformasikan kegiatan rutin MWC NU Karangpawitan dari Ranting {ranting}.\nSemoga sehat wal \'afiat selalu.\n\nWallahul muwaffiq ila aqwamith thariq,\nWassalamu\'alaikum Wr. Wb.'
  );
  const [gatewayType, setGatewayType] = useState<'simulated' | 'fonnte'>('simulated');
  const [apiToken, setApiToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  
  // Sending progress UI states
  const [sendProgress, setSendProgress] = useState({
    total: 0,
    current: 0,
    success: 0,
    failed: 0,
    logs: [] as string[]
  });
  
  // Detail Modal states
  const [selectedCampaign, setSelectedCampaign] = useState<WaBlastCampaign | null>(null);
  
  // Direct WA Modal states
  const [directWaTarget, setDirectWaTarget] = useState<Contact | null>(null);
  const [directWaMessage, setDirectWaMessage] = useState('');
  const [sendingSingleWa, setSendingSingleWa] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Helper function to format Indonesian phone numbers to 62...
  const formatPhoneForWa = (phoneStr: string) => {
    if (!phoneStr) return '';
    let cleaned = phoneStr.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    } else if (cleaned.startsWith('8')) {
      cleaned = '62' + cleaned;
    }
    return cleaned;
  };

  const handleOpenDirectWaModal = (contact: Contact) => {
    const personalized = messageTemplate
      .replace(/{nama}/gi, contact.name)
      .replace(/{ranting}/gi, contact.ranting_name)
      .replace(/{jabatan}/gi, contact.role_name);

    setDirectWaTarget(contact);
    setDirectWaMessage(personalized);
    setCopiedMessage(false);
  };

  const handleLaunchWaWeb = () => {
    if (!directWaTarget) return;
    const formattedPhone = formatPhoneForWa(directWaTarget.phone);
    const encodedText = encodeURIComponent(directWaMessage);
    window.open(`https://wa.me/${formattedPhone}?text=${encodedText}`, '_blank');
  };

  const handleCopyDirectMessage = () => {
    navigator.clipboard.writeText(directWaMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const handleSendSingleViaGateway = async () => {
    if (!directWaTarget) return;
    setSendingSingleWa(true);
    try {
      const formattedPhone = formatPhoneForWa(directWaTarget.phone);
      const response = await fetch('/api/wablast/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          campaign_title: `Pengumuman WA Langsung: ${directWaTarget.name}`,
          message: directWaMessage,
          recipients: [
            {
              phone: formattedPhone,
              name: directWaTarget.name,
              ranting: directWaTarget.ranting_name,
              role: directWaTarget.role_name
            }
          ],
          gateway_type: gatewayType,
          api_token: apiToken
        })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        alert(`Pengumuman berhasil dikirim ke ${directWaTarget.name} (${directWaTarget.phone})!`);
        setDirectWaTarget(null);
      } else {
        alert(result.message || 'Gagal mengirim pengumuman via gateway.');
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan saat mengirim WA.');
    } finally {
      setSendingSingleWa(false);
    }
  };
  
  // Load data on mount / change
  const loadContactsData = async () => {
    setLoadingContacts(true);
    try {
      // 1. Fetch Sensus Members
      const sensusRes = await fetch('/api/sensus', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const sensusData = sensusRes.ok ? await sensusRes.json() : { data: [] };
      
      // 2. Fetch Rantings
      const rantingRes = await fetch('/api/rantings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const rantingData = rantingRes.ok ? await rantingRes.json() : { data: [] };
      setRantings(rantingData.data || []);

      // Build integrated contact list
      const list: Contact[] = [];
      
      // Add approved members with phone
      if (sensusData.data) {
        sensusData.data.forEach((m: any) => {
          if (m.phone) {
            list.push({
              id: `anggota-${m.id}`,
              name: m.name,
              phone: m.phone,
              ranting_name: m.ranting_name || 'Tingkat MWC',
              role_name: m.banom_name || 'Anggota',
              type: 'Anggota'
            });
          }
        });
      }
      
      // Add Ranting leaders/secretaries
      if (rantingData.data) {
        rantingData.data.forEach((r: any) => {
          if (r.contact_no) {
            list.push({
              id: `ranting-${r.id}-leader`,
              name: r.leader_name || `Ketua ${r.name}`,
              phone: r.contact_no,
              ranting_name: r.name,
              role_name: 'Ketua Ranting',
              type: 'Ranting'
            });
          }
        });
      }

      setContacts(list);
    } catch (err) {
      console.error('Gagal memuat kontak:', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const loadHistoryData = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/wa-blasts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setHistory(result.data || []);
      }
    } catch (err) {
      console.error('Gagal memuat riwayat blast:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadContactsData();
    loadHistoryData();
  }, [token]);

  // Filter contacts based on criteria
  const filteredContacts = contacts.filter(contact => {
    // Type filter
    if (recipientType !== 'Semua' && contact.type !== recipientType) {
      return false;
    }
    // Ranting filter
    if (selectedRantingFilter && contact.ranting_name !== selectedRantingFilter) {
      return false;
    }
    // Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return contact.name.toLowerCase().includes(q) || contact.phone.includes(q) || contact.role_name.toLowerCase().includes(q);
    }
    return true;
  });

  // Select/unselect all filtered
  const handleSelectAllFiltered = () => {
    const newSelected = new Set(selectedContactIds);
    const allFilteredSelected = filteredContacts.every(c => selectedContactIds.has(c.id));

    if (allFilteredSelected) {
      // Unselect all in current filtered list
      filteredContacts.forEach(c => newSelected.delete(c.id));
    } else {
      // Select all in current filtered list
      filteredContacts.forEach(c => newSelected.add(c.id));
    }
    setSelectedContactIds(newSelected);
  };

  const handleToggleSelect = (id: string | number) => {
    const newSelected = new Set(selectedContactIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedContactIds(newSelected);
  };

  // Get active personalized preview
  const getPersonalizedPreview = () => {
    if (filteredContacts.length === 0) return 'Belum ada kontak yang sesuai filter.';
    
    // Use first selected contact, or first filtered contact
    const activeContact = contacts.find(c => selectedContactIds.has(c.id)) || filteredContacts[0];
    
    return messageTemplate
      .replace(/{nama}/gi, activeContact.name)
      .replace(/{ranting}/gi, activeContact.ranting_name)
      .replace(/{jabatan}/gi, activeContact.role_name)
      .replace(/{role}/gi, activeContact.role_name);
  };

  // Insert tag helper
  const insertTag = (tag: string) => {
    setMessageTemplate(prev => prev + tag);
  };

  // Trigger campaign blast sending
  const handleSendBlast = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!campaignTitle.trim()) {
      alert('Mohon isi Judul Blast / Campaign.');
      return;
    }

    if (selectedContactIds.size === 0) {
      alert('Pilih setidaknya satu kontak penerima.');
      return;
    }

    if (gatewayType === 'fonnte' && !apiToken) {
      alert('API Token Fonnte wajib diisi jika menggunakan gateway Fonnte.');
      return;
    }

    const selectedRecipients = contacts.filter(c => selectedContactIds.has(c.id));
    
    setSendingBlast(true);
    setSendProgress({
      total: selectedRecipients.length,
      current: 0,
      success: 0,
      failed: 0,
      logs: [`[${new Date().toLocaleTimeString()}] Memulai persiapan pengiriman...`]
    });

    // We send in small batches to simulate/stream progress in the UI nicely!
    const batchSize = 1; // Send one-by-one to update logs
    let successCount = 0;
    let failedCount = 0;
    const finalLogs: any[] = [];

    for (let i = 0; i < selectedRecipients.length; i++) {
      const recipient = selectedRecipients[i];
      setSendProgress(prev => ({
        ...prev,
        current: i + 1,
        logs: [
          ...prev.logs, 
          `[${new Date().toLocaleTimeString()}] Mengirim ke ${recipient.name} (${recipient.phone})...`
        ]
      }));

      // Post individual or batch to backend
      try {
        const response = await fetch('/api/wa-blasts/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: `${campaignTitle} - Part ${i + 1}`,
            message_template: messageTemplate,
            recipient_type: recipientType,
            recipients: [recipient],
            gateway_type: gatewayType,
            api_token: gatewayType === 'fonnte' ? apiToken : undefined
          })
        });

        const result = await response.json();
        
        if (response.ok && result.success) {
          const sentLog = result.data.logs[0];
          if (sentLog.status === 'Success') {
            successCount++;
            setSendProgress(prev => ({
              ...prev,
              success: successCount,
              logs: [...prev.logs, `✔️ Sukses: Terkirim ke ${recipient.name}`]
            }));
          } else {
            failedCount++;
            setSendProgress(prev => ({
              ...prev,
              failed: failedCount,
              logs: [...prev.logs, `❌ Gagal: ${recipient.name} (${sentLog.error || 'Unknown Error'})`]
            }));
          }
        } else {
          failedCount++;
          setSendProgress(prev => ({
            ...prev,
            failed: failedCount,
            logs: [...prev.logs, `❌ Gagal: Kesalahan respon server untuk ${recipient.name}`]
          }));
        }
      } catch (err: any) {
        failedCount++;
        setSendProgress(prev => ({
          ...prev,
          failed: failedCount,
          logs: [...prev.logs, `❌ Gagal: ${err.message || 'Koneksi terputus'}`]
        }));
      }

      // Brief delay to simulate gateway intervals and make progress readable
      await new Promise(resolve => setTimeout(resolve, gatewayType === 'fonnte' ? 800 : 400));
    }

    setSendProgress(prev => ({
      ...prev,
      logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] Campaign selesai diproses.`]
    }));

    alert(`Blast Selesai!\nBerhasil: ${successCount}\nGagal: ${failedCount}`);
    
    // Clear and reload
    setCampaignTitle('');
    setSelectedContactIds(new Set());
    setSendingBlast(false);
    loadHistoryData();
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-150 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="bg-emerald-50 text-brand-emerald p-2 rounded-xl inline-block border border-emerald-100">
              <Send className="w-5 h-5" />
            </span>
            Kirim WhatsApp Blast
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kirim pesan massal (WA Blast) secara personal menggunakan variabel dinamis ke pengurus Ranting, Banom, dan Sensus Anggota.
          </p>
        </div>
        
        {/* TABS SELECTOR */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'create' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Blast Baru
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'history' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Riwayat Blast ({history.length})
          </button>
        </div>
      </div>

      {/* RENDER VIEW TAB */}
      <AnimatePresence mode="wait">
        {activeTab === 'create' ? (
          <motion.div
            key="create-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* LEFT 2 COLS: CONTACT SELECTION & COMPOSER */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* PANEL 1: RECIPIENTS SELECTION */}
              <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-brand-emerald" />
                    Langkah 1: Pilih Penerima Pesan ({selectedContactIds.size} dipilih)
                  </h3>
                  <button 
                    type="button"
                    onClick={loadContactsData}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                    title="Refresh Kontak"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingContacts ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {/* FILTERING BAR */}
                <div className="flex flex-col lg:flex-row flex-wrap gap-4 items-stretch lg:items-end">
                  {/* Recipient Type */}
                  <div className="flex-grow md:flex-1 min-w-[240px] space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kategori Penerima</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {(['Anggota', 'Ranting', 'Semua'] as const).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setRecipientType(type);
                            setSelectedContactIds(new Set()); // Reset selections on type change
                          }}
                          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
                            recipientType === type 
                              ? 'bg-emerald-50 border-brand-emerald text-brand-emerald shadow-xs' 
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                          }`}
                        >
                          {type === 'Anggota' ? 'Warga/Sensus' : type === 'Ranting' ? 'Ranting' : 'Semua'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ranting Filter */}
                  <div className="flex-grow md:flex-initial md:w-56 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filter Ranting Domisili</label>
                    <div className="relative">
                      <select
                        value={selectedRantingFilter}
                        onChange={(e) => setSelectedRantingFilter(e.target.value)}
                        className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-emerald appearance-none cursor-pointer"
                      >
                        <option value="">Semua Desa / Ranting</option>
                        {rantings.map(r => (
                          <option key={r.id} value={r.name}>{r.name}</option>
                        ))}
                      </select>
                      <span className="absolute right-2.5 top-3.5 pointer-events-none">
                        <ListFilter className="w-3.5 h-3.5 text-slate-400" />
                      </span>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="flex-grow md:flex-1 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cari Nama / No. WA</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ketik nama atau nomor..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-brand-emerald"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                    </div>
                  </div>
                </div>

                {/* CONTACT TABLE/LIST CONTAINER */}
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  {loadingContacts ? (
                    <div className="p-12 text-center text-slate-400 space-y-2">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-emerald" />
                      <p className="text-xs font-medium">Memuat daftar kontak aktif...</p>
                    </div>
                  ) : filteredContacts.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                      <AlertCircle className="w-6 h-6 mx-auto text-slate-300 mb-1" />
                      <p className="text-xs font-semibold">Tidak ditemukan kontak yang terdaftar.</p>
                      <p className="text-[10px] mt-0.5">Coba ubah kriteria pencarian atau filter Anda.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-2.5 px-4 w-12 text-center">
                            <input
                              type="checkbox"
                              checked={filteredContacts.length > 0 && filteredContacts.every(c => selectedContactIds.has(c.id))}
                              onChange={handleSelectAllFiltered}
                              className="w-3.5 h-3.5 rounded border-slate-300 text-brand-emerald focus:ring-brand-emerald cursor-pointer"
                            />
                          </th>
                          <th className="py-2.5 px-4">Nama Lengkap</th>
                          <th className="py-2.5 px-4">Nomor WhatsApp</th>
                          <th className="py-2.5 px-4">Domisili Ranting</th>
                          <th className="py-2.5 px-4">Jabatan/Asosiasi</th>
                          <th className="py-2.5 px-4 text-center">Kirim Pengumuman WA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                        {filteredContacts.map(contact => {
                          const isSelected = selectedContactIds.has(contact.id);
                          return (
                            <tr 
                              key={contact.id}
                              onClick={() => handleToggleSelect(contact.id)}
                              className={`hover:bg-slate-50 cursor-pointer transition-all ${
                                isSelected ? 'bg-emerald-50/50' : ''
                              }`}
                            >
                              <td className="py-2 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelect(contact.id)}
                                  className="w-3.5 h-3.5 rounded border-slate-300 text-brand-emerald focus:ring-brand-emerald cursor-pointer"
                                />
                              </td>
                              <td className="py-2 px-4 font-bold text-slate-950 flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  contact.type === 'Anggota' ? 'bg-indigo-500' : 'bg-emerald-500'
                                }`} />
                                {contact.name}
                              </td>
                              <td className="py-2 px-4 font-mono text-slate-600 flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {contact.phone}
                              </td>
                              <td className="py-2 px-4 text-slate-500">{contact.ranting_name}</td>
                              <td className="py-2 px-4">
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  contact.type === 'Ranting' 
                                    ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {contact.role_name}
                                </span>
                              </td>
                              <td className="py-2 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDirectWaModal(contact)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-extrabold shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
                                    title={`Kirim Pengumuman WA Langsung ke ${contact.name}`}
                                  >
                                    <MessageCircle className="w-3.5 h-3.5 text-emerald-100" />
                                    <span>Kirim WA</span>
                                  </button>
                                  <a
                                    href={`https://wa.me/${formatPhoneForWa(contact.phone)}?text=${encodeURIComponent(
                                      messageTemplate
                                        .replace(/{nama}/gi, contact.name)
                                        .replace(/{ranting}/gi, contact.ranting_name)
                                        .replace(/{jabatan}/gi, contact.role_name)
                                    )}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                                    title="Buka Langsung di WA Web/App"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                  <p>Menampilkan {filteredContacts.length} dari {contacts.length} total kontak.</p>
                  <p className="bg-brand-emerald/10 text-brand-emerald px-2 py-1 rounded-md font-bold">
                    {selectedContactIds.size} Kontak Dipilih
                  </p>
                </div>
              </div>

              {/* PANEL 2: COMPOSE MESSAGE */}
              <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <MessageSquare className="w-4 h-4 text-brand-emerald" />
                  Langkah 2: Tulis Isi Pesan (Template Dinamis)
                </h3>

                {/* PLACEHOLDER SHORTCUTS */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Klik untuk memasukkan variabel dinamis:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => insertTag('{nama}')}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-extrabold rounded-lg border border-slate-200 cursor-pointer flex items-center gap-1 transition-all"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      {'{nama}'} <span className="text-[9px] text-slate-400 font-medium">(Nama Penerima)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTag('{ranting}')}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-extrabold rounded-lg border border-slate-200 cursor-pointer flex items-center gap-1 transition-all"
                    >
                      <MapPin className="w-3 h-3 text-emerald-500" />
                      {'{ranting}'} <span className="text-[9px] text-slate-400 font-medium">(Nama Ranting)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTag('{jabatan}')}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-extrabold rounded-lg border border-slate-200 cursor-pointer flex items-center gap-1 transition-all"
                    >
                      <Users className="w-3 h-3 text-indigo-500" />
                      {'{jabatan}'} <span className="text-[9px] text-slate-400 font-medium">(Jabatan/Banom)</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Isi Pesan WA Blast</label>
                  <textarea
                    rows={8}
                    value={messageTemplate}
                    onChange={(e) => setMessageTemplate(e.target.value)}
                    className="w-full text-xs font-semibold p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-emerald font-sans"
                    placeholder="Tulis pesan Anda disini..."
                  />
                  <div className="text-[10px] text-slate-400 font-medium flex justify-between">
                    <span>* Karakter template pesan bersifat dinamis.</span>
                    <span>{messageTemplate.length} karakter</span>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: CONFIGURATION & PREVIEW */}
            <div className="space-y-6">
              
              {/* WHATSAPP REAL LIVE CHAT PREVIEW BUBBLE */}
              <div className="bg-gradient-to-b from-teal-800 to-emerald-950 rounded-2xl border border-slate-150 p-5 shadow-md text-white relative overflow-hidden h-[330px] flex flex-col justify-between">
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                
                {/* Simulated Chat Header */}
                <div className="flex items-center gap-2 border-b border-white/10 pb-2.5 z-10 relative">
                  <div className="w-8 h-8 rounded-full bg-emerald-700/60 flex items-center justify-center font-bold text-xs text-white uppercase border border-white/20">
                    WA
                  </div>
                  <div className="text-left">
                    <h4 className="text-[11px] font-extrabold leading-tight">Preview WA Penerima</h4>
                    <p className="text-[9px] text-emerald-200 font-medium">Status: Online</p>
                  </div>
                </div>

                {/* Simulated Chat Bubble */}
                <div className="flex-grow flex items-end justify-start py-4 overflow-y-auto z-10 relative pr-4">
                  <div className="bg-white text-slate-900 rounded-2xl rounded-tl-none p-3 max-w-[90%] text-[10px] font-medium leading-relaxed shadow-md text-left relative">
                    <pre className="whitespace-pre-wrap font-sans text-[10.5px] font-medium leading-relaxed break-words">{getPersonalizedPreview()}</pre>
                    <span className="absolute bottom-1 right-2 text-[8px] text-slate-400 font-semibold">
                      {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Visual Accent Footer */}
                <div className="bg-emerald-900/60 rounded-xl p-2.5 text-center text-[9px] font-bold text-emerald-200/80 border border-emerald-800 z-10">
                  ⚡ Menyesuaikan otomatis per nama & ranting penerima
                </div>
              </div>

              {/* PANEL 4: CAMPAIGN CONFIG & SEND ACTOR */}
              <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Settings className="w-4 h-4 text-brand-emerald" />
                  Langkah 3: Jalankan Campaign WA Blast
                </h3>

                <form onSubmit={handleSendBlast} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Judul Campaign</label>
                    <input
                      type="text"
                      placeholder="e.g. Undangan Lailatul Ijtima"
                      value={campaignTitle}
                      onChange={(e) => setCampaignTitle(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-emerald"
                      required
                    />
                  </div>

                  {/* GATEWAY SELECTOR */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">WhatsApp Gateway</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setGatewayType('simulated')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          gatewayType === 'simulated'
                            ? 'bg-emerald-50/50 border-brand-emerald text-slate-900 ring-1 ring-brand-emerald'
                            : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <h4 className="text-[10px] font-bold">Simulasi Gateway</h4>
                        <p className="text-[8px] text-slate-400 font-semibold mt-0.5">Uji coba instan tanpa token</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setGatewayType('fonnte')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          gatewayType === 'fonnte'
                            ? 'bg-emerald-50/50 border-brand-emerald text-slate-900 ring-1 ring-brand-emerald'
                            : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <h4 className="text-[10px] font-bold">Fonnte API Gateway</h4>
                        <p className="text-[8px] text-slate-400 font-semibold mt-0.5">Kirim asli otomatis & real</p>
                      </button>
                    </div>
                  </div>

                  {/* API TOKEN KEY (Fonnte) */}
                  {gatewayType === 'fonnte' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Fonnte API Token</label>
                        <button
                          type="button"
                          onClick={() => setShowToken(!showToken)}
                          className="text-[10px] font-bold text-brand-emerald hover:underline cursor-pointer"
                        >
                          {showToken ? 'Sembunyikan' : 'Tampilkan'}
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showToken ? 'text' : 'password'}
                          placeholder="Masukkan Fonnte API Token Anda"
                          value={apiToken}
                          onChange={(e) => setApiToken(e.target.value)}
                          className="w-full text-xs font-semibold pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-emerald font-mono"
                        />
                        <Key className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3.5" />
                      </div>
                      <p className="text-[8px] text-slate-400 font-semibold">
                        * Token Anda diproses aman melalui server internal dan tidak pernah terekspos di browser web.
                      </p>
                    </motion.div>
                  )}

                  {/* TRIGGER BUTTON */}
                  <button
                    type="submit"
                    disabled={sendingBlast || selectedContactIds.size === 0}
                    className="w-full bg-brand-emerald hover:bg-emerald-700 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md shadow-emerald-900/10 cursor-pointer transition-all flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
                  >
                    {sendingBlast ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sedang Mengirim WA Blast...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Mulai Kirim WA Blast ({selectedContactIds.size} Penerima)
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* REAL-TIME PROGRESS TERMINAL LOG BUBBLE */}
              {sendingBlast && (
                <div className="bg-slate-950 text-emerald-400 font-mono p-4 rounded-2xl shadow-lg border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      STATUS LOGS PENGIRIMAN
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {sendProgress.current} / {sendProgress.total}
                    </span>
                  </div>

                  {/* Progress statistics */}
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <div>
                      <p className="text-slate-400 font-bold">TERKIRIM</p>
                      <p className="text-emerald-400 font-black text-xs">{sendProgress.success}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold">GAGAL</p>
                      <p className="text-red-400 font-black text-xs">{sendProgress.failed}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold">SISA</p>
                      <p className="text-slate-200 font-black text-xs">{sendProgress.total - sendProgress.current}</p>
                    </div>
                  </div>

                  {/* Console scroll stream */}
                  <div className="max-h-24 overflow-y-auto space-y-1 text-[9px] scrollbar-thin select-none">
                    {sendProgress.logs.map((log, idx) => (
                      <p key={idx} className="leading-relaxed font-mono">{log}</p>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        ) : (
          /* RIWAYAT BLAST TAB */
          <motion.div
            key="history-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl border border-slate-150 p-6 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-brand-emerald" />
                Daftar Riwayat Campaign WhatsApp Blast yang Terkirim
              </h3>
              <button 
                type="button"
                onClick={loadHistoryData}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                title="Refresh Riwayat"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              {loadingHistory ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-emerald" />
                  <p className="text-xs font-medium">Memuat riwayat campaign...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <AlertCircle className="w-6 h-6 mx-auto text-slate-300 mb-1" />
                  <p className="text-xs font-semibold">Belum ada riwayat WA Blast.</p>
                  <p className="text-[10px] mt-0.5">Jalankan campaign pertama Anda di tab 'Blast Baru'.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-4 w-12 text-center">No</th>
                      <th className="py-2.5 px-4">Nama Campaign / Judul</th>
                      <th className="py-2.5 px-4">Tanggal Pengiriman</th>
                      <th className="py-2.5 px-4">Tipe Penerima</th>
                      <th className="py-2.5 px-4 text-center">Total Penerima</th>
                      <th className="py-2.5 px-4 text-center">Berhasil</th>
                      <th className="py-2.5 px-4 text-center">Gagal</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                      <th className="py-2.5 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {history.map((campaign, idx) => (
                      <tr key={campaign.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{campaign.title}</td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(campaign.created_at).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                            {campaign.recipient_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-850">{campaign.total_recipients}</td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-600 bg-emerald-50/20">{campaign.sent_count}</td>
                        <td className="py-3 px-4 text-center font-bold text-red-600 bg-red-50/20">{campaign.failed_count}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide border ${
                            campaign.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : campaign.status === 'Sending'
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : 'bg-red-50 text-red-700 border-red-100'
                          }`}>
                            {campaign.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedCampaign(campaign)}
                            className="inline-flex items-center gap-1 bg-brand-gold hover:bg-amber-600 text-white font-extrabold text-[10px] py-1.5 px-3 rounded-lg shadow-sm cursor-pointer transition-all"
                          >
                            <Eye className="w-3 h-3" />
                            Log Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DETAIL LOG MODAL POPUP */}
      <AnimatePresence>
        {selectedCampaign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCampaign(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Content box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl border border-slate-150 w-full max-w-2xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-950 to-brand-emerald text-white p-5 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider block">LOG DETAIL BLAST</span>
                  <h4 className="font-extrabold text-sm">{selectedCampaign.title}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCampaign(null)}
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-xl text-white transition-all cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Info Stats Row */}
              <div className="grid grid-cols-4 divide-x divide-slate-150 border-b border-slate-150 bg-slate-50 text-center p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                <div>
                  <p className="text-[9px]">TOTAL</p>
                  <p className="text-slate-950 text-xs font-black">{selectedCampaign.total_recipients}</p>
                </div>
                <div>
                  <p className="text-emerald-600">SUKSES</p>
                  <p className="text-emerald-700 text-xs font-black">{selectedCampaign.sent_count}</p>
                </div>
                <div>
                  <p className="text-red-600">GAGAL</p>
                  <p className="text-red-700 text-xs font-black">{selectedCampaign.failed_count}</p>
                </div>
                <div>
                  <p className="text-slate-400">TANGGAL</p>
                  <p className="text-slate-700 text-[9px] font-bold">
                    {new Date(selectedCampaign.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>

              {/* Template preview box */}
              <div className="p-4 bg-slate-100 border-b border-slate-150 text-[10px] text-slate-600">
                <span className="font-bold text-slate-800 block mb-1">Template Pesan:</span>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 whitespace-pre-wrap font-mono leading-relaxed max-h-24 overflow-y-auto">
                  {selectedCampaign.message_template}
                </div>
              </div>

              {/* Logs Table Area */}
              <div className="flex-grow overflow-y-auto p-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2 px-3">No</th>
                      <th className="py-2 px-3">Penerima</th>
                      <th className="py-2 px-3">Nomor WA</th>
                      <th className="py-2 px-3">Waktu Send</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Detail Eror</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px] font-medium text-slate-700">
                    {selectedCampaign.logs.map((log, logIdx) => (
                      <tr key={logIdx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-400 font-bold">{logIdx + 1}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{log.name}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{log.phone}</td>
                        <td className="py-2 px-3 text-slate-400">
                          {new Date(log.sent_at).toLocaleTimeString('id-ID')}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                            log.status === 'Success'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {log.status === 'Success' ? 'SUKSES' : 'GAGAL'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-red-600 font-bold max-w-xs truncate" title={log.error}>
                          {log.error || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="bg-slate-50 border-t border-slate-150 p-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedCampaign(null)}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs py-2 px-5 rounded-lg transition-all cursor-pointer"
                >
                  Tutup Log
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DIRECT WA ANNOUNCEMENT MODAL */}
      <AnimatePresence>
        {directWaTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDirectWaTarget(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Content box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg overflow-hidden shadow-2xl relative z-10 flex flex-col"
            >
              {/* Header */}
              <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-emerald-300" />
                  <div>
                    <h3 className="font-extrabold text-sm">Kirim Pengumuman WA Langsung</h3>
                    <p className="text-[10px] text-emerald-200">Kirim pesan khusus ke nomor terdaftar</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDirectWaTarget(null)}
                  className="p-1 hover:bg-emerald-700 rounded-lg transition-colors text-emerald-200 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 text-left">
                {/* Recipient Details Card */}
                <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Penerima Pesan:</span>
                    <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span>{directWaTarget.name}</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-md font-bold">
                        {directWaTarget.role_name}
                      </span>
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Ranting: <span className="font-semibold text-slate-700">{directWaTarget.ranting_name}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nomor WhatsApp:</span>
                    <p className="font-mono font-bold text-emerald-700 text-sm flex items-center gap-1 justify-end">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{directWaTarget.phone}</span>
                    </p>
                  </div>
                </div>

                {/* Message Editor / Preview */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Isi Pengumuman (Terpersonalisasi):
                    </label>
                    <button
                      type="button"
                      onClick={handleCopyDirectMessage}
                      className="text-[10px] font-bold text-brand-emerald hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedMessage ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedMessage ? 'Tersalin!' : 'Salin Pesan'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={7}
                    value={directWaMessage}
                    onChange={(e) => setDirectWaMessage(e.target.value)}
                    className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-emerald font-sans leading-relaxed"
                    placeholder="Tulis pengumuman..."
                  />
                </div>

                {/* Delivery Options */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Metode Pengiriman WA:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleLaunchWaWeb}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer active:scale-98"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Buka WhatsApp (Web/App)</span>
                    </button>

                    <button
                      type="button"
                      disabled={sendingSingleWa}
                      onClick={handleSendSingleViaGateway}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {sendingSingleWa ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 text-emerald-400" />
                      )}
                      <span>{sendingSingleWa ? 'Mengirim...' : 'Kirim Server Gateway'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
