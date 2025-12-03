
import React, { useMemo, useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Package, DollarSign, 
  ArrowUpRight, ArrowDownRight, MapPin, Calendar, 
  Activity, Clock, PlusCircle, ShoppingCart, AlertTriangle, CheckCircle,
  Wallet, Layers, Box, Database
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { products, transactions, locations, settings, theme } = useInventory();

  // --- SMART CURRENCY FORMATTER ---
  const formatCurrency = (value: number, short = false) => {
    if (short) {
      if (value >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(2)} T`;
      if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)} M`;
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} Jt`;
      if (value >= 1_000) return `${(value / 1_000).toFixed(0)} rb`;
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // --- DATE FILTER STATE ---
  const today = new Date();
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const defaultEnd = today.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  // Helper Preset
  const setPreset = (type: 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR') => {
    const end = new Date();
    let start = new Date();
    
    if (type === 'TODAY') {
      // same day
    } else if (type === 'WEEK') {
      start.setDate(end.getDate() - 7);
    } else if (type === 'MONTH') {
      start = new Date(end.getFullYear(), end.getMonth(), 1);
    } else if (type === 'YEAR') {
      start = new Date(end.getFullYear(), 0, 1);
    }
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  // --- FILTER TRANSACTIONS ---
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => t.date >= startDate && t.date <= endDate);
  }, [transactions, startDate, endDate]);

  // --- STATS CALCULATION ---
  const stats = useMemo(() => {
    const totalValue = products.reduce((acc, p) => acc + (p.currentStock * p.price), 0);
    const lowStockCount = products.filter(p => p.currentStock <= p.minStock).length;
    const totalItems = products.reduce((acc, p) => acc + p.currentStock, 0);
    const totalProducts = products.length;
    
    const periodIn = filteredTransactions
      .filter(t => t.type === 'IN')
      .reduce((acc, t) => acc + t.totalValue, 0);

    const periodOut = filteredTransactions
      .filter(t => t.type === 'OUT')
      .reduce((acc, t) => acc + t.totalValue, 0);

    const netProfit = periodOut - periodIn; // Simple approximation

    return { totalValue, lowStockCount, totalItems, totalProducts, periodIn, periodOut, netProfit };
  }, [products, filteredTransactions]);

  // --- RECENT ACTIVITY (Last 5 Transactions) ---
  const recentActivity = useMemo(() => {
    return [...transactions]
      .sort((a, b) => b.createdAt - a.createdAt) // Sort by timestamp descending
      .slice(0, 5);
  }, [transactions]);

  // --- CHART DATA 1: Financial Trend ---
  const financialData = useMemo(() => {
    const dataMap = new Map<string, { date: string, income: number, expense: number }>();
    const sortedTx = [...filteredTransactions].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sortedTx.forEach(t => {
      if (!dataMap.has(t.date)) {
        dataMap.set(t.date, { date: t.date, income: 0, expense: 0 });
      }
      const entry = dataMap.get(t.date)!;
      if (t.type === 'OUT') entry.income += t.totalValue;
      if (t.type === 'IN') entry.expense += t.totalValue;
    });

    return Array.from(dataMap.values());
  }, [filteredTransactions]);

  // --- CHART DATA 2: Warehouse Values & Quantity ---
  const warehouseStats = useMemo(() => {
    const data = locations.map(loc => {
      const locProducts = products.filter(p => p.locationId === loc.id);
      return {
        name: loc.name,
        value: locProducts.reduce((acc, p) => acc + (p.currentStock * p.price), 0),
        qty: locProducts.reduce((acc, p) => acc + p.currentStock, 0)
      };
    });

    // Handle Unassigned
    const unassignedProducts = products.filter(p => !p.locationId || !locations.find(l => l.id === p.locationId));
    if (unassignedProducts.length > 0) {
      data.push({
        name: 'Unassigned',
        value: unassignedProducts.reduce((acc, p) => acc + (p.currentStock * p.price), 0),
        qty: unassignedProducts.reduce((acc, p) => acc + p.currentStock, 0)
      });
    }

    return data.sort((a, b) => b.value - a.value);
  }, [products, locations]);

  // --- CHART DATA 3: Category Distribution ---
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach(p => {
      map.set(p.category, (map.get(p.category) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 categories
  }, [products]);

  const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#3b82f6'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border dark:border-slate-600 shadow-xl rounded-lg text-xs z-50">
          <p className="font-bold mb-2 text-gray-800 dark:text-gray-100 border-b dark:border-slate-700 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span className="text-gray-500 dark:text-gray-400 capitalize">{entry.name}:</span>
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {entry.name.toLowerCase().includes('nilai') || entry.name.toLowerCase().includes('income') || entry.name.toLowerCase().includes('expense') 
                  ? formatCurrency(entry.value)
                  : entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-10">
      
      {/* 1. HEADER SECTION & FILTERS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
            <Clock size={14} />
            <span>{today.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight uppercase">
            DASHBOARD MGT
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Berikut adalah ringkasan performa gudang & keuangan perusahaan.
          </p>
        </div>

        {/* Date Filter Toolbar */}
        <div className="bg-white dark:bg-slate-800 p-1.5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col md:flex-row gap-2 w-full xl:w-auto">
          <div className="flex items-center bg-gray-50 dark:bg-slate-700 rounded-lg px-3 py-2 border dark:border-slate-600">
            <Calendar size={16} className="text-gray-400 mr-2" />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-sm font-medium text-gray-700 dark:text-white outline-none w-28"
            />
            <span className="text-gray-400 mx-2">-</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-sm font-medium text-gray-700 dark:text-white outline-none w-28"
            />
          </div>
          <div className="flex gap-1">
            {['TODAY', 'WEEK', 'MONTH'].map((preset) => (
              <button 
                key={preset}
                onClick={() => setPreset(preset as any)} 
                className="px-3 py-2 text-xs font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-500 dark:text-gray-400 transition-colors"
              >
                {preset === 'TODAY' ? 'Hari Ini' : preset === 'WEEK' ? '7 Hari' : 'Bulan Ini'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Asset Value */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200 dark:shadow-none relative overflow-hidden group">
          <div className="absolute right-0 top-0 opacity-10 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform">
            <Wallet size={100} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3 opacity-90">
              <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm"><DollarSign size={16} /></div>
              <span className="text-xs font-bold uppercase tracking-wider">Total Nilai Aset</span>
            </div>
            <h3 className="text-2xl font-bold mb-1 tracking-tight">
               {formatCurrency(stats.totalValue, true)}
            </h3>
            <p className="text-xs opacity-80 flex items-center">
              <Package size={12} className="mr-1" /> {stats.totalItems.toLocaleString()} Item Fisik
            </p>
          </div>
        </div>

        {/* Income (Sales) */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-900 transition-colors group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Penjualan (Out)</p>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                {formatCurrency(stats.periodOut, true)}
              </h3>
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="w-full bg-gray-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-3/4 rounded-full"></div>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-right">Target 75% tercapai</p>
        </div>

        {/* Expense (Purchases) */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-900 transition-colors group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Pembelian (In)</p>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                 {formatCurrency(stats.periodIn, true)}
              </h3>
            </div>
            <div className="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl group-hover:scale-110 transition-transform">
              <ShoppingCart size={24} />
            </div>
          </div>
          <div className="w-full bg-gray-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
             <div className="h-full bg-rose-500 w-1/2 rounded-full"></div>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-right">50% dari budget</p>
        </div>

        {/* Low Stock Alert */}
        <div className={`rounded-2xl p-5 shadow-sm border transition-colors relative overflow-hidden ${stats.lowStockCount > 0 ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700'}`}>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${stats.lowStockCount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`}>Status Stok</p>
              <h3 className={`text-2xl font-bold flex items-center gap-2 ${stats.lowStockCount > 0 ? 'text-orange-700 dark:text-orange-300' : 'text-gray-800 dark:text-white'}`}>
                {stats.lowStockCount > 0 ? `${stats.lowStockCount} Item` : 'Aman'}
              </h3>
              <p className="text-xs opacity-80 mt-1 text-gray-600 dark:text-gray-400">
                {stats.lowStockCount > 0 ? 'Perlu restock segera.' : 'Semua stok di atas batas minimum.'}
              </p>
            </div>
            <div className={`p-2 rounded-xl ${stats.lowStockCount > 0 ? 'bg-orange-100 dark:bg-orange-800 text-orange-600 dark:text-orange-200 animate-pulse' : 'bg-gray-100 dark:bg-slate-700 text-gray-500'}`}>
              {stats.lowStockCount > 0 ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT GRID (BENTO STYLE) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COL (8/12): Main Financial Chart */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Financial Trend Chart */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 h-full">
             <div className="flex justify-between items-center mb-6">
               <div>
                  <h3 className="font-bold text-gray-800 dark:text-white text-lg">Arus Kas Inventaris</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tren pembelian vs penjualan periode ini</p>
               </div>
               <div className="flex gap-4">
                  <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span> Masuk (Beli)
                  </div>
                  <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span> Keluar (Jual)
                  </div>
               </div>
             </div>
             <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={financialData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#f1f5f9'} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: theme === 'dark' ? '#94a3b8' : '#64748b'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: theme === 'dark' ? '#94a3b8' : '#64748b'}} tickFormatter={(val) => formatCurrency(val, true)} width={50} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: theme === 'dark' ? '#475569' : '#cbd5e1', strokeWidth: 1 }} />
                    <Area type="monotone" dataKey="income" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                    <Area type="monotone" dataKey="expense" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>

        {/* RIGHT COL (4/12): Side Widgets */}
        <div className="lg:col-span-4 space-y-6">

          {/* Widget 1: Recent Activity Feed */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/30 flex justify-between items-center">
               <h3 className="font-bold text-gray-800 dark:text-white flex items-center">
                 <Activity size={18} className="mr-2 text-indigo-500" /> Aktivitas Terbaru
               </h3>
               <button className="text-xs text-indigo-600 font-medium hover:underline">Lihat Semua</button>
            </div>
            <div className="divide-y dark:divide-slate-700 max-h-[350px] overflow-y-auto custom-scrollbar">
              {recentActivity.length > 0 ? (
                recentActivity.map(tx => (
                  <div key={tx.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-start gap-3">
                       <div className={`p-2 rounded-lg mt-1 shrink-0 ${tx.type === 'IN' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                         {tx.type === 'IN' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
                           {tx.type === 'IN' ? 'Barang Masuk' : 'Barang Keluar'} <span className="text-gray-400 font-normal">#{tx.referenceNo}</span>
                         </p>
                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                           {tx.items.length} Item • Total {formatCurrency(tx.totalValue, true)}
                         </p>
                         <p className="text-[10px] text-gray-400 mt-2">{new Date(tx.createdAt).toLocaleString()}</p>
                       </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400 text-sm">Belum ada aktivitas.</div>
              )}
            </div>
          </div>

          {/* Widget 2: Category Pie Chart */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
            <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center">
              <Layers size={18} className="mr-2 text-pink-500" /> Kategori Top
            </h3>
            <div className="h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalProducts}</span>
                <span className="text-[10px] uppercase text-gray-400 tracking-wider">Produk</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
               {categoryData.slice(0,3).map((entry, i) => (
                 <div key={i} className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <span className="w-2 h-2 rounded-full mr-1" style={{backgroundColor: COLORS[i]}}></span>
                    {entry.name} ({entry.value})
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. NEW SECTION: WAREHOUSE ANALYTICS (SPLIT CHARTS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Chart A: Value per Warehouse */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
             <h3 className="font-bold text-gray-800 dark:text-white text-lg flex items-center">
               <MapPin size={20} className="mr-2 text-purple-500" /> Nilai Aset per Gudang (Rp)
             </h3>
          </div>
          <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={warehouseStats} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#f1f5f9'} />
                 <XAxis dataKey="name" tick={{fontSize: 11, fill: theme === 'dark' ? '#94a3b8' : '#64748b'}} />
                 <YAxis tickFormatter={(val) => formatCurrency(val, true)} tick={{fontSize: 11, fill: theme === 'dark' ? '#94a3b8' : '#64748b'}} width={50} />
                 <Tooltip content={<CustomTooltip />} cursor={{fill: theme === 'dark' ? '#334155' : '#f1f5f9', opacity: 0.4}} />
                 <Bar dataKey="value" name="Nilai Aset" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={40} />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: Quantity per Warehouse */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
             <h3 className="font-bold text-gray-800 dark:text-white text-lg flex items-center">
               <Box size={20} className="mr-2 text-cyan-500" /> Volume Stok per Gudang (Qty)
             </h3>
          </div>
          <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={warehouseStats} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#f1f5f9'} />
                 <XAxis dataKey="name" tick={{fontSize: 11, fill: theme === 'dark' ? '#94a3b8' : '#64748b'}} />
                 <YAxis tick={{fontSize: 11, fill: theme === 'dark' ? '#94a3b8' : '#64748b'}} width={40} />
                 <Tooltip content={<CustomTooltip />} cursor={{fill: theme === 'dark' ? '#334155' : '#f1f5f9', opacity: 0.4}} />
                 <Bar dataKey="qty" name="Jumlah Barang" fill="#06b6d4" radius={[6, 6, 0, 0]} barSize={40} />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. BOTTOM SECTION: Priority Table & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Priority Table (2/3) */}
        <div className="lg:col-span-2">
          {stats.lowStockCount > 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/30 overflow-hidden h-full">
              <div className="p-6 border-b dark:border-slate-700 bg-red-50/50 dark:bg-red-900/10 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center">
                  <AlertTriangle className="mr-2 text-red-500 animate-bounce" size={18} /> Prioritas Restock
                </h3>
                <span className="text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/50 px-3 py-1 rounded-full">
                  {stats.lowStockCount} Item Kritis
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                    <tr className="text-gray-400 dark:text-gray-500 font-medium">
                      <th className="p-4 pl-6">Nama Barang</th>
                      <th className="p-4 text-center">Sisa</th>
                      <th className="p-4 text-center">Min</th>
                      <th className="p-4 w-48">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-700">
                    {products
                      .filter(p => p.currentStock <= p.minStock)
                      .sort((a,b) => a.currentStock - b.currentStock)
                      .slice(0, 5)
                      .map(p => {
                        const percentage = Math.min(100, (p.currentStock / p.minStock) * 100);
                        return (
                          <tr key={p.id} className="text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                            <td className="p-4 pl-6 font-medium">{p.name}</td>
                            <td className="p-4 text-center font-bold text-red-600 dark:text-red-400">{p.currentStock}</td>
                            <td className="p-4 text-center text-gray-500">{p.minStock}</td>
                            <td className="p-4">
                              <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2 mb-1 overflow-hidden">
                                <div 
                                  className={`h-2 rounded-full ${percentage < 20 ? 'bg-red-600' : 'bg-orange-500'}`} 
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <p className="text-[10px] text-gray-400 text-right">{percentage.toFixed(0)}%</p>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-green-100 dark:border-green-900/30 p-8 flex flex-col items-center justify-center text-center h-full">
              <div className="bg-green-100 dark:bg-green-900/50 p-4 rounded-full mb-3 text-green-600 dark:text-green-400">
                <CheckCircle size={32} />
              </div>
              <h3 className="font-bold text-gray-800 dark:text-white">Stok Aman</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Semua barang berada di atas batas minimum stok.</p>
            </div>
          )}
        </div>

        {/* Quick Actions (1/3) */}
        <div className="bg-indigo-50 dark:bg-slate-800 p-5 rounded-2xl border border-indigo-100 dark:border-slate-700 h-full">
          <h3 className="font-bold text-indigo-900 dark:text-indigo-300 mb-4 text-sm uppercase tracking-wide">Aksi Cepat</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-700 rounded-xl border border-indigo-100 dark:border-slate-600 hover:shadow-md transition-shadow text-left group">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Tambah Barang Baru</span>
                <div className="bg-indigo-50 dark:bg-slate-600 p-1.5 rounded group-hover:bg-indigo-100 dark:group-hover:bg-slate-500 transition-colors"><PlusCircle size={18} className="text-indigo-600 dark:text-indigo-300"/></div>
            </button>
            <button className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-700 rounded-xl border border-indigo-100 dark:border-slate-600 hover:shadow-md transition-shadow text-left group">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Buat Purchase Order</span>
                <div className="bg-indigo-50 dark:bg-slate-600 p-1.5 rounded group-hover:bg-indigo-100 dark:group-hover:bg-slate-500 transition-colors"><ShoppingCart size={18} className="text-indigo-600 dark:text-indigo-300"/></div>
            </button>
            <button className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-700 rounded-xl border border-indigo-100 dark:border-slate-600 hover:shadow-md transition-shadow text-left group">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Cek Laporan Stok</span>
                <div className="bg-indigo-50 dark:bg-slate-600 p-1.5 rounded group-hover:bg-indigo-100 dark:group-hover:bg-slate-500 transition-colors"><Database size={18} className="text-indigo-600 dark:text-indigo-300"/></div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
