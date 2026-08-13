/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import LandingPage from './views/public/LandingPage';
import LoginPage from './views/auth/LoginPage';
import DashboardPage from './views/admin/DashboardPage';
import SensusPage from './views/admin/SensusPage';
import KeuanganPage from './views/admin/KeuanganPage';
import InventarisPage from './views/admin/InventarisPage';
import AuditLogsPage from './views/admin/AuditLogsPage';
import AgendaPage from './views/admin/AgendaPage';
import DokumenPage from './views/admin/DokumenPage';
import RantingPage from './views/admin/RantingPage';
import WaBlastPage from './views/admin/WaBlastPage';
import UsersPage from './views/admin/UsersPage';
import SettingsPage from './views/admin/SettingsPage';
import BanomPage from './views/admin/BanomPage';
import ChangePasswordModal from './components/ChangePasswordModal';

import { 
  Landmark, LayoutDashboard, Users, Wallet, Package, ShieldAlert, LogOut, Menu, X, Clock, Calendar, Folder, Map, Send, ArrowLeft, Home, UserCheck, Settings, Building2, KeyRound
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const { user, logout, token } = useAuth();
  const { settings } = useSettings();
  
  // Public/Private navigation state
  // Public views: 'landing', 'login'
  // Protected views: 'dashboard', 'sensus', 'keuangan', 'inventaris', 'audit', 'agenda', 'dokumen', 'ranting', 'wa_blast', 'banom'
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'dashboard' | 'sensus' | 'keuangan' | 'inventaris' | 'audit' | 'agenda' | 'dokumen' | 'ranting' | 'wa_blast' | 'banom' | 'users' | 'settings'>('landing');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  // Clock tick effect
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync auth state with currentView
  useEffect(() => {
    if (token && user) {
      if (currentView === 'login') {
        setCurrentView('dashboard');
      }
    } else {
      if (currentView !== 'landing' && currentView !== 'login') {
        setCurrentView('landing');
      }
    }
  }, [token, user]);

  const handleLogout = () => {
    logout();
    setCurrentView('landing');
  };

  // Render active component
  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardPage />;
      case 'sensus':
        return <SensusPage />;
      case 'keuangan':
        return <KeuanganPage />;
      case 'inventaris':
        return <InventarisPage />;
      case 'audit':
        return <AuditLogsPage />;
      case 'agenda':
        return <AgendaPage />;
      case 'dokumen':
        return <DokumenPage />;
      case 'ranting':
        return <RantingPage onBackToDashboard={() => setCurrentView('dashboard')} />;
      case 'banom':
        return <BanomPage onBackToDashboard={() => setCurrentView('dashboard')} />;
      case 'wa_blast':
        return <WaBlastPage />;
      case 'users':
        return <UsersPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  // 1. PUBLIC LANDING VIEW
  if (currentView === 'landing') {
    return (
      <LandingPage 
        onNavigateToLogin={() => setCurrentView(token && user ? 'dashboard' : 'login')} 
        isLoggedIn={!!user} 
        onLogout={handleLogout}
      />
    );
  }

  // 2. PUBLIC LOGIN VIEW
  if (currentView === 'login') {
    return (
      <LoginPage 
        onBackToLanding={() => setCurrentView('landing')} 
        onLoginSuccess={() => setCurrentView('dashboard')} 
      />
    );
  }

  // 3. SECURE WORKSPACE LAYOUT (For authorized users)
  const navItems = [
    { id: 'dashboard', label: 'Dasbor Utama', icon: LayoutDashboard, roles: [] },
    { id: 'sensus', label: 'Sensus Anggota', icon: Users, roles: [] },
    { id: 'wa_blast', label: 'WA Blast Massal', icon: Send, roles: [] },
    { id: 'ranting', label: 'Struktur Ranting (Peta)', icon: Map, roles: [] },
    { id: 'banom', label: 'Banom & Lembaga NU', icon: Building2, roles: [] },
    { id: 'keuangan', label: 'Buku Kas Keuangan', icon: Wallet, roles: [] },
    { id: 'inventaris', label: 'Aset & Inventaris', icon: Package, roles: [] },
    { id: 'agenda', label: 'Agenda & Kegiatan', icon: Calendar, roles: [] },
    { id: 'dokumen', label: 'Dokumen Organisasi', icon: Folder, roles: [] },
    { id: 'audit', label: 'Jejak Audit Security', icon: ShieldAlert, roles: ['Super Admin', 'Ketua MWC', 'Sekretaris'] },
    { id: 'users', label: 'Manajemen Pengguna', icon: UserCheck, roles: ['Super Admin'] },
    { id: 'settings', label: 'Pengaturan MWC NU', icon: Settings, roles: ['Super Admin', 'Ketua MWC', 'Sekretaris'] }
  ];

  const filteredNavItems = navItems.filter(item => {
    if (item.roles.length === 0) return true;
    return user && item.roles.includes(user.role);
  });

  return (
    <div className="h-screen w-screen bg-[#f8faf9] flex font-sans text-slate-800 overflow-hidden">
      
      {/* MOBILE DRAWER BACKDROP */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* LEFT SIDEBAR PANEL */}
      <aside className={`
        fixed inset-y-0 left-0 bg-gradient-to-b from-brand-emerald-dark to-emerald-950 text-white w-64 p-6 z-50 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:flex-shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="space-y-6">
          
          {/* Sidebar Brand Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white p-1 rounded-xl w-10 h-10 flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-emerald-950/20">
                {settings?.logo_url ? (
                  <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <img src="/uploads/nahdlatul_ulama_logo.svg" alt="Logo NU" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
                )}
              </div>
              <div className="text-left min-w-0">
                <h2 className="font-display font-extrabold text-xs tracking-tight text-white leading-tight truncate">
                  {settings?.name || 'SIM MWC NU'}
                </h2>
                <p className="text-[8px] font-mono uppercase tracking-wider text-emerald-300 font-semibold truncate">
                  Portal Sistem
                </p>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)} 
              className="p-1.5 hover:bg-white/10 rounded-lg lg:hidden cursor-pointer"
            >
              <X className="w-4 h-4 text-emerald-100" />
            </button>
          </div>

          {/* Connected User Badge profile */}
          {user && (
            <div className="bg-white/5 border border-white/5 p-3 rounded-xl space-y-1.5 text-left">
              <p className="text-[10px] font-mono uppercase text-emerald-300 font-bold tracking-wider">PENGURUS AKTIF</p>
              <div>
                <p className="font-bold text-xs text-white truncate">{user.name}</p>
                <span className="inline-block bg-brand-gold/20 text-yellow-300 border border-brand-gold/15 text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide mt-1">
                  {user.role === 'Viewer' ? "Jama'ah" : user.role}
                </span>
              </div>
              <p className="text-[9px] font-medium text-slate-300 truncate">
                {user.ranting_name || user.banom_name || 'Tingkat MWC'}
              </p>
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="w-full mt-1 bg-white/10 hover:bg-white/20 text-emerald-100 hover:text-white border border-white/10 py-1 px-2 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <KeyRound className="w-3 h-3 text-brand-gold" />
                <span>Ganti Password</span>
              </button>
            </div>
          )}

          {/* Navigation Items Link */}
          <nav className="space-y-1" id="sidebar-nav">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id as any);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-white/10 text-white border-l-4 border-emerald-400 pl-3 shadow-xs font-bold' 
                      : 'text-emerald-100/80 hover:bg-white/5 hover:text-white px-4'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

        </div>

        {/* BOTTOM WORKSPACE ACTION (Logout) */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <button
            onClick={handleLogout}
            className="w-full bg-red-950/40 hover:bg-red-950/60 text-red-300 hover:text-red-100 border border-red-900/30 font-semibold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Keluar (Logout)
          </button>
          <div className="text-[9px] font-mono text-emerald-500 text-center uppercase tracking-widest">
            SIM v1.0 &bull; 3NF Mode
          </div>
        </div>

      </aside>

      {/* RIGHT SIDE WORKSPACE MAIN PANEL */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* TOP HEADER BAR */}
        <header className="bg-white border-b border-slate-150 h-16 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-500 lg:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {currentView !== 'dashboard' && (
              <button
                onClick={() => setCurrentView('dashboard')}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-emerald bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-brand-emerald" />
                <span>Menu Utama (Dasbor)</span>
              </button>
            )}

            <div className="hidden lg:flex items-center gap-1 text-xs text-slate-400 font-medium">
              <span>Sistem Informasi MWC NU</span>
              <span>&bull;</span>
              <span className="text-brand-emerald font-semibold uppercase tracking-wider font-mono">INTERNAL PORTAL</span>
            </div>
          </div>

          {/* DYNAMIC CLOCK & LOGOUT ACTION */}
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-150 rounded-xl px-3.5 py-1.5 font-mono text-xs">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{time.toLocaleTimeString('id-ID')}</span>
              <span className="text-slate-300">|</span>
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">{time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span className="md:hidden">{time.toLocaleDateString('id-ID')}</span>
            </div>

            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="bg-emerald-50 hover:bg-emerald-100 text-brand-emerald border border-emerald-200 hover:border-emerald-300 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Ganti Password Akun"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ganti Password</span>
            </button>

            <button
              onClick={handleLogout}
              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Keluar / Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>

        </header>

        {/* WORKSPACE CONTENT SHELF WITH ANIMATION */}
        <main className="flex-grow p-6 md:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="max-w-7xl mx-auto"
            >
              {renderActiveView()}
            </motion.div>
          </AnimatePresence>
        </main>

      </div>

      {/* CHANGE PASSWORD MODAL */}
      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
