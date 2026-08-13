import React, { useState, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Save, Landmark, Plus, Trash2, Image, ShieldAlert, Users, 
  UserCheck, Award, Sparkles, HelpCircle, ArrowLeft, Upload, RefreshCw,
  Cloud, Database, CheckCircle2, AlertTriangle, Share2, Globe, MessageCircle, Video, Phone, Camera, User
} from 'lucide-react';

export default function SettingsPage() {
  const { settings, reloadSettings } = useSettings();
  const { successToast, errorToast } = useToast();
  const { token, user } = useAuth();

  const [activeTab, setActiveTab] = useState<'identity' | 'social_media' | 'leadership_photos' | 'mustasyar' | 'syuriah' | 'tanfidziyah' | 'firebase'>('identity');
  const [saving, setSaving] = useState(false);
  
  // Local state for settings form
  const [mwcName, setMwcName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // Leadership photos state
  const [leadershipPhotos, setLeadershipPhotos] = useState({
    rois_photo_url: '',
    katib_photo_url: '',
    ketua_photo_url: '',
    sekretaris_photo_url: ''
  });
  const [uploadingRole, setUploadingRole] = useState<string | null>(null);

  // Social Media state
  const [socialMedia, setSocialMedia] = useState({
    facebook: '',
    instagram: '',
    youtube: '',
    tiktok: '',
    whatsapp: '',
    website: ''
  });

  // Local state for structure list editors
  const [mustasyar, setMustasyar] = useState<string[]>([]);
  const [newMustasyar, setNewMustasyar] = useState('');

  // Syuriah states
  const [syuriahRais, setSyuriahRais] = useState('');
  const [syuriahWakilRais, setSyuriahWakilRais] = useState<string[]>([]);
  const [newWakilRais, setNewWakilRais] = useState('');
  const [syuriahKatib, setSyuriahKatib] = useState('');
  const [syuriahWakilKatib, setSyuriahWakilKatib] = useState<string[]>([]);
  const [newWakilKatib, setNewWakilKatib] = useState('');
  const [syuriahAWan, setSyuriahAWan] = useState<string[]>([]);
  const [newAWan, setNewAWan] = useState('');

  // Tanfidziyah states
  const [tanfidziyahKetua, setTanfidziyahKetua] = useState('');
  const [tanfidziyahWakilKetua, setTanfidziyahWakilKetua] = useState<string[]>([]);
  const [newWakilKetua, setNewWakilKetua] = useState('');
  const [tanfidziyahSekretaris, setTanfidziyahSekretaris] = useState('');
  const [tanfidziyahWakilSekretaris, setTanfidziyahWakilSekretaris] = useState<string[]>([]);
  const [newWakilSekretaris, setNewWakilSekretaris] = useState('');
  const [tanfidziyahBendahara, setTanfidziyahBendahara] = useState('');
  const [tanfidziyahWakilBendahara, setTanfidziyahWakilBendahara] = useState<string[]>([]);
  const [newWakilBendahara, setNewWakilBendahara] = useState('');

  // Fill in form states once settings load
  useEffect(() => {
    if (settings) {
      setMwcName(settings.name || '');
      setLogoUrl(settings.logo_url || '');
      
      const struct = settings.structure || {};
      setMustasyar(struct.mustasyar || []);
      
      const syuriah = struct.syuriah || {};
      setSyuriahRais(syuriah.rais || '');
      setSyuriahWakilRais(syuriah.wakil_rais || []);
      setSyuriahKatib(syuriah.katib || '');
      setSyuriahWakilKatib(syuriah.wakil_katib || []);
      setSyuriahAWan(syuriah.a_wan || []);

      const tanfidziyah = struct.tanfidziyah || {};
      setTanfidziyahKetua(tanfidziyah.ketua || '');
      setTanfidziyahWakilKetua(tanfidziyah.wakil_ketua || []);
      setTanfidziyahSekretaris(tanfidziyah.sekretaris || '');
      setTanfidziyahWakilSekretaris(tanfidziyah.wakil_sekretaris || []);
      setTanfidziyahBendahara(tanfidziyah.bendahara || '');
      setTanfidziyahWakilBendahara(tanfidziyah.wakil_bendahara || []);

      if (settings.social_media) {
        setSocialMedia({
          facebook: settings.social_media.facebook || '',
          instagram: settings.social_media.instagram || '',
          youtube: settings.social_media.youtube || '',
          tiktok: settings.social_media.tiktok || '',
          whatsapp: settings.social_media.whatsapp || '',
          website: settings.social_media.website || ''
        });
      }

      if (settings.leadership_photos) {
        setLeadershipPhotos({
          rois_photo_url: settings.leadership_photos.rois_photo_url || '',
          katib_photo_url: settings.leadership_photos.katib_photo_url || '',
          ketua_photo_url: settings.leadership_photos.ketua_photo_url || '',
          sekretaris_photo_url: settings.leadership_photos.sekretaris_photo_url || ''
        });
      }
    }
  }, [settings]);

  // Firebase Integration State
  const [firebaseStatus, setFirebaseStatus] = useState<any>(null);
  const [checkingFirebase, setCheckingFirebase] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const fetchFirebaseStatus = async () => {
    setCheckingFirebase(true);
    try {
      const response = await fetch('/api/firebase/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setFirebaseStatus(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch Firebase status:', err);
    } finally {
      setCheckingFirebase(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFirebaseStatus();
    }
  }, [token]);

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      const response = await fetch('/api/firebase/backup', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        successToast(result.message || 'Berhasil melakukan pencadangan ke cloud!');
        fetchFirebaseStatus();
      } else {
        errorToast(result.message || 'Gagal melakukan pencadangan.');
      }
    } catch (err) {
      errorToast('Gangguan jaringan saat melakukan pencadangan.');
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestore = async () => {
    if (!window.confirm('PERINGATAN: Memulihkan database akan menimpa seluruh data lokal saat ini dengan data dari Firebase Cloud. Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin melanjutkan?')) {
      return;
    }

    setRestoring(true);
    try {
      const response = await fetch('/api/firebase/restore', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        successToast(result.message || 'Berhasil memulihkan database dari cloud!');
        await reloadSettings();
        fetchFirebaseStatus();
      } else {
        errorToast(result.message || 'Gagal memulihkan database.');
      }
    } catch (err) {
      errorToast('Gangguan jaringan saat memulihkan database.');
    } finally {
      setRestoring(false);
    }
  };

  // Handle image upload via base64
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      errorToast('File logo terlalu besar. Maksimal ukuran file adalah 2MB.');
      return;
    }

    setUploading(true);
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
            filename: `logo_mwc_${Date.now()}`
          })
        });

        const result = await response.json();
        if (response.ok && result.success) {
          setLogoUrl(result.url);
          successToast('Logo MWC NU berhasil diunggah!');
        } else {
          errorToast(result.message || 'Gagal mengunggah logo.');
        }
      } catch (err) {
        errorToast('Terjadi kesalahan jaringan saat mengunggah.');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle leadership photo upload via base64
  const handleLeadershipPhotoUpload = async (
    roleKey: 'rois_photo_url' | 'katib_photo_url' | 'ketua_photo_url' | 'sekretaris_photo_url',
    roleLabel: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      errorToast('File foto terlalu besar. Maksimal ukuran file adalah 3MB.');
      return;
    }

    setUploadingRole(roleKey);
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
            filename: `pimpinan_${roleKey}_${Date.now()}`
          })
        });

        const result = await response.json();
        if (response.ok && result.success) {
          setLeadershipPhotos(prev => ({ ...prev, [roleKey]: result.url }));
          successToast(`Foto ${roleLabel} berhasil diunggah!`);
        } else {
          errorToast(result.message || `Gagal mengunggah foto ${roleLabel}.`);
        }
      } catch (err) {
        errorToast('Terjadi kesalahan jaringan saat mengunggah foto.');
      } finally {
        setUploadingRole(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper additions
  const addMustasyar = () => {
    if (!newMustasyar.trim()) return;
    setMustasyar([...mustasyar, newMustasyar.trim()]);
    setNewMustasyar('');
  };

  const addWakilRais = () => {
    if (!newWakilRais.trim()) return;
    setSyuriahWakilRais([...syuriahWakilRais, newWakilRais.trim()]);
    setNewWakilRais('');
  };

  const addWakilKatib = () => {
    if (!newWakilKatib.trim()) return;
    setSyuriahWakilKatib([...syuriahWakilKatib, newWakilKatib.trim()]);
    setNewWakilKatib('');
  };

  const addAWan = () => {
    if (!newAWan.trim()) return;
    setSyuriahAWan([...syuriahAWan, newAWan.trim()]);
    setNewAWan('');
  };

  const addWakilKetua = () => {
    if (!newWakilKetua.trim()) return;
    setTanfidziyahWakilKetua([...tanfidziyahWakilKetua, newWakilKetua.trim()]);
    setNewWakilKetua('');
  };

  const addWakilSekretaris = () => {
    if (!newWakilSekretaris.trim()) return;
    setTanfidziyahWakilSekretaris([...tanfidziyahWakilSekretaris, newWakilSekretaris.trim()]);
    setNewWakilSekretaris('');
  };

  const addWakilBendahara = () => {
    if (!newWakilBendahara.trim()) return;
    setTanfidziyahWakilBendahara([...tanfidziyahWakilBendahara, newWakilBendahara.trim()]);
    setNewWakilBendahara('');
  };

  // Helper removals
  const removeMustasyar = (index: number) => {
    setMustasyar(mustasyar.filter((_, i) => i !== index));
  };

  const removeWakilRais = (index: number) => {
    setSyuriahWakilRais(syuriahWakilRais.filter((_, i) => i !== index));
  };

  const removeWakilKatib = (index: number) => {
    setSyuriahWakilKatib(syuriahWakilKatib.filter((_, i) => i !== index));
  };

  const removeAWan = (index: number) => {
    setSyuriahAWan(syuriahAWan.filter((_, i) => i !== index));
  };

  const removeWakilKetua = (index: number) => {
    setTanfidziyahWakilKetua(tanfidziyahWakilKetua.filter((_, i) => i !== index));
  };

  const removeWakilSekretaris = (index: number) => {
    setTanfidziyahWakilSekretaris(tanfidziyahWakilSekretaris.filter((_, i) => i !== index));
  };

  const removeWakilBendahara = (index: number) => {
    setTanfidziyahWakilBendahara(tanfidziyahWakilBendahara.filter((_, i) => i !== index));
  };

  // Submit all configuration changes to API
  const handleSaveSettings = async () => {
    if (!mwcName.trim()) {
      errorToast('Nama MWC NU wajib diisi.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: mwcName.trim(),
        logo_url: logoUrl || null,
        structure: {
          mustasyar,
          syuriah: {
            rais: syuriahRais.trim(),
            wakil_rais: syuriahWakilRais,
            katib: syuriahKatib.trim(),
            wakil_katib: syuriahWakilKatib,
            a_wan: syuriahAWan
          },
          tanfidziyah: {
            ketua: tanfidziyahKetua.trim(),
            wakil_ketua: tanfidziyahWakilKetua,
            sekretaris: tanfidziyahSekretaris.trim(),
            wakil_sekretaris: tanfidziyahWakilSekretaris,
            bendahara: tanfidziyahBendahara.trim(),
            wakil_bendahara: tanfidziyahWakilBendahara
          }
        },
        social_media: socialMedia,
        leadership_photos: leadershipPhotos
      };

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (response.ok && result.success) {
        successToast('Seluruh konfigurasi & struktur kepengurusan berhasil disimpan!');
        await reloadSettings();
      } else {
        errorToast(result.message || 'Gagal menyimpan perubahan pengaturan.');
      }
    } catch (err) {
      errorToast('Gangguan jaringan. Gagal menghubungi server.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1.5 text-left">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 rounded-lg text-brand-emerald">
              <Landmark className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-mono tracking-widest text-brand-emerald uppercase font-bold">PENGATURAN SISTEM</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Konfigurasi Identitas & Kepengurusan MWC NU</h1>
          <p className="text-xs text-slate-500 max-w-2xl">
            Sisi Super Admin untuk mengatur nama MWC, mengunggah logo instansi, serta menyesuaikan personil struktur kepengurusan (Sesuai SK Resmi).
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="bg-brand-emerald hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Simpan Seluruh Perubahan</span>
        </button>
      </div>

      {/* CORE BENTO SHELF LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* LEFT COLUMN: TABS SELECTION */}
        <div className="bg-white border border-slate-150 rounded-2xl p-4 space-y-2 lg:col-span-1 shadow-sm">
          <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest px-3 py-1">Kategori Pengaturan</p>
          
          <button
            onClick={() => setActiveTab('identity')}
            className={`w-full text-left p-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
              activeTab === 'identity'
                ? 'bg-emerald-50 text-brand-emerald font-bold border-l-4 border-brand-emerald pl-2.5'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Nama & Logo Instansi</span>
          </button>

          <button
            onClick={() => setActiveTab('social_media')}
            className={`w-full text-left p-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
              activeTab === 'social_media'
                ? 'bg-emerald-50 text-brand-emerald font-bold border-l-4 border-brand-emerald pl-2.5'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Media Sosial MWC NU</span>
          </button>

          <button
            onClick={() => setActiveTab('leadership_photos')}
            className={`w-full text-left p-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
              activeTab === 'leadership_photos'
                ? 'bg-emerald-50 text-brand-emerald font-bold border-l-4 border-brand-emerald pl-2.5'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Foto Pimpinan MWC NU</span>
          </button>

          <button
            onClick={() => setActiveTab('mustasyar')}
            className={`w-full text-left p-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
              activeTab === 'mustasyar'
                ? 'bg-emerald-50 text-brand-emerald font-bold border-l-4 border-brand-emerald pl-2.5'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Struktur Mustasyar</span>
          </button>

          <button
            onClick={() => setActiveTab('syuriah')}
            className={`w-full text-left p-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
              activeTab === 'syuriah'
                ? 'bg-emerald-50 text-brand-emerald font-bold border-l-4 border-brand-emerald pl-2.5'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Struktur Syuriah</span>
          </button>

          <button
            onClick={() => setActiveTab('tanfidziyah')}
            className={`w-full text-left p-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
              activeTab === 'tanfidziyah'
                ? 'bg-emerald-50 text-brand-emerald font-bold border-l-4 border-brand-emerald pl-2.5'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Struktur Tanfidziyah</span>
          </button>

          <button
            onClick={() => setActiveTab('firebase')}
            className={`w-full text-left p-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
              activeTab === 'firebase'
                ? 'bg-emerald-50 text-brand-emerald font-bold border-l-4 border-brand-emerald pl-2.5'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Firebase Cloud Sync</span>
          </button>
        </div>

        {/* RIGHT COLUMN: MAIN FORMS CONTAINER */}
        <div className="lg:col-span-3 bg-white border border-slate-150 rounded-2xl p-6 md:p-8 shadow-sm">
          
          {/* TAB 1: IDENTITY */}
          {activeTab === 'identity' && (
            <div className="space-y-6 text-left animate-fadeIn">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-800">Nama & Logo MWC NU</h3>
                <p className="text-slate-500 text-[11px]">Ganti identitas penamaan portal dan visual logo utama yang tampil secara global.</p>
              </div>

              {/* MWC Name */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">Nama MWC NU Resmi</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Landmark className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={mwcName}
                    onChange={(e) => setMwcName(e.target.value)}
                    placeholder="Contoh: MWC NU Karangpawitan"
                    className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium outline-none transition-all"
                  />
                </div>
              </div>

              {/* Logo Upload Layout */}
              <div className="space-y-3">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">Logo MWC NU</label>
                
                <div className="flex flex-col sm:flex-row items-center gap-6 p-5 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <div className="w-24 h-24 bg-white border border-slate-150 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo Preview" className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="text-center p-3 text-slate-300">
                        <Image className="w-8 h-8 mx-auto opacity-40" />
                        <span className="text-[9px] font-bold block mt-1">Default Logo</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 text-center sm:text-left flex-1">
                    <p className="text-xs font-bold text-slate-700">Unggah Logo Kustom</p>
                    <p className="text-slate-500 text-[10px] leading-relaxed max-w-sm">
                      Mendukung format PNG atau JPG dengan ukuran maksimal 2MB. Logo kustom ini akan langsung diperbarui di bagian header sidebar portal utama dan halaman landing utama.
                    </p>
                    
                    <div className="flex flex-wrap gap-2.5 justify-center sm:justify-start">
                      <label className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 font-bold py-1.5 px-3.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors">
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span>Pilih Gambar</span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg"
                          onChange={handleLogoUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                      
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-150 font-bold py-1.5 px-3 rounded-lg text-xs cursor-pointer transition-colors"
                        >
                          Hapus Kustom Logo (Gunakan Default)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50/80 border border-amber-200/50 rounded-xl p-4 flex gap-3 text-slate-700">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-amber-800">Catatan Penting</h4>
                  <p className="text-[10px] leading-relaxed font-medium">
                    Jika tidak mengunggah logo kustom, sistem secara otomatis akan menggunakan lambang resmi Nahdlatul Ulama yang ikonik sebagai logo standar pada portal dan halaman depan.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: MEDIA SOSIAL */}
          {activeTab === 'social_media' && (
            <div className="space-y-6 text-left animate-fadeIn">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-800">Media Sosial & Tautan Resmi MWC NU</h3>
                <p className="text-slate-500 text-[11px]">Kelola tautan media sosial resmi yang akan ditampilkan di beranda / halaman publik portal warga.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Facebook */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">f</span>
                    <span>Tautan Facebook</span>
                  </label>
                  <input
                    type="url"
                    value={socialMedia.facebook}
                    onChange={(e) => setSocialMedia({ ...socialMedia, facebook: e.target.value })}
                    placeholder="https://facebook.com/mwcnukarangpawitan"
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-brand-emerald rounded-xl py-2 px-3 text-xs font-medium outline-none transition-all"
                  />
                </div>

                {/* Instagram */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-xs">ig</span>
                    <span>Tautan Instagram</span>
                  </label>
                  <input
                    type="url"
                    value={socialMedia.instagram}
                    onChange={(e) => setSocialMedia({ ...socialMedia, instagram: e.target.value })}
                    placeholder="https://instagram.com/mwcnu_karangpawitan"
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-brand-emerald rounded-xl py-2 px-3 text-xs font-medium outline-none transition-all"
                  />
                </div>

                {/* YouTube */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-2">
                    <Video className="w-4 h-4 text-red-600" />
                    <span>Kanal YouTube</span>
                  </label>
                  <input
                    type="url"
                    value={socialMedia.youtube}
                    onChange={(e) => setSocialMedia({ ...socialMedia, youtube: e.target.value })}
                    placeholder="https://youtube.com/@mwcnukarangpawitan"
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-brand-emerald rounded-xl py-2 px-3 text-xs font-medium outline-none transition-all"
                  />
                </div>

                {/* TikTok */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">tt</span>
                    <span>Akun TikTok</span>
                  </label>
                  <input
                    type="url"
                    value={socialMedia.tiktok}
                    onChange={(e) => setSocialMedia({ ...socialMedia, tiktok: e.target.value })}
                    placeholder="https://tiktok.com/@mwcnukarangpawitan"
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-brand-emerald rounded-xl py-2 px-3 text-xs font-medium outline-none transition-all"
                  />
                </div>

                {/* WhatsApp */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp Layanan / Group</span>
                  </label>
                  <input
                    type="url"
                    value={socialMedia.whatsapp}
                    onChange={(e) => setSocialMedia({ ...socialMedia, whatsapp: e.target.value })}
                    placeholder="https://wa.me/6281234567890"
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-brand-emerald rounded-xl py-2 px-3 text-xs font-medium outline-none transition-all"
                  />
                </div>

                {/* Website */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-brand-emerald" />
                    <span>Website Resmi / Portal</span>
                  </label>
                  <input
                    type="url"
                    value={socialMedia.website}
                    onChange={(e) => setSocialMedia({ ...socialMedia, website: e.target.value })}
                    placeholder="https://mwcnukarangpawitan.or.id"
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-brand-emerald rounded-xl py-2 px-3 text-xs font-medium outline-none transition-all"
                  />
                </div>
              </div>

              <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl text-xs text-emerald-900 flex items-center gap-3">
                <Share2 className="w-5 h-5 text-brand-emerald shrink-0" />
                <p>
                  Tautan media sosial yang diisi akan otomatis ditampilkan di bagian header dan footer beranda publik portal warga.
                </p>
              </div>
            </div>
          )}

          {/* TAB: FOTO PIMPINAN MWC NU */}
          {activeTab === 'leadership_photos' && (
            <div className="space-y-6 text-left animate-fadeIn">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-800">Foto Resmi Jajaran Pimpinan Utama MWC NU</h3>
                <p className="text-slate-500 text-[11px]">Unggah atau atur tautan foto profil resmi 4 Pimpinan Utama MWC NU untuk ditampilkan secara khusus pada beranda portal publik.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. ROIS SYURIAH */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-emerald-100 text-brand-emerald rounded-lg">
                        <Award className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="text-[10px] font-mono font-bold text-brand-emerald uppercase tracking-wider block">DEWAN SYURIAH</span>
                        <h4 className="font-extrabold text-sm text-slate-800">Foto Rois Syuriah</h4>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-100">
                      Pemimpin Tertinggi
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    Pejabat: <span className="text-brand-emerald">{syuriahRais || 'KA. Muhlis Ulumudin, S.Pd.I.'}</span>
                  </p>

                  <div className="flex items-center gap-4">
                    <div className="w-24 h-28 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 relative group shadow-inner">
                      {leadershipPhotos.rois_photo_url ? (
                        <img
                          src={leadershipPhotos.rois_photo_url}
                          alt="Rois Syuriah"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-2">
                          <User className="w-8 h-8 text-slate-400 mx-auto" />
                          <span className="text-[9px] text-slate-400 block mt-1">Belum Ada Foto</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 flex-1">
                      <label className="block text-[11px] font-bold text-slate-600">Unggah File Foto Profil:</label>
                      <label className="bg-emerald-50 hover:bg-emerald-100 text-brand-emerald font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-2 border border-emerald-200/60 cursor-pointer transition-colors w-full">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingRole === 'rois_photo_url' ? 'Mengunggah...' : 'Pilih Foto'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingRole === 'rois_photo_url'}
                          onChange={(e) => handleLeadershipPhotoUpload('rois_photo_url', 'Rois Syuriah', e)}
                          className="hidden"
                        />
                      </label>

                      <div className="pt-1">
                        <input
                          type="text"
                          value={leadershipPhotos.rois_photo_url}
                          onChange={(e) => setLeadershipPhotos({ ...leadershipPhotos, rois_photo_url: e.target.value })}
                          placeholder="Atau tempel URL foto..."
                          className="w-full bg-slate-50 border border-slate-200 focus:border-brand-emerald rounded-lg p-1.5 text-[11px] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. KATIB SYURIAH */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-emerald-100 text-brand-emerald rounded-lg">
                        <Award className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="text-[10px] font-mono font-bold text-brand-emerald uppercase tracking-wider block">DEWAN SYURIAH</span>
                        <h4 className="font-extrabold text-sm text-slate-800">Foto Katib Syuriah</h4>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-100">
                      Sekretaris Syuriah
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    Pejabat: <span className="text-brand-emerald">{syuriahKatib || 'Ust. Hilman Firmansyah, S.Pd.I.'}</span>
                  </p>

                  <div className="flex items-center gap-4">
                    <div className="w-24 h-28 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 relative group shadow-inner">
                      {leadershipPhotos.katib_photo_url ? (
                        <img
                          src={leadershipPhotos.katib_photo_url}
                          alt="Katib Syuriah"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-2">
                          <User className="w-8 h-8 text-slate-400 mx-auto" />
                          <span className="text-[9px] text-slate-400 block mt-1">Belum Ada Foto</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 flex-1">
                      <label className="block text-[11px] font-bold text-slate-600">Unggah File Foto Profil:</label>
                      <label className="bg-emerald-50 hover:bg-emerald-100 text-brand-emerald font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-2 border border-emerald-200/60 cursor-pointer transition-colors w-full">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingRole === 'katib_photo_url' ? 'Mengunggah...' : 'Pilih Foto'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingRole === 'katib_photo_url'}
                          onChange={(e) => handleLeadershipPhotoUpload('katib_photo_url', 'Katib Syuriah', e)}
                          className="hidden"
                        />
                      </label>

                      <div className="pt-1">
                        <input
                          type="text"
                          value={leadershipPhotos.katib_photo_url}
                          onChange={(e) => setLeadershipPhotos({ ...leadershipPhotos, katib_photo_url: e.target.value })}
                          placeholder="Atau tempel URL foto..."
                          className="w-full bg-slate-50 border border-slate-200 focus:border-brand-emerald rounded-lg p-1.5 text-[11px] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. KETUA TANFIDZIYAH */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                        <UserCheck className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="text-[10px] font-mono font-bold text-blue-700 uppercase tracking-wider block">DEWAN TANFIDZIYAH</span>
                        <h4 className="font-extrabold text-sm text-slate-800">Foto Ketua Tanfidziyah</h4>
                      </div>
                    </div>
                    <span className="text-[10px] bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded-md border border-blue-100">
                      Ketua Eksekutif
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    Pejabat: <span className="text-blue-700">{tanfidziyahKetua || 'KH. Agus, S.Ag., M.Si.'}</span>
                  </p>

                  <div className="flex items-center gap-4">
                    <div className="w-24 h-28 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 relative group shadow-inner">
                      {leadershipPhotos.ketua_photo_url ? (
                        <img
                          src={leadershipPhotos.ketua_photo_url}
                          alt="Ketua Tanfidziyah"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-2">
                          <User className="w-8 h-8 text-slate-400 mx-auto" />
                          <span className="text-[9px] text-slate-400 block mt-1">Belum Ada Foto</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 flex-1">
                      <label className="block text-[11px] font-bold text-slate-600">Unggah File Foto Profil:</label>
                      <label className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-2 border border-blue-200/60 cursor-pointer transition-colors w-full">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingRole === 'ketua_photo_url' ? 'Mengunggah...' : 'Pilih Foto'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingRole === 'ketua_photo_url'}
                          onChange={(e) => handleLeadershipPhotoUpload('ketua_photo_url', 'Ketua Tanfidziyah', e)}
                          className="hidden"
                        />
                      </label>

                      <div className="pt-1">
                        <input
                          type="text"
                          value={leadershipPhotos.ketua_photo_url}
                          onChange={(e) => setLeadershipPhotos({ ...leadershipPhotos, ketua_photo_url: e.target.value })}
                          placeholder="Atau tempel URL foto..."
                          className="w-full bg-slate-50 border border-slate-200 focus:border-brand-emerald rounded-lg p-1.5 text-[11px] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. SEKRETARIS TANFIDZIYAH */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                        <UserCheck className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="text-[10px] font-mono font-bold text-blue-700 uppercase tracking-wider block">DEWAN TANFIDZIYAH</span>
                        <h4 className="font-extrabold text-sm text-slate-800">Foto Sekretaris Tanfidziyah</h4>
                      </div>
                    </div>
                    <span className="text-[10px] bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded-md border border-blue-100">
                      Sekretaris Eksekutif
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    Pejabat: <span className="text-blue-700">{tanfidziyahSekretaris || 'M. Didin Saeful Hayat'}</span>
                  </p>

                  <div className="flex items-center gap-4">
                    <div className="w-24 h-28 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 relative group shadow-inner">
                      {leadershipPhotos.sekretaris_photo_url ? (
                        <img
                          src={leadershipPhotos.sekretaris_photo_url}
                          alt="Sekretaris Tanfidziyah"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-2">
                          <User className="w-8 h-8 text-slate-400 mx-auto" />
                          <span className="text-[9px] text-slate-400 block mt-1">Belum Ada Foto</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 flex-1">
                      <label className="block text-[11px] font-bold text-slate-600">Unggah File Foto Profil:</label>
                      <label className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-2 border border-blue-200/60 cursor-pointer transition-colors w-full">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingRole === 'sekretaris_photo_url' ? 'Mengunggah...' : 'Pilih Foto'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingRole === 'sekretaris_photo_url'}
                          onChange={(e) => handleLeadershipPhotoUpload('sekretaris_photo_url', 'Sekretaris Tanfidziyah', e)}
                          className="hidden"
                        />
                      </label>

                      <div className="pt-1">
                        <input
                          type="text"
                          value={leadershipPhotos.sekretaris_photo_url}
                          onChange={(e) => setLeadershipPhotos({ ...leadershipPhotos, sekretaris_photo_url: e.target.value })}
                          placeholder="Atau tempel URL foto..."
                          className="w-full bg-slate-50 border border-slate-200 focus:border-brand-emerald rounded-lg p-1.5 text-[11px] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl text-xs text-emerald-900 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-brand-emerald shrink-0" />
                <p>
                  Setelah mengunggah atau memasukkan URL foto, klik tombol <strong>"Simpan Seluruh Perubahan"</strong> di bagian atas untuk menyimpan ke sistem.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: MUSTASYAR */}
          {activeTab === 'mustasyar' && (
            <div className="space-y-5 text-left animate-fadeIn">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-800">Dewan Mustasyar</h3>
                <p className="text-slate-500 text-[11px]">Mustasyar adalah penasehat organisasi yang diisi oleh para kyai/tokoh ulama sepuh.</p>
              </div>

              {/* Mustasyar Add Area */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMustasyar}
                  onChange={(e) => setNewMustasyar(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addMustasyar()}
                  placeholder="Masukkan nama Kyai / Tokoh Mustasyar"
                  className="flex-grow bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald rounded-xl py-2 px-3.5 text-xs outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={addMustasyar}
                  className="bg-emerald-50 hover:bg-emerald-100 text-brand-emerald font-bold border border-emerald-100 px-4 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah</span>
                </button>
              </div>

              {/* Mustasyar List */}
              <div className="space-y-2 max-h-[350px] overflow-y-auto border border-slate-100 rounded-xl p-2.5">
                {mustasyar.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic py-6 text-center">Belum ada nama Mustasyar yang dimasukkan.</p>
                ) : (
                  mustasyar.map((name, index) => (
                    <div key={index} className="flex items-center justify-between bg-slate-50 hover:bg-slate-100/60 p-2.5 rounded-xl border border-slate-100/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 bg-emerald-100 text-brand-emerald text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">{name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMustasyar(index)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SYURIAH */}
          {activeTab === 'syuriah' && (
            <div className="space-y-6 text-left animate-fadeIn">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-800">Dewan Syuriah</h3>
                <p className="text-slate-500 text-[11px]">Syuriah adalah badan legislatif / pengambil keputusan tertinggi di struktur kepengurusan NU.</p>
              </div>

              {/* Rais Syuriah (Single) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-2">
                <label className="block text-xs font-extrabold text-brand-emerald uppercase tracking-wider">Rais Syuriah (Utama)</label>
                <input
                  type="text"
                  value={syuriahRais}
                  onChange={(e) => setSyuriahRais(e.target.value)}
                  placeholder="Nama Rais Syuriah"
                  className="w-full bg-white border border-slate-200 focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald rounded-xl py-2 px-3.5 text-xs outline-none transition-all"
                />
              </div>

              {/* Wakil Rais (Multiple) */}
              <div className="space-y-3 p-4 border border-slate-150 rounded-2xl">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">Wakil Rais Syuriah</label>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newWakilRais}
                    onChange={(e) => setNewWakilRais(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addWakilRais()}
                    placeholder="Tambah Wakil Rais"
                    className="flex-grow bg-slate-50 focus:bg-white border border-slate-200 focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald rounded-xl py-2 px-3.5 text-xs outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={addWakilRais}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 px-3 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                </div>

                <div className="space-y-1.5 max-h-[150px] overflow-y-auto border border-slate-100 rounded-xl p-2 bg-slate-50/40">
                  {syuriahWakilRais.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic py-2 text-center">Belum ada Wakil Rais.</p>
                  ) : (
                    syuriahWakilRais.map((name, i) => (
                      <div key={i} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100 text-xs text-slate-700">
                        <span>{name}</span>
                        <button type="button" onClick={() => removeWakilRais(i)} className="text-rose-500 hover:text-rose-700 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Katib & Wakil Katib Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Katib (Single) */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-2">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">Katib (Sekretaris Syuriah)</label>
                  <input
                    type="text"
                    value={syuriahKatib}
                    onChange={(e) => setSyuriahKatib(e.target.value)}
                    placeholder="Nama Katib"
                    className="w-full bg-white border border-slate-200 focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald rounded-xl py-2 px-3.5 text-xs outline-none transition-all"
                  />
                </div>

                {/* Wakil Katib (Multiple) */}
                <div className="p-4 border border-slate-150 rounded-2xl space-y-3">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">Wakil Katib</label>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newWakilKatib}
                      onChange={(e) => setNewWakilKatib(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addWakilKatib()}
                      placeholder="Tambah Wakil Katib"
                      className="flex-grow bg-slate-50 focus:bg-white border border-slate-200 focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald rounded-xl py-1.5 px-3.5 text-xs outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={addWakilKatib}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 px-2.5 rounded-xl text-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto border border-slate-100 rounded-xl p-2 bg-slate-50/40">
                    {syuriahWakilKatib.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic py-2 text-center">Belum ada Wakil Katib.</p>
                    ) : (
                      syuriahWakilKatib.map((name, i) => (
                        <div key={i} className="flex items-center justify-between bg-white p-1.5 rounded-lg border border-slate-100 text-xs text-slate-700">
                          <span>{name}</span>
                          <button type="button" onClick={() => removeWakilKatib(i)} className="text-rose-500 hover:text-rose-700 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* A'wan (Multiple) */}
              <div className="p-4 border border-slate-150 rounded-2xl space-y-3">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">A'wan (Komisi Pakar / Pembantu Syuriah)</label>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAWan}
                    onChange={(e) => setNewAWan(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addAWan()}
                    placeholder="Tambah anggota A'wan"
                    className="flex-grow bg-slate-50 focus:bg-white border border-slate-200 focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald rounded-xl py-2 px-3.5 text-xs outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={addAWan}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 px-3.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah</span>
                  </button>
                </div>

                <div className="space-y-1.5 max-h-[150px] overflow-y-auto border border-slate-100 rounded-xl p-2 bg-slate-50/40">
                  {syuriahAWan.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic py-2 text-center">Belum ada anggota A'wan.</p>
                  ) : (
                    syuriahAWan.map((name, i) => (
                      <div key={i} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100 text-xs text-slate-700">
                        <span>{name}</span>
                        <button type="button" onClick={() => removeAWan(i)} className="text-rose-500 hover:text-rose-700 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TANFIDZIYAH */}
          {activeTab === 'tanfidziyah' && (
            <div className="space-y-6 text-left animate-fadeIn">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-800">Dewan Tanfidziyah</h3>
                <p className="text-slate-500 text-[11px]">Tanfidziyah adalah badan eksekutif yang menjalankan roda kepemimpinan sehari-hari organisasi NU.</p>
              </div>

              {/* Ketua & Wakil Ketua Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Ketua (Single) */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-2">
                  <label className="block text-xs font-extrabold text-brand-emerald uppercase tracking-wider">Ketua Tanfidziyah (Utama)</label>
                  <input
                    type="text"
                    value={tanfidziyahKetua}
                    onChange={(e) => setTanfidziyahKetua(e.target.value)}
                    placeholder="Nama Ketua Tanfidziyah"
                    className="w-full bg-white border border-slate-200 focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald rounded-xl py-2 px-3.5 text-xs outline-none transition-all"
                  />
                </div>

                {/* Wakil Ketua (Multiple) */}
                <div className="p-4 border border-slate-150 rounded-2xl space-y-3">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">Wakil Ketua Tanfidziyah</label>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newWakilKetua}
                      onChange={(e) => setNewWakilKetua(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addWakilKetua()}
                      placeholder="Tambah Wakil Ketua"
                      className="flex-grow bg-slate-50 focus:bg-white border border-slate-200 focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald rounded-xl py-1.5 px-3 text-xs outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={addWakilKetua}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 px-2.5 rounded-xl text-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto border border-slate-100 rounded-xl p-2 bg-slate-50/40">
                    {tanfidziyahWakilKetua.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic py-2 text-center">Belum ada Wakil Ketua.</p>
                    ) : (
                      tanfidziyahWakilKetua.map((name, i) => (
                        <div key={i} className="flex items-center justify-between bg-white p-1.5 rounded-lg border border-slate-100 text-xs text-slate-700">
                          <span>{name}</span>
                          <button type="button" onClick={() => removeWakilKetua(i)} className="text-rose-500 hover:text-rose-700 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Sekretaris & Wakil Sekretaris Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Sekretaris (Single) */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-2">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">Sekretaris (Utama)</label>
                  <input
                    type="text"
                    value={tanfidziyahSekretaris}
                    onChange={(e) => setTanfidziyahSekretaris(e.target.value)}
                    placeholder="Nama Sekretaris"
                    className="w-full bg-white border border-slate-200 focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald rounded-xl py-2 px-3.5 text-xs outline-none transition-all"
                  />
                </div>

                {/* Wakil Sekretaris (Multiple) */}
                <div className="p-4 border border-slate-150 rounded-2xl space-y-3">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">Wakil Sekretaris</label>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newWakilSekretaris}
                      onChange={(e) => setNewWakilSekretaris(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addWakilSekretaris()}
                      placeholder="Tambah Wakil Sekretaris"
                      className="flex-grow bg-slate-50 focus:bg-white border border-slate-200 focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald rounded-xl py-1.5 px-3 text-xs outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={addWakilSekretaris}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 px-2.5 rounded-xl text-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto border border-slate-100 rounded-xl p-2 bg-slate-50/40">
                    {tanfidziyahWakilSekretaris.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic py-2 text-center">Belum ada Wakil Sekretaris.</p>
                    ) : (
                      tanfidziyahWakilSekretaris.map((name, i) => (
                        <div key={i} className="flex items-center justify-between bg-white p-1.5 rounded-lg border border-slate-100 text-xs text-slate-700">
                          <span>{name}</span>
                          <button type="button" onClick={() => removeWakilSekretaris(i)} className="text-rose-500 hover:text-rose-700 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Bendahara & Wakil Bendahara Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Bendahara (Single) */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-2">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">Bendahara (Utama)</label>
                  <input
                    type="text"
                    value={tanfidziyahBendahara}
                    onChange={(e) => setTanfidziyahBendahara(e.target.value)}
                    placeholder="Nama Bendahara"
                    className="w-full bg-white border border-slate-200 focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald rounded-xl py-2 px-3.5 text-xs outline-none transition-all"
                  />
                </div>

                {/* Wakil Bendahara (Multiple) */}
                <div className="p-4 border border-slate-150 rounded-2xl space-y-3">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">Wakil Bendahara</label>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newWakilBendahara}
                      onChange={(e) => setNewWakilBendahara(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addWakilBendahara()}
                      placeholder="Tambah Wakil Bendahara"
                      className="flex-grow bg-slate-50 focus:bg-white border border-slate-200 focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald rounded-xl py-1.5 px-3 text-xs outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={addWakilBendahara}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 px-2.5 rounded-xl text-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto border border-slate-100 rounded-xl p-2 bg-slate-50/40">
                    {tanfidziyahWakilBendahara.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic py-2 text-center">Belum ada Wakil Bendahara.</p>
                    ) : (
                      tanfidziyahWakilBendahara.map((name, i) => (
                        <div key={i} className="flex items-center justify-between bg-white p-1.5 rounded-lg border border-slate-100 text-xs text-slate-700">
                          <span>{name}</span>
                          <button type="button" onClick={() => removeWakilBendahara(i)} className="text-rose-500 hover:text-rose-700 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: FIREBASE SYNC */}
          {activeTab === 'firebase' && (
            <div className="space-y-6 text-left animate-fadeIn">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-800">Firebase Cloud Synchronization</h3>
                <p className="text-slate-500 text-[11px]">Amankan dan sinkronisasikan seluruh database SIM MWC NU Karangpawitan secara real-time ke infrastruktur Google Firebase Firestore.</p>
              </div>

              {checkingFirebase ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <RefreshCw className="w-8 h-8 text-brand-emerald animate-spin" />
                  <p className="text-xs text-slate-500 font-medium">Memeriksa status koneksi Firebase Cloud...</p>
                </div>
              ) : firebaseStatus ? (
                <div className="space-y-6">
                  {/* Status Indicator */}
                  {!firebaseStatus.configured ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex gap-4 items-start">
                      <AlertTriangle className="w-6 h-6 text-slate-400 shrink-0" />
                      <div className="space-y-1">
                        <h4 className="font-bold text-xs text-slate-800">Firebase Belum Dikonfigurasi</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Sistem belum terhubung ke Google Cloud Firebase. Silakan hubungi administrator Anda untuk menginisialisasi set_up_firebase di portal pengembang.
                        </p>
                      </div>
                    </div>
                  ) : firebaseStatus.rulesLocked ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-4">
                      <div className="flex gap-4 items-start">
                        <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <h4 className="font-bold text-xs text-amber-800">Aturan Keamanan Firebase Terkunci (Rules Locked)</h4>
                          <p className="text-[11px] text-amber-700 leading-relaxed">
                            Aplikasi berhasil terhubung ke Proyek Google Cloud Anda: <strong className="font-semibold text-slate-800">{firebaseStatus.projectId}</strong> dengan database <strong className="font-semibold text-slate-800">{firebaseStatus.databaseId}</strong>, namun operasi tulis ditolak karena Aturan Keamanan Firestore Anda terkunci.
                          </p>
                        </div>
                      </div>

                      <div className="bg-white/80 border border-amber-100 rounded-xl p-4 space-y-2.5">
                        <p className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider">Solusi Mengaktifkan Sinkronisasi:</p>
                        <p className="text-[10px] text-slate-600 leading-relaxed">
                          Buka konsol Firebase Anda, navigasikan ke <strong>Firestore Database</strong> &gt; <strong>Rules (Aturan)</strong>, ubah aturan menjadi kode berikut, lalu klik <strong>Publish (Publikasikan)</strong>:
                        </p>
                        <pre className="bg-slate-950 text-emerald-400 p-3 rounded-lg text-[9px] font-mono overflow-x-auto leading-relaxed max-w-full">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
                        </pre>
                        <p className="text-[10px] text-slate-500 italic">
                          Catatan: Untuk produksi, Anda dapat mengganti `if true` dengan pemeriksaan otentikasi yang lebih ketat.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex gap-4 items-start">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                      <div className="space-y-1">
                        <h4 className="font-bold text-xs text-emerald-800">Koneksi Cloud Firebase Aktif & Sinkron</h4>
                        <p className="text-[11px] text-emerald-600 leading-relaxed">
                          Sistem terhubung sepenuhnya dengan Firestore Database <span className="font-mono text-[10px] bg-emerald-100 px-1 rounded text-emerald-800">{firebaseStatus.databaseId}</span> di bawah Project ID <span className="font-mono text-[10px] bg-emerald-100 px-1 rounded text-emerald-800">{firebaseStatus.projectId}</span>. Database siap disinkronkan kapan saja!
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Backup Info & Stats Card */}
                  <div className="bg-white border border-slate-150 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-slate-400" />
                        <h4 className="font-bold text-xs text-slate-800">Status Cadangan Terakhir</h4>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-2.5 py-1 rounded-full">
                        {firebaseStatus.lastBackup ? `Terakhir: ${new Date(firebaseStatus.lastBackup).toLocaleString('id-ID')}` : 'Belum Pernah Dicadangkan'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Layanan pencadangan cloud ini mengunggah seluruh data warga NU, rincian keanggotaan ranting, laporan pemasukan/pengeluaran keuangan, serta inventaris sarana prasarana MWC NU ke server Google Cloud demi keamanan jangka panjang.
                    </p>

                    {/* Action Panel */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        onClick={handleBackup}
                        disabled={backingUp || restoring || !firebaseStatus.configured}
                        className="bg-brand-emerald hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-1 animate-pulse"
                      >
                        {backingUp ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Cloud className="w-4 h-4" />
                        )}
                        <span>Unggah Cadangan ke Cloud</span>
                      </button>

                      {user?.role === 'Super Admin' && (
                        <button
                          onClick={handleRestore}
                          disabled={backingUp || restoring || !firebaseStatus.configured}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs py-2.5 px-5 rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                        >
                          {restoring ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Database className="w-4 h-4" />
                          )}
                          <span>Pulihkan Database dari Cloud</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Gagal mendapatkan status Firebase dari server.
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
