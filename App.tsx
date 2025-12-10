
import React, { useState, useEffect } from 'react';
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
  Sun,
  Lock,
  User as UserIcon,
  ShieldCheck,
  Key,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Save
} from 'lucide-react';
import { CompanySettings, Partner, Role, User } from './types';

// Components defined inline to fit constraints (Settings, Partners)
const PartnersManager: React.FC = () => {
  const { partners, addPartner, deletePartner, currentUser } = useInventory();
  const [formData, setFormData] = useState<Partial<Partner>>({ name: '', type: 'CUSTOMER', contact: '', address: '', email: '' });
  
  // RBAC: Only ADMIN can manage partners
  const canManage = currentUser?.role === 'ADMIN';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPartner({ id: crypto.randomUUID(), ...formData } as Partner);
    setFormData({ name: '', type: 'CUSTOMER', contact: '', address: '', email: '' });
  };

  if (!canManage) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Data Supplier & Customer</h1>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 overflow-hidden transition-colors">
          <table className="w-full text-sm text-left text-gray-800 dark:text-gray-200">
            <thead className="bg-gray-50 dark:bg-slate-700 border-b dark:border-slate-600"><tr><th className="p-3">Nama</th><th className="p-3">Tipe</th><th className="p-3">Kontak</th></tr></thead>
            <tbody className="divide-y dark:divide-slate-700">
              {partners.map(p => (
                <tr key={p.id} className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  <td className="p-3">{p.name}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded ${p.type === 'SUPPLIER' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200' : 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-200'}`}>{p.type}</span></td>
                  <td className="p-3">{p.contact}</td>
                </tr>
              ))}
              {partners.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-gray-400 dark:text-slate-500">Belum ada data.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

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
  const { settings, updateSettings, resetData, currentUser, users, addUser, updateUser, deleteUser } = useInventory();
  const [data, setData] = useState<CompanySettings>(settings);
  
  // User Management States
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState<Partial<User>>({ username: '', name: '', role: 'INVENTORY', password: '' });

  // RBAC: Only ADMIN can access settings
  if (currentUser?.role !== 'ADMIN') {
    return <div className="p-8 text-center text-red-500 font-bold">Anda tidak memiliki akses ke halaman ini.</div>;
  }

  const handleSaveSettings = () => {
    updateSettings(data);
    alert('Pengaturan disimpan.');
  };

  // User CRUD Handlers
  const handleOpenUserModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setUserFormData({ ...user }); // Password populated, can be changed
    } else {
      setEditingUser(null);
      setUserFormData({ username: '', name: '', role: 'INVENTORY', password: '' });
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
      // Edit mode
      updateUser(userFormData as User);
      alert(`User ${userFormData.username} berhasil diperbarui.`);
    } else {
      // Add mode - check duplicate
      if (users.some(u => u.username === userFormData.username)) {
        alert("Username sudah terpakai!");
        return;
      }
      addUser(userFormData as User);
      alert(`User ${userFormData.username} berhasil ditambahkan.`);
    }
    
    setIsUserModalOpen(false);
  };

  const handleDeleteUser = (username: string) => {
    if (confirm(`Hapus user ${username}?`)) {
      deleteUser(username);
    }
  };

  const roles: Role[] = ['ADMIN', 'INVENTORY', 'PPIC', 'PROJECT', 'MANAGER'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Pengaturan Sistem</h1>
      
      {/* 1. General Settings */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700 space-y-4 transition-colors">
        <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2 flex items-center">
          <Settings size={20} className="mr-2 text-gray-500"/> Informasi Perusahaan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Perusahaan</label>
            <input type="text" className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telepon</label>
            <input type="text" className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white" value={data.phone} onChange={e => setData({...data, phone: e.target.value})} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Alamat</label>
            <textarea className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white" rows={2} value={data.address} onChange={e => setData({...data, address: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mata Uang</label>
            <input type="text" className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white" value={data.currency} onChange={e => setData({...data, currency: e.target.value})} />
          </div>
        </div>
        <div className="pt-2">
          <button onClick={handleSaveSettings} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors shadow-sm">Simpan Perubahan</button>
        </div>
      </div>

      {/* 2. User Accounts Management */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-900/30">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-blue-800 dark:text-blue-300 font-bold flex items-center">
              <Users size={20} className="mr-2"/> Manajemen Pengguna
            </h3>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              Tambah, edit, atau hapus akses pengguna aplikasi.
            </p>
          </div>
          <button 
            onClick={() => handleOpenUserModal()} 
            className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center shadow-sm"
          >
            <Plus size={16} className="mr-1"/> Tambah User
          </button>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden border dark:border-slate-600 shadow-sm">
          <table className="w-full text-sm text-left text-gray-800 dark:text-gray-200">
            <thead className="bg-gray-100 dark:bg-slate-700 border-b dark:border-slate-600">
              <tr>
                <th className="p-3">Username</th>
                <th className="p-3">Nama</th>
                <th className="p-3">Role (Akses)</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-700">
              {users.map((u) => (
                <tr key={u.username} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                   <td className="p-3 font-bold">{u.username}</td>
                   <td className="p-3">{u.name}</td>
                   <td className="p-3">
                     <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded inline-block 
                       ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 
                         u.role === 'MANAGER' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300' :
                         'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                       {u.role}
                     </span>
                   </td>
                   <td className="p-3 text-center">
                     <div className="flex justify-center space-x-2">
                       <button 
                         onClick={() => handleOpenUserModal(u)} 
                         className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded" 
                         title="Edit Password / Role"
                       >
                         <Edit size={16} />
                       </button>
                       {u.username !== currentUser?.username && (
                         <button 
                           onClick={() => handleDeleteUser(u.username)} 
                           className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded" 
                           title="Hapus User"
                         >
                           <Trash2 size={16} />
                         </button>
                       )}
                     </div>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Danger Zone */}
      <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-100 dark:border-red-900/30">
        <h3 className="text-red-800 dark:text-red-400 font-bold mb-2 flex items-center">
          <AlertTriangle size={20} className="mr-2"/> Zona Bahaya
        </h3>
        <p className="text-sm text-red-600 dark:text-red-300 mb-4">
          Tindakan ini akan menghapus <strong>SEMUA</strong> data produk, transaksi, riwayat stok, dan partner dari aplikasi. Data yang dihapus tidak dapat dikembalikan.
        </p>
        <button onClick={resetData} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center transition-colors shadow-sm">
          <LogOut size={16} className="mr-2" /> Reset Seluruh Data Aplikasi
        </button>
      </div>

      {/* USER MODAL */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md shadow-xl border dark:border-slate-700">
             <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
               {editingUser ? 'Edit User' : 'Tambah User Baru'}
             </h3>
             <form onSubmit={handleSaveUser} className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                 <input 
                   required 
                   type="text" 
                   disabled={!!editingUser}
                   className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white disabled:opacity-50"
                   value={userFormData.username}
                   onChange={e => setUserFormData({...userFormData, username: e.target.value})}
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Lengkap</label>
                 <input 
                   required 
                   type="text" 
                   className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white"
                   value={userFormData.name}
                   onChange={e => setUserFormData({...userFormData, name: e.target.value})}
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role / Hak Akses</label>
                 <select 
                   className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white"
                   value={userFormData.role}
                   onChange={e => setUserFormData({...userFormData, role: e.target.value as Role})}
                 >
                   {roles.map(r => <option key={r} value={r}>{r}</option>)}
                 </select>
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                   Password {editingUser && '(Isi untuk mengubah)'}
                 </label>
                 <div className="relative">
                    <Key size={16} className="absolute left-3 top-2.5 text-gray-400"/>
                    <input 
                      required={!editingUser} 
                      type="text" 
                      className="w-full border dark:border-slate-600 rounded p-2 pl-9 bg-white dark:bg-slate-700 dark:text-white"
                      value={userFormData.password}
                      onChange={e => setUserFormData({...userFormData, password: e.target.value})}
                      placeholder={editingUser ? "Biarkan kosong jika tidak diubah" : "Password baru"}
                    />
                 </div>
               </div>
               
               <div className="flex justify-end gap-3 pt-4">
                 <button 
                   type="button" 
                   onClick={() => setIsUserModalOpen(false)} 
                   className="px-4 py-2 border dark:border-slate-600 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                 >
                   Batal
                 </button>
                 <button 
                   type="submit" 
                   className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                 >
                   <Save size={16} className="mr-2" /> Simpan
                 </button>
               </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

const LoginView: React.FC = () => {
  const { login } = useInventory();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(username, password);
    if (!success) {
      setError('Username atau Password salah!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border dark:border-slate-700 overflow-hidden animate-[fadeIn_0.5s_ease-out]">
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <div className="p-8">
           <div className="flex justify-center mb-6">
             <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center transform rotate-3 shadow-lg shadow-blue-600/30">
               <Package size={32} className="text-white" />
             </div>
           </div>
           <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-1">InventoryMGT</h2>
           <p className="text-center text-gray-500 dark:text-gray-400 mb-8 text-sm">Masuk untuk mengelola gudang Anda</p>

           {error && (
             <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-2 rounded-lg mb-4 text-sm font-medium flex items-center">
               <AlertTriangle size={16} className="mr-2"/> {error}
             </div>
           )}

           <form onSubmit={handleLogin} className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
               <div className="relative">
                 <UserIcon size={18} className="absolute left-3 top-2.5 text-gray-400" />
                 <input 
                   type="text" 
                   value={username}
                   onChange={e => setUsername(e.target.value)}
                   className="w-full pl-10 pr-4 py-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                   placeholder="Masukkan username"
                 />
               </div>
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
               <div className="relative">
                 <Lock size={18} className="absolute left-3 top-2.5 text-gray-400" />
                 <input 
                   type="password" 
                   value={password}
                   onChange={e => setPassword(e.target.value)}
                   className="w-full pl-10 pr-4 py-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                   placeholder="••••••"
                 />
               </div>
             </div>
             <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 mt-2">
               Masuk
             </button>
           </form>
        </div>
        <div className="bg-gray-50 dark:bg-slate-700/50 p-4 text-center border-t dark:border-slate-700">
           <p className="text-xs text-gray-400 dark:text-gray-500">
             &copy; {new Date().getFullYear()} PT Modular Global Tekindo. <br/>Hubungi Admin untuk akses akun.
           </p>
        </div>
      </div>
    </div>
  );
};

const Layout: React.FC = () => {
  const [activeView, setActiveView] = useState('DASHBOARD');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { settings, getDashboardStats, theme, toggleTheme, currentUser, logout } = useInventory();
  const stats = getDashboardStats();

  // If no user is logged in, show Login View
  if (!currentUser) {
    return <LoginView />;
  }

  // Define Menu Items with Role Based Access Control logic
  const menuItems = [
    { id: 'DASHBOARD', icon: LayoutDashboard, label: 'Dashboard', roles: ['ADMIN', 'MANAGER', 'INVENTORY', 'PPIC', 'PROJECT'] },
    { id: 'INVENTORY', icon: Package, label: 'Stok Barang', roles: ['ADMIN', 'MANAGER', 'INVENTORY', 'PPIC'] },
    { id: 'ORDERS', icon: ClipboardList, label: 'Pesanan (PO/SO)', roles: ['ADMIN', 'MANAGER', 'PROJECT'] },
    { id: 'TRANSACTIONS', icon: ArrowLeftRight, label: 'Transaksi', roles: ['ADMIN', 'MANAGER', 'INVENTORY'] },
    { id: 'PARTNERS', icon: Users, label: 'Partner', roles: ['ADMIN', 'MANAGER', 'INVENTORY'] },
    { id: 'REPORTS', icon: FileBarChart, label: 'Laporan', roles: ['ADMIN', 'MANAGER'] },
    { id: 'SETTINGS', icon: Settings, label: 'Pengaturan', roles: ['ADMIN'] },
  ];

  // Filter menu items based on current user role
  const allowedMenuItems = menuItems.filter(item => item.roles.includes(currentUser.role));

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
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white dark:bg-slate-800 border-r dark:border-slate-700 z-30 transform transition-all duration-200 ease-in-out md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} no-print flex flex-col`}>
        <div className="p-6 border-b dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
            <Package className="mr-2 text-blue-600" /> InventoryMGT
          </h2>
          <p className="text-xs text-slate-400 mt-1 truncate">{settings.name}</p>
        </div>
        
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {allowedMenuItems.map(item => (
            <NavItem key={item.id} view={item.id} icon={item.icon} label={item.label} />
          ))}
        </nav>

        <div className="p-4 border-t dark:border-slate-700">
           <div className="flex items-center gap-3 mb-3 px-2">
             <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold uppercase">
               {currentUser.username.charAt(0)}
             </div>
             <div className="overflow-hidden">
               <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{currentUser.name}</p>
               <p className="text-[10px] uppercase text-gray-500 dark:text-gray-400 flex items-center">
                 <ShieldCheck size={10} className="mr-1"/> {currentUser.role}
               </p>
             </div>
           </div>
           <button onClick={logout} className="w-full flex items-center justify-center space-x-2 p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium transition-colors">
             <LogOut size={16} /> <span>Keluar</span>
           </button>
        </div>
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
