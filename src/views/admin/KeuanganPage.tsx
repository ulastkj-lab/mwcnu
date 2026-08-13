/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  TrendingUp, TrendingDown, Wallet, Plus, X, Search, FileText, CheckCircle2, AlertCircle, Calendar, Sparkles
} from 'lucide-react';

interface Transaction {
  id: number;
  type: 'Masuk' | 'Keluar';
  category: string;
  amount: number;
  transaction_date: string;
  description: string;
  created_at: string;
}

interface FinancialSummary {
  total_income: number;
  total_expense: number;
  current_balance: number;
}

export default function KeuanganPage() {
  const { token, hasRole } = useAuth();
  const { successToast, errorToast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    total_income: 0,
    total_expense: 0,
    current_balance: 0
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [type, setType] = useState<'Masuk' | 'Keluar'>('Masuk');
  const [category, setCategory] = useState('Infaq Sensus KTA');
  const [customCategory, setCustomCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const loadLedger = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/keuangan', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const result = await response.json();
        setTransactions(result.data.transactions || []);
        setSummary(result.data.summary);
      }
    } catch (err) {
      console.error('Failed to load financial records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const txAmount = Number(amount);
    if (!txAmount || txAmount <= 0) {
      setFormError('Nominal jumlah uang harus lebih besar dari Rp 0.');
      return;
    }

    const finalCategory = category === 'Lainnya' ? customCategory.trim() : category;
    if (!finalCategory) {
      setFormError('Kategori transaksi wajib ditentukan.');
      return;
    }

    try {
      const response = await fetch('/api/keuangan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type,
          category: finalCategory,
          amount: txAmount,
          transaction_date: date,
          description
        })
      });

      const result = await response.json();
      if (result.success) {
        setFormSuccess('Pencatatan kas keuangan berhasil dibukukan!');
        successToast('Pencatatan kas keuangan berhasil dibukukan!');
        setTimeout(() => {
          setIsModalOpen(false);
          setAmount('');
          setDescription('');
          setCustomCategory('');
          setFormSuccess('');
          loadLedger();
        }, 1000);
      } else {
        const errorMsg = result.message || 'Gagal menyimpan transaksi.';
        setFormError(errorMsg);
        errorToast(errorMsg);
      }
    } catch (err) {
      setFormError('Gangguan jaringan. Silakan coba kembali.');
      errorToast('Gangguan jaringan. Silakan coba kembali.');
    }
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  // Filter transactions in client side
  const filteredTxs = transactions.filter(t => 
    t.category.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-emerald-950">Buku Kas Keuangan MWC</h2>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">Transparansi neraca anggaran, infaq KTA, donatur tetap, LAZISNU, serta laporan pengeluaran operasional.</p>
        </div>

        {hasRole(['Bendahara', 'Super Admin', 'Operator']) && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-brand-emerald text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-emerald-800/10 hover:bg-brand-emerald-dark transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Catat Transaksi Kas
          </button>
        )}
      </div>

      {/* BALANCE CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* TOTAL INCOME */}
        <div className="bg-white p-6 border border-slate-150 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400">Total Kas Pemasukan</span>
            <p className="text-2xl font-bold font-display text-emerald-600">{formatRupiah(summary.total_income)}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* TOTAL EXPENSE */}
        <div className="bg-white p-6 border border-slate-150 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400">Total Kas Pengeluaran</span>
            <p className="text-2xl font-bold font-display text-red-600">{formatRupiah(summary.total_expense)}</p>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-full">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* NET BALANCE */}
        <div className="bg-gradient-to-br from-brand-emerald to-emerald-900 p-6 text-white rounded-2xl shadow-md shadow-emerald-950/10 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-emerald-200">Saldo Kas Saat Ini (3NF)</span>
            <p className="text-2xl font-bold font-display text-yellow-300">{formatRupiah(summary.current_balance)}</p>
          </div>
          <div className="p-3 bg-white/10 text-white rounded-full">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* LEDGER TABLE CARD */}
      <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-sm">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <h3 className="font-bold text-slate-800 text-sm font-display flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            Jurnal Buku Besar Keuangan
          </h3>
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari kategori atau deskripsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-brand-emerald focus:ring-1 focus:ring-emerald-500/10 rounded-xl py-1.5 pl-9 pr-4 text-xs font-medium outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Memuat laporan neraca, harap tunggu...</div>
        ) : filteredTxs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">Tidak ada transaksi keuangan terdaftar.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-mono border-b border-slate-100 uppercase tracking-wider text-[10px]">
                  <th className="py-4 px-6 font-semibold">Tanggal Transaksi</th>
                  <th className="py-4 px-6 font-semibold">Jenis</th>
                  <th className="py-4 px-6 font-semibold">Kategori Anggaran</th>
                  <th className="py-4 px-6 font-semibold">Deskripsi Laporan</th>
                  <th className="py-4 px-6 font-semibold text-right">Jumlah Uang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredTxs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-mono text-slate-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{tx.transaction_date}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {tx.type === 'Masuk' ? (
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">KAS MASUK</span>
                      ) : (
                        <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">KAS KELUAR</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-800 font-bold">{tx.category}</td>
                    <td className="py-4 px-6 text-slate-600 max-w-sm font-normal leading-relaxed">{tx.description}</td>
                    <td className={`py-4 px-6 text-right font-mono text-sm font-bold ${tx.type === 'Masuk' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {tx.type === 'Masuk' ? '+' : '-'} {formatRupiah(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CASH TRANSACTION CREATOR MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-brand-emerald" />
                <h4 className="font-display font-bold text-base text-slate-800">Catat Transaksi Kas Baru</h4>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {formError && (
                <div className="bg-red-50 border border-red-100 p-3.5 rounded-xl flex gap-2.5 text-red-700 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p>{formError}</p>
                </div>
              )}

              {formSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl flex gap-2.5 text-brand-emerald text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <p>{formSuccess}</p>
                </div>
              )}

              {/* Type selector */}
              <div className="grid grid-cols-2 gap-2 text-xs font-bold font-mono tracking-wider text-center">
                <button
                  type="button"
                  onClick={() => setType('Masuk')}
                  className={`py-2.5 rounded-xl border transition-all cursor-pointer ${
                    type === 'Masuk' 
                      ? 'bg-emerald-50 border-brand-emerald text-brand-emerald font-extrabold shadow-sm' 
                      : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  KAS MASUK (+)
                </button>
                <button
                  type="button"
                  onClick={() => setType('Keluar')}
                  className={`py-2.5 rounded-xl border transition-all cursor-pointer ${
                    type === 'Keluar' 
                      ? 'bg-red-50 border-red-500 text-red-600 font-extrabold shadow-sm' 
                      : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  KAS KELUAR (-)
                </button>
              </div>

              {/* Category selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Kategori Transaksi</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-brand-emerald"
                >
                  {type === 'Masuk' ? (
                    <>
                      <option value="Infaq Sensus KTA">Infaq Sensus KTA</option>
                      <option value="Donatur Tetap">Donatur Tetap (Sumbangan/Hibah)</option>
                      <option value="Koin NU LAZISNU">Koin NU LAZISNU</option>
                      <option value="Sewa Inventaris">Penerimaan Sewa Inventaris</option>
                      <option value="Lainnya">Kategori Lainnya...</option>
                    </>
                  ) : (
                    <>
                      <option value="Operasional Kantor">Operasional Kantor (ATK/Konsumsi)</option>
                      <option value="Bantuan Sosial">Bantuan Sosial (Santunan Bencana/Sakit)</option>
                      <option value="Pemeliharaan Aset">Pemeliharaan Aset & Inventaris</option>
                      <option value="Kegiatan Pengajian">Biaya Kegiatan (Lailatul Ijtima/Rapat)</option>
                      <option value="Lainnya">Kategori Lainnya...</option>
                    </>
                  )}
                </select>
              </div>

              {/* Custom Category Input if 'Lainnya' chosen */}
              {category === 'Lainnya' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Nama Kategori Baru</label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan nama kategori transaksi..."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-brand-emerald"
                  />
                </div>
              )}

              {/* Amount input */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Nominal Uang (Rupiah)</label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 1500000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none focus:border-brand-emerald font-mono"
                />
              </div>

              {/* Date Input */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Tanggal Buku Kas</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-brand-emerald font-mono"
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Keterangan / Deskripsi Transaksi</label>
                <textarea
                  placeholder="Contoh: Pembelian tinta proyektor dan konsumsi rapat koordinasi..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:border-brand-emerald"
                  rows={2}
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="w-full bg-brand-emerald text-white font-semibold py-3 rounded-xl hover:bg-brand-emerald-dark transition-all text-xs active:scale-95 cursor-pointer shadow-md shadow-emerald-800/10"
              >
                Bukukan Jurnal Transaksi
              </button>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
