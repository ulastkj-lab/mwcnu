/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  Package, Plus, Search, Calendar, RefreshCcw, CheckCircle2, AlertCircle, X, ShieldAlert, MapPin, Phone, Upload, Image, Layers
} from 'lucide-react';

interface Asset {
  id: number;
  code: string;
  name: string;
  category: string;
  location: string;
  condition: 'Baik' | 'Rusak Ringan' | 'Rusak Berat';
  quantity?: number;
  photo_url?: string | null;
  loan_status: 'Dipinjam' | 'Tersedia';
  notes: string | null;
  active_loan: {
    id: number;
    borrower_name: string;
    borrower_phone: string | null;
    loan_date: string;
    estimated_return_date: string | null;
  } | null;
}

interface LoanLog {
  id: number;
  inventaris_id: number;
  borrower_name: string;
  borrower_phone: string | null;
  loan_date: string;
  estimated_return_date: string | null;
  actual_return_date: string | null;
  status: 'Dipinjam' | 'Kembali' | 'Terlambat';
}

export default function InventarisPage() {
  const { token, hasRole } = useAuth();
  const { successToast, errorToast } = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loans, setLoans] = useState<LoanLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modals
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Asset Form States
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Elektronik');
  const [location, setLocation] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [condition, setCondition] = useState<'Baik' | 'Rusak Ringan' | 'Rusak Berat'>('Baik');
  const [assetNotes, setAssetNotes] = useState('');

  // Handle Photo File Upload to Base64
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        errorToast('Ukuran foto terlalu besar. Maksimal 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Loan Form States
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [loanDate, setLoanDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnDate, setReturnDate] = useState('');
  const [loanNotes, setLoanNotes] = useState('');

  // Notifications
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const loadInventory = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/inventaris', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const result = await response.json();
        setAssets(result.data.assets || []);
        setLoans(result.data.loans || []);
      }
    } catch (err) {
      console.error('Failed to load inventory assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!code.trim() || !name.trim() || !location.trim()) {
      setFormError('Semua kolom wajib diisi.');
      return;
    }

    try {
      const response = await fetch('/api/inventaris', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code, name, category, location, condition, quantity, photo_url: photoUrl, notes: assetNotes
        })
      });

      const result = await response.json();
      if (result.success) {
        setFormSuccess('Barang baru berhasil ditambahkan!');
        successToast('Barang baru berhasil ditambahkan!');
        setTimeout(() => {
          setIsAssetModalOpen(false);
          setCode('');
          setName('');
          setLocation('');
          setQuantity(1);
          setPhotoUrl('');
          setAssetNotes('');
          setFormSuccess('');
          loadInventory();
        }, 1000);
      } else {
        const errorMsg = result.message || 'Gagal meregistrasi barang.';
        setFormError(errorMsg);
        errorToast(errorMsg);
      }
    } catch (err) {
      setFormError('Gangguan jaringan. Coba lagi.');
      errorToast('Gangguan jaringan. Coba lagi.');
    }
  };

  const handleBorrowAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    setFormError('');
    setFormSuccess('');

    if (!borrowerName.trim() || !loanDate) {
      setFormError('Nama peminjam dan Tanggal Pinjam wajib diisi.');
      return;
    }

    try {
      const response = await fetch('/api/inventaris/loan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          inventaris_id: selectedAsset.id,
          borrower_name: borrowerName,
          borrower_phone: borrowerPhone || null,
          loan_date: loanDate,
          expected_return_date: returnDate || null,
          notes: loanNotes
        })
      });

      const result = await response.json();
      if (result.success) {
        setFormSuccess('Sesi peminjaman inventaris berhasil dicatatkan!');
        successToast('Sesi peminjaman inventaris berhasil dicatatkan!');
        setTimeout(() => {
          setIsLoanModalOpen(false);
          setSelectedAsset(null);
          setBorrowerName('');
          setBorrowerPhone('');
          setReturnDate('');
          setLoanNotes('');
          setFormSuccess('');
          loadInventory();
        }, 1000);
      } else {
        const errorMsg = result.message || 'Gagal memproses peminjaman.';
        setFormError(errorMsg);
        errorToast(errorMsg);
      }
    } catch (err) {
      setFormError('Gangguan jaringan. Silakan coba sesaat lagi.');
      errorToast('Gangguan jaringan. Silakan coba sesaat lagi.');
    }
  };

  const handleReturnAsset = async (loanId: number) => {
    if (!confirm('Apakah Anda yakin barang ini sudah dikembalikan dan ingin mencatatkan pengembalian?')) return;

    try {
      const response = await fetch(`/api/inventaris/loans/${loanId}/return`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        successToast('Barang berhasil dikembalikan ke inventaris!');
        loadInventory();
      } else {
        errorToast(result.message || 'Gagal mengembalikan barang.');
      }
    } catch (err) {
      console.error('Failed to return item:', err);
      errorToast('Kesalahan jaringan. Gagal menghubungkan ke server.');
    }
  };

  const filteredAssets = assets.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.code.toLowerCase().includes(search.toLowerCase()) ||
    a.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-emerald-950">Aset & Inventaris MWC</h2>
          <p className="text-slate-500 text-xs mt-0.5 font-medium font-sans">Kelola kepemilikan aset sarana organisasi, pelacakan pengembalian peminjaman inventaris untuk kelancaran dakwah.</p>
        </div>

        {hasRole(['Super Admin', 'Sekretaris', 'Operator']) && (
          <button
            onClick={() => setIsAssetModalOpen(true)}
            className="bg-brand-emerald text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-emerald-800/10 hover:bg-brand-emerald-dark transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Daftarkan Barang Baru
          </button>
        )}
      </div>

      {/* TOOLBAR */}
      <div className="bg-white p-4 border border-slate-150 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari nama barang, kode, atau lokasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-brand-emerald focus:ring-1 focus:ring-emerald-500/10 rounded-xl py-2 pl-9 pr-4 text-xs font-medium outline-none transition-all placeholder:text-slate-400"
          />
        </div>
        <div className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-wider">
          Total Barang: {assets.length} Aset Terdata
        </div>
      </div>

      {/* ASSETS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center p-12 text-slate-400 text-xs">Memuat log aset inventaris...</div>
        ) : filteredAssets.length === 0 ? (
          <div className="col-span-3 text-center p-12 text-slate-400 text-xs">Aset tidak ditemukan.</div>
        ) : (
          filteredAssets.map((asset) => (
            <div key={asset.id} className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
              
              {/* Header card info */}
              <div>
                {/* Photo Header */}
                {asset.photo_url ? (
                  <div className="w-full h-40 rounded-xl overflow-hidden mb-3 border border-slate-100 bg-slate-50">
                    <img 
                      src={asset.photo_url} 
                      alt={asset.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                ) : (
                  <div className="w-full h-24 rounded-xl mb-3 border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 gap-1">
                    <Package className="w-6 h-6 text-slate-300" />
                    <span className="text-[10px] font-mono">Belum ada foto</span>
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-100 text-slate-500 text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded">
                        {asset.code}
                      </span>
                      <span className="bg-emerald-50 text-brand-emerald text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-100/60">
                        Stok: {asset.quantity || 1} Unit
                      </span>
                    </div>
                    <h4 className="font-display font-bold text-sm text-slate-800 mt-2 leading-tight">{asset.name}</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">{asset.category}</p>
                  </div>
                  <div className={`p-2 rounded-xl text-xs font-bold shrink-0 ${
                    asset.condition === 'Baik' ? 'bg-emerald-50 text-brand-emerald' : 'bg-red-50 text-red-600'
                  }`}>
                    {asset.condition}
                  </div>
                </div>

                <div className="border-t border-slate-100/60 pt-3 mt-3 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">Lokasi: {asset.location}</span>
                  </div>
                  {asset.notes && (
                    <p className="text-[11px] text-slate-400 italic font-medium leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                      &ldquo;{asset.notes}&rdquo;
                    </p>
                  )}
                </div>
              </div>

              {/* Status and Action bar */}
              <div className="border-t border-slate-100 pt-3 mt-2">
                {asset.loan_status === 'Dipinjam' && asset.active_loan ? (
                  <div className="space-y-3">
                    <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 text-[11px]">
                      <p className="text-amber-800 font-bold flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> SEDANG DIPINJAM</p>
                      <p className="text-slate-600 mt-1.5">Peminjam: <span className="font-bold">{asset.active_loan.borrower_name}</span></p>
                      <p className="text-slate-500 font-mono text-[10px] mt-0.5">Mulai: {asset.active_loan.loan_date}</p>
                    </div>
                    <button
                      onClick={() => handleReturnAsset(asset.active_loan!.id)}
                      className="w-full bg-slate-100 border border-slate-200 hover:bg-slate-200 hover:border-slate-300 text-slate-700 text-[11px] font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCcw className="w-3.5 h-3.5" />
                      Proses Pengembalian
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="bg-emerald-50 text-brand-emerald text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> TERSEDIA
                    </span>
                    <button
                      onClick={() => {
                        setSelectedAsset(asset);
                        setIsLoanModalOpen(true);
                      }}
                      className="bg-brand-emerald hover:bg-brand-emerald-dark text-white text-[11px] font-bold py-1.5 px-3.5 rounded-xl shadow-md shadow-emerald-800/5 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Pinjamkan
                    </button>
                  </div>
                )}
              </div>

            </div>
          ))
        )}
      </div>

      {/* ASSET CREATOR MODAL */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-brand-emerald" />
                <h4 className="font-display font-bold text-base text-slate-800">Daftarkan Aset Baru</h4>
              </div>
              <button onClick={() => setIsAssetModalOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAsset} className="p-6 space-y-4">
              {formError && <div className="bg-red-50 p-3 text-red-700 rounded-xl text-xs font-semibold">{formError}</div>}
              {formSuccess && <div className="bg-emerald-50 p-3 text-brand-emerald rounded-xl text-xs font-bold">{formSuccess}</div>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Kode Barang*</label>
                  <input type="text" required placeholder="INV-MWC-..." value={code} onChange={(e) => setCode(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-brand-emerald font-mono uppercase" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Kategori*</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-brand-emerald">
                    <option value="Elektronik">Elektronik</option>
                    <option value="Audio">Audio</option>
                    <option value="Perlengkapan Luar Ruang">Alat Outdoor/Tenda</option>
                    <option value="Perabotan Kantor">Furniture/Perabotan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Nama Barang*</label>
                <input type="text" required placeholder="Contoh: Meja Rapat Kayu Jati" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-brand-emerald" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Jumlah (Unit / Pcs)*</label>
                  <input type="number" min="1" required placeholder="1" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-brand-emerald font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Kondisi Fisik*</label>
                  <select value={condition} onChange={(e) => setCondition(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-brand-emerald">
                    <option value="Baik">BAIK (SIAP PAKAI)</option>
                    <option value="Rusak Ringan">RUSAK RINGAN</option>
                    <option value="Rusak Berat">RUSAK BERAT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Lokasi Penyimpanan Gudang*</label>
                <input type="text" required placeholder="Contoh: Lemari Arsip Ruang Utama" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-brand-emerald" />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Upload Foto Inventaris</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 hover:border-brand-emerald rounded-xl p-2.5 text-xs text-slate-600 font-medium transition-all flex items-center justify-center gap-2">
                      <Upload className="w-4 h-4 text-brand-emerald" />
                      <span>{photoUrl ? 'Ganti File Foto' : 'Pilih File Foto (PNG / JPG)'}</span>
                      <input type="file" accept="image/*" onChange={handlePhotoFileChange} className="hidden" />
                    </label>
                  </div>
                  {photoUrl && (
                    <div className="relative w-full h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                      <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button 
                        type="button" 
                        onClick={() => setPhotoUrl('')}
                        className="absolute top-2 right-2 bg-slate-900/70 hover:bg-red-600 text-white p-1 rounded-full text-xs transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Catatan Tambahan</label>
                <textarea placeholder="Contoh: Sumbangan dari bupati garut..." value={assetNotes} onChange={(e) => setAssetNotes(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:border-brand-emerald" rows={2} />
              </div>

              <button type="submit" className="w-full bg-brand-emerald text-white font-semibold py-3 rounded-xl hover:bg-brand-emerald-dark transition-all text-xs active:scale-95 cursor-pointer">
                Daftarkan Barang
              </button>
            </form>
          </div>
        </div>
      )}

      {/* LOAN REGISTER MODAL */}
      {isLoanModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-emerald" />
                <h4 className="font-display font-bold text-base text-slate-800">Formulir Pinjam Aset</h4>
              </div>
              <button onClick={() => { setIsLoanModalOpen(false); setSelectedAsset(null); }} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBorrowAsset} className="p-6 space-y-4">
              {formError && <div className="bg-red-50 p-3 text-red-700 rounded-xl text-xs font-semibold">{formError}</div>}
              {formSuccess && <div className="bg-emerald-50 p-3 text-brand-emerald rounded-xl text-xs font-bold">{formSuccess}</div>}

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-xs">
                <p className="text-slate-400 font-mono text-[9px] uppercase">Aset yang dipinjam</p>
                <p className="font-bold text-slate-800 mt-0.5">{selectedAsset.name} ({selectedAsset.code})</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Nama Lengkap Peminjam*</label>
                <input type="text" required placeholder="Contoh: Ust. Jajang (Ranting Karangmulya)" value={borrowerName} onChange={(e) => setBorrowerName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-brand-emerald" />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">No. HP / WA Peminjam</label>
                <input type="text" placeholder="08..." value={borrowerPhone} onChange={(e) => setBorrowerPhone(e.target.value.replace(/\D/g, ''))} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-brand-emerald font-mono" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Mulai Pinjam*</label>
                  <input type="date" required value={loanDate} onChange={(e) => setLoanDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-brand-emerald font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Estimasi Kembali</label>
                  <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-brand-emerald font-mono" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Catatan Peminjaman</label>
                <textarea placeholder="Contoh: Dipinjam untuk pengajian bulanan Kp. Sawah..." value={loanNotes} onChange={(e) => setLoanNotes(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:border-brand-emerald" rows={2} />
              </div>

              <button type="submit" className="w-full bg-brand-emerald text-white font-semibold py-3 rounded-xl hover:bg-brand-emerald-dark transition-all text-xs active:scale-95 cursor-pointer">
                Konfirmasi Peminjaman Aset
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
