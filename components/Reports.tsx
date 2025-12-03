import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Filter, Calendar, FileSpreadsheet, AlertTriangle, CheckCircle, BarChart as BarChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';

const Reports: React.FC = () => {
  const { transactions, products, settings, theme } = useInventory();
  const [reportType, setReportType] = useState<'MOVEMENT' | 'LOW_STOCK'>('MOVEMENT');

  // Default to current month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(formatDate(firstDay));
  const [endDate, setEndDate] = useState(formatDate(today));
  const [filterType, setFilterType] = useState<'ALL' | 'IN' | 'OUT'>('ALL');

  // --- LOGIC FOR MOVEMENT REPORT ---
  // Filter Transactions based on Date and Type
  const filteredTransactions = transactions.filter(t => {
    const tDate = t.date;
    const isDateMatch = tDate >= startDate && tDate <= endDate;
    const isTypeMatch = filterType === 'ALL' || t.type === filterType;
    return isDateMatch && isTypeMatch;
  });

  // Calculate Chart Data (Group by Date)
  const chartData = useMemo(() => {
    const map = new Map<string, { date: string; valueIn: number; valueOut: number }>();

    // Init map with filtered transactions
    filteredTransactions.forEach(t => {
      if (!map.has(t.date)) {
        map.set(t.date, { date: t.date, valueIn: 0, valueOut: 0 });
      }
      const entry = map.get(t.date)!;
      if (t.type === 'IN') {
        entry.valueIn += t.totalValue;
      } else {
        entry.valueOut += t.totalValue;
      }
    });

    // Convert to array and sort by date
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredTransactions]);

  const productMovement = products.map(p => {
    const pTransItems = filteredTransactions.flatMap(t => 
      t.items
        .filter(i => i.productId === p.id)
        .map(i => ({ type: t.type, qty: i.quantity }))
    );

    const totalIn = pTransItems.filter(x => x.type === 'IN').reduce((acc, x) => acc + x.qty, 0);
    const totalOut = pTransItems.filter(x => x.type === 'OUT').reduce((acc, x) => acc + x.qty, 0);

    return { ...p, periodIn: totalIn, periodOut: totalOut };
  });

  // --- LOGIC FOR LOW STOCK REPORT ---
  const lowStockProducts = products
    .filter(p => p.currentStock <= p.minStock)
    .sort((a, b) => a.currentStock - b.currentStock); // Lowest first

  const setPreset = (type: 'TODAY' | 'WEEK' | 'MONTH') => {
    const end = new Date();
    let start = new Date();

    if (type === 'WEEK') {
      start.setDate(end.getDate() - 7);
    } else if (type === 'MONTH') {
      start = new Date(end.getFullYear(), end.getMonth(), 1);
    }
    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  };

  const downloadExcel = () => {
    let data = [];
    let fileName = '';
    let sheetName = '';

    if (reportType === 'MOVEMENT') {
      data = productMovement.map(p => ({
        "Kode Barang": p.code,
        "Nama Produk": p.name,
        "Kategori": p.category,
        [`Masuk (${startDate} s/d ${endDate})`]: p.periodIn,
        [`Keluar (${startDate} s/d ${endDate})`]: p.periodOut,
        "Stok Akhir": p.currentStock,
        "Unit": p.unit
      }));
      fileName = `Laporan_KeluarMasuk_${startDate}_${endDate}.xlsx`;
      sheetName = 'Keluar Masuk';
    } else {
      data = lowStockProducts.map(p => ({
        "Kode Barang": p.code,
        "Nama Produk": p.name,
        "Kategori": p.category,
        "Sisa Stok": p.currentStock,
        "Batas Minimum": p.minStock,
        "Status": p.currentStock === 0 ? "HABIS" : "MENIPIS",
        "Estimasi Order": (p.minStock * 2) - p.currentStock // Simple reorder logic
      }));
      fileName = `Laporan_Restock_Barang_${formatDate(new Date())}.xlsx`;
      sheetName = 'Stok Menipis';
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const wscols = Object.keys(data[0] || {}).map(k => ({ wch: k.length + 10 }));
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, fileName);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border dark:border-slate-600 shadow-lg rounded text-sm">
          <p className="font-bold mb-1 text-gray-800 dark:text-gray-200">{label}</p>
          <p className="text-blue-600 dark:text-blue-400">
            Nilai Masuk: {settings.currency} {payload[0].value.toLocaleString()}
          </p>
          <p className="text-orange-600 dark:text-orange-400">
            Nilai Keluar: {settings.currency} {payload[1].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Laporan & Analisa</h1>
        <button 
          onClick={downloadExcel} 
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center shadow-sm"
        >
          <FileSpreadsheet size={18} className="mr-2" /> Export Excel
        </button>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="flex border-b dark:border-slate-700">
         <button 
           onClick={() => setReportType('MOVEMENT')}
           className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
             reportType === 'MOVEMENT' 
               ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' 
               : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
           }`}
         >
           Laporan Keluar Masuk & Tren
         </button>
         <button 
           onClick={() => setReportType('LOW_STOCK')}
           className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 flex items-center ${
             reportType === 'LOW_STOCK' 
               ? 'border-red-600 text-red-600 dark:text-red-400 dark:border-red-400' 
               : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
           }`}
         >
           <AlertTriangle size={16} className="mr-2" /> Ketersediaan Stok (Restock)
         </button>
      </div>

      {/* FILTER CONTROLS FOR MOVEMENT REPORT */}
      {reportType === 'MOVEMENT' && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-auto">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Periode Mulai</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="border dark:border-slate-600 rounded-lg p-2 text-sm w-full md:w-40 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div className="w-full md:w-auto">
               <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Periode Selesai</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="border dark:border-slate-600 rounded-lg p-2 text-sm w-full md:w-40 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div className="w-full md:w-auto">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tipe Transaksi</label>
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value as any)}
                className="border dark:border-slate-600 rounded-lg p-2 text-sm w-full md:w-40 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
              >
                <option value="ALL">Semua</option>
                <option value="IN">Hanya Masuk</option>
                <option value="OUT">Hanya Keluar</option>
              </select>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <button onClick={() => setPreset('TODAY')} className="px-3 py-2 text-xs font-medium bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded text-gray-700 dark:text-gray-200 transition-colors">Hari Ini</button>
              <button onClick={() => setPreset('WEEK')} className="px-3 py-2 text-xs font-medium bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded text-gray-700 dark:text-gray-200 transition-colors">Minggu Ini</button>
              <button onClick={() => setPreset('MONTH')} className="px-3 py-2 text-xs font-medium bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded text-gray-700 dark:text-gray-200 transition-colors">Bulan Ini</button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT CONTENT */}
      {reportType === 'MOVEMENT' ? (
        <div className="space-y-6">
          {/* CHART SECTION */}
          {chartData.length > 0 && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
               <div className="flex items-center justify-between mb-6">
                 <div>
                   <h3 className="text-lg font-bold text-gray-800 dark:text-white">Tren Nilai Transaksi</h3>
                   <p className="text-sm text-gray-500 dark:text-gray-400">Perbandingan nilai barang masuk vs keluar berdasarkan tanggal</p>
                 </div>
                 <div className="flex gap-4 text-xs">
                    <div className="flex items-center text-gray-600 dark:text-gray-300"><div className="w-3 h-3 bg-blue-500 rounded mr-2"></div> Nilai Masuk (Pembelian)</div>
                    <div className="flex items-center text-gray-600 dark:text-gray-300"><div className="w-3 h-3 bg-orange-500 rounded mr-2"></div> Nilai Keluar (Penjualan)</div>
                 </div>
               </div>
               <div className="h-72">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e5e7eb'} />
                     <XAxis dataKey="date" tick={{fontSize: 12, fill: theme === 'dark' ? '#94a3b8' : '#6b7280'}} />
                     <YAxis tickFormatter={(value) => `${value/1000}k`} tick={{fontSize: 12, fill: theme === 'dark' ? '#94a3b8' : '#6b7280'}} />
                     <Tooltip content={<CustomTooltip />} />
                     <Legend />
                     <Bar dataKey="valueIn" name="Nilai Masuk" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
                     <Bar dataKey="valueOut" name="Nilai Keluar" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={60} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>
          )}

          {/* TABLE SECTION */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-slate-700 border-b dark:border-slate-600">
                  <tr className="text-gray-600 dark:text-gray-300">
                    <th className="p-4">Kode</th>
                    <th className="p-4">Nama Produk</th>
                    <th className="p-4">Kategori</th>
                    {(filterType === 'ALL' || filterType === 'IN') && (
                      <th className="p-4 text-center bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">Masuk (Qty)</th>
                    )}
                    {(filterType === 'ALL' || filterType === 'OUT') && (
                      <th className="p-4 text-center bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300">Keluar (Qty)</th>
                    )}
                    <th className="p-4 text-center">Stok Akhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700 text-gray-800 dark:text-gray-200">
                  {productMovement.map(p => {
                    const hasMovement = p.periodIn > 0 || p.periodOut > 0;
                    return (
                      <tr key={p.id} className={hasMovement ? "bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50" : "bg-gray-50 dark:bg-slate-700/30 opacity-60 hover:opacity-100"}>
                        <td className="p-4 font-mono text-gray-500 dark:text-gray-400">{p.code}</td>
                        <td className="p-4 font-medium">{p.name}</td>
                        <td className="p-4 text-gray-500 dark:text-gray-400">{p.category}</td>
                        
                        {(filterType === 'ALL' || filterType === 'IN') && (
                          <td className="p-4 text-center font-bold text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/10">
                            {p.periodIn > 0 ? `+${p.periodIn}` : '-'}
                          </td>
                        )}
                        
                        {(filterType === 'ALL' || filterType === 'OUT') && (
                          <td className="p-4 text-center font-bold text-orange-600 dark:text-orange-400 bg-orange-50/30 dark:bg-orange-900/10">
                            {p.periodOut > 0 ? `-${p.periodOut}` : '-'}
                          </td>
                        )}
                        
                        <td className="p-4 text-center font-bold text-gray-700 dark:text-gray-300">
                          {p.currentStock}
                        </td>
                      </tr>
                    );
                  })}
                  {productMovement.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-400 dark:text-gray-500">Tidak ada data produk.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50 text-xs text-gray-500 dark:text-gray-400">
               Menampilkan pergerakan stok dari <strong>{startDate}</strong> sampai <strong>{endDate}</strong>.
            </div>
          </div>
        </div>
      ) : (
        // LOW STOCK REPORT VIEW
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30 overflow-hidden transition-colors">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30">
            <h3 className="font-bold text-red-800 dark:text-red-300 flex items-center">
               <AlertTriangle size={18} className="mr-2" /> Barang Perlu Restock
            </h3>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">Daftar barang dengan stok di bawah batas minimum.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                <tr className="text-gray-600 dark:text-gray-300">
                  <th className="p-4">Kode</th>
                  <th className="p-4">Nama Produk</th>
                  <th className="p-4">Kategori</th>
                  <th className="p-4 text-center text-red-600 dark:text-red-400 font-bold">Sisa Stok</th>
                  <th className="p-4 text-center text-gray-500 dark:text-gray-400">Min. Stok</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700 text-gray-800 dark:text-gray-200">
                {lowStockProducts.map(p => (
                  <tr key={p.id} className="hover:bg-red-50 dark:hover:bg-red-900/10">
                    <td className="p-4 font-mono text-gray-500 dark:text-gray-400">{p.code}</td>
                    <td className="p-4 font-bold text-gray-800 dark:text-gray-200">{p.name}</td>
                    <td className="p-4 text-gray-500 dark:text-gray-400">{p.category}</td>
                    <td className="p-4 text-center font-bold text-red-600 dark:text-red-400 text-lg">{p.currentStock}</td>
                    <td className="p-4 text-center text-gray-500 dark:text-gray-400">{p.minStock}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${p.currentStock === 0 ? 'bg-red-600 text-white' : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200'}`}>
                        {p.currentStock === 0 ? 'HABIS' : 'MENIPIS'}
                      </span>
                    </td>
                  </tr>
                ))}
                {lowStockProducts.length === 0 && (
                  <tr><td colSpan={6} className="p-12 text-center text-green-600 dark:text-green-400">
                    <div className="flex flex-col items-center">
                       <CheckCircle size={32} className="mb-2" />
                       <span className="font-bold">Semua Stok Aman!</span>
                       <span className="text-sm opacity-75">Tidak ada barang yang perlu di-restock saat ini.</span>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;