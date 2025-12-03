import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import Dashboard from './components/Dashboard';
import InventoryManager from './components/InventoryManager';
import TransactionManager from './components/TransactionManager';
import OrderManager from './components/OrderManager';
import Reports from './components/Reports';
import { 
  LayoutDashboard, 
  Package, 
  ArrowLeftRight, 
  FileBarChart, 
  Settings, 
  Users,
  Menu,
  X,
  LogOut,
  Bell,
  ClipboardList,
  Moon,
  Sun
} from 'lucide-react';
import { CompanySettings, Partner } from './types';

// Components defined inline to fit constraints (Settings, Partners)
const PartnersManager: React.FC = () => {
  const { partners, addPartner, deletePartner } = useInventory();
  const [formData, setFormData] = useState<Partial<Partner>>({ name: '', type: 'CUSTOMER', contact: '', address: '', email: '' });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPartner({ id: crypto.randomUUID(), ...formData } as Partner);
    setFormData({ name: '', type: 'CUSTOMER', contact: '', address: '', email: '' });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Data Supplier & Customer</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700 h-fit transition-colors">
          <h3 className="font-bold mb-4 text-gray-800 dark:text-gray-100">Tambah Partner</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
             <input required placeholder="Nama Perusahaan/Orang" className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
             <select className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                <option value="CUSTOMER">Customer</option>
                <option value="SUPPLIER">Supplier</option>
             </select>
             <input placeholder="Kontak (HP)" className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
             <input placeholder="Alamat" className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
             <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors">Simpan</button>
          </form>
        </div>
        <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 overflow-hidden transition-colors">
          <table className="w-full text-sm text-left text-gray-800 dark:text-gray-200">
            <thead className="bg-gray-50 dark:bg-slate-700 border-b dark:border-slate-600"><tr><th className="p-3">Nama</th><th className="p-3">Tipe</th><th className="p-3">Kontak</th><th className="p-3">Aksi</th></tr></thead>
            <tbody className="divide-y dark:divide-slate-700">
              {partners.map(p => (
                <tr key={p.id} className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  <td className="p-3">{p.name}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded ${p.type === 'SUPPLIER' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200' : 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-200'}`}>{p.type}</span></td>
                  <td className="p-3">{p.contact}</td>
                  <td className="p-3"><button onClick={() => deletePartner(p.id)} className="text-red-500 hover:text-red-600">Hapus</button></td>
                </tr>
              ))}
              {partners.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-400 dark:text-slate-500">Belum ada data.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SettingsView: React.FC = () => {
  const { settings, updateSettings, resetData } = useInventory();
  const [data, setData] = useState<CompanySettings>(settings);

  const handleSave = () => {
    updateSettings(data);
    alert('Pengaturan disimpan.');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Pengaturan Perusahaan</h1>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700 space-y-4 transition-colors">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Perusahaan</label>
          <input type="text" className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Alamat</label>
          <textarea className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white" value={data.address} onChange={e => setData({...data, address: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telepon</label>
          <input type="text" className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white" value={data.phone} onChange={e => setData({...data, phone: e.target.value})} />
        </div>
         <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mata Uang</label>
          <input type="text" className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white" value={data.currency} onChange={e => setData({...data, currency: e.target.value})} />
        </div>
        <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors">Simpan Perubahan</button>
      </div>

      <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-100 dark:border-red-900/30">
        <h3 className="text-red-800 dark:text-red-400 font-bold mb-2">Zona Bahaya</h3>
        <p className="text-sm text-red-600 dark:text-red-300 mb-4">Menghapus semua data produk, transaksi, dan partner. Tidak dapat dikembalikan.</p>
        <button onClick={resetData} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center transition-colors">
          <LogOut size={16} className="mr-2" /> Reset Aplikasi
        </button>
      </div>
    </div>
  );
};

const Layout: React.FC = () => {
  const [activeView, setActiveView] = useState('DASHBOARD');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { settings, getDashboardStats, theme, toggleTheme } = useInventory();
  const stats = getDashboardStats();

  const NavItem = ({ view, icon: Icon, label }: any) => (
    <button
      onClick={() => { setActiveView(view); setSidebarOpen(false); }}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
        activeView === view 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white dark:bg-slate-800 border-r dark:border-slate-700 z-30 transform transition-all duration-200 ease-in-out md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} no-print`}>
        <div className="p-6 border-b dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
            <Package className="mr-2 text-blue-600" /> InventoryMGT
          </h2>
          <p className="text-xs text-slate-400 mt-1 truncate">{settings.name}</p>
        </div>
        <nav className="p-4 space-y-2">
          <NavItem view="DASHBOARD" icon={LayoutDashboard} label="Dashboard" />
          <NavItem view="INVENTORY" icon={Package} label="Stok Barang" />
          <NavItem view="ORDERS" icon={ClipboardList} label="Pesanan (PO/SO)" />
          <NavItem view="TRANSACTIONS" icon={ArrowLeftRight} label="Transaksi" />
          <NavItem view="PARTNERS" icon={Users} label="Partner" />
          <NavItem view="REPORTS" icon={FileBarChart} label="Laporan" />
          <NavItem view="SETTINGS" icon={Settings} label="Pengaturan" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors">
        <header className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 h-16 flex items-center px-6 justify-between shrink-0 no-print transition-colors">
          <button className="md:hidden text-slate-600 dark:text-slate-300" onClick={() => setSidebarOpen(true)}>
            <Menu />
          </button>
          <div className="ml-auto flex items-center space-x-4">
             {/* Theme Toggle */}
             <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
             >
               {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
             </button>

             {/* Notifikasi Stok Menipis di Header */}
             <button 
               onClick={() => setActiveView('DASHBOARD')}
               className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full mr-2 transition-colors"
               title={stats.lowStock > 0 ? `${stats.lowStock} barang perlu restock!` : "Tidak ada notifikasi"}
             >
               <Bell size={20} />
               {stats.lowStock > 0 && (
                 <span className="absolute top-1 right-1 h-4 w-4 bg-red-600 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-[10px] text-white font-bold animate-pulse">
                   {stats.lowStock > 9 ? '9+' : stats.lowStock}
                 </span>
               )}
             </button>

             <span className="text-sm text-slate-500 dark:text-slate-400 hidden md:inline-block">Welcome, Admin</span>
             <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold">A</div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {activeView === 'DASHBOARD' && <Dashboard />}
          {activeView === 'INVENTORY' && <InventoryManager />}
          {activeView === 'TRANSACTIONS' && <TransactionManager />}
          {activeView === 'ORDERS' && <OrderManager />}
          {activeView === 'PARTNERS' && <PartnersManager />}
          {activeView === 'REPORTS' && <Reports />}
          {activeView === 'SETTINGS' && <SettingsView />}
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <InventoryProvider>
      <Layout />
    </InventoryProvider>
  );
};

export default App;