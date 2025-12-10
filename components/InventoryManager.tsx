
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Product, StockOpname, StorageLocation } from '../types';
import { Edit, Trash2, Plus, AlertCircle, CheckCircle, Search, Upload, FileSpreadsheet, Filter, MapPin, X, Settings, RefreshCcw, ChevronDown, ChevronUp } from 'lucide-react';
import * as XLSX from 'xlsx';

const InventoryManager: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, settings, addOpname, locations, addLocation, deleteLocation, currentUser } = useInventory();
  const [view, setView] = useState<'LIST' | 'OPNAME'>('LIST');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // RBAC Access Check
  // Admin & Inventory: Read/Write
  // Manager & PPIC & Project: Read Only (Project needs to see list, PPIC needs to see stock)
  const canEdit = currentUser?.role === 'ADMIN' || currentUser?.role === 'INVENTORY';

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Advanced Filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    code: '', name: '', category: '', unit: 'Pcs', minStock: 5, price: 0, currentStock: 0, locationId: ''
  });
  
  // State khusus untuk input lokasi manual/auto
  const [manualLocationName, setManualLocationName] = useState('');

  const getLocationName = (id?: string) => {
    if (!id) return null;
    return locations.find(l => l.id === id)?.name || null;
  };

  // Get Unique Categories for Filter Dropdown
  const uniqueCategories = useMemo(() => {
    const categories = products.map(p => p.category).filter(Boolean);
    return Array.from(new Set(categories)).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // 1. Text Search
      const locName = getLocationName(p.locationId);
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (locName && locName.toLowerCase().includes(searchTerm.toLowerCase()));

      // 2. Low Stock Filter
      const matchesLowStock = showLowStockOnly ? p.currentStock <= p.minStock : true;

      // 3. Category Filter
      const matchesCategory = filterCategory ? p.category === filterCategory : true;

      // 4. Location Filter
      const matchesLocation = filterLocation ? p.locationId === filterLocation : true;

      // 5. Price Filter
      const minPriceVal = filterMinPrice ? Number(filterMinPrice) : 0;
      const maxPriceVal = filterMaxPrice ? Number(filterMaxPrice) : Infinity;
      const matchesPrice = p.price >= minPriceVal && p.price <= maxPriceVal;

      return matchesSearch && matchesLowStock && matchesCategory && matchesLocation && matchesPrice;
    });
  }, [products, searchTerm, showLowStockOnly, filterCategory, filterLocation, filterMinPrice, filterMaxPrice, locations]);

  const resetFilters = () => {
    setSearchTerm('');
    setShowLowStockOnly(false);
    setFilterCategory('');
    setFilterLocation('');
    setFilterMinPrice('');
    setFilterMaxPrice('');
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();

    // Logika Pintar untuk Lokasi
    let finalLocationId = formData.locationId;
    const trimmedLocName = manualLocationName.trim();

    if (trimmedLocName) {
      const existingLoc = locations.find(l => l.name.toLowerCase() === trimmedLocName.toLowerCase());
      if (existingLoc) {
        finalLocationId = existingLoc.id;
      } else {
        const newLocId = crypto.randomUUID();
        addLocation({
          id: newLocId,
          name: trimmedLocName,
          description: 'Ditambahkan otomatis dari input produk'
        });
        finalLocationId = newLocId;
      }
    } else {
      finalLocationId = undefined;
    }

    const productToSave = { 
      ...formData, 
      locationId: finalLocationId 
    };

    if (editingProduct) {
      updateProduct({ ...editingProduct, ...productToSave } as Product);
    } else {
      addProduct({ 
        id: crypto.randomUUID(), 
        ...productToSave 
      } as Product);
    }
    setIsModalOpen(false);
    setEditingProduct(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ code: '', name: '', category: '', unit: 'Pcs', minStock: 5, price: 0, currentStock: 0, locationId: '' });
    setManualLocationName('');
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData(p);
    setManualLocationName(getLocationName(p.locationId) || '');
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    resetForm();
    setIsModalOpen(true);
  }

  const downloadExcel = () => {
    const headers = ["Kode", "Nama", "Kategori", "Lokasi Gudang", "Unit", "Harga", "Stok", "Min Stok"];
    const rows = filteredProducts.map(p => {
      const locName = getLocationName(p.locationId) || '-';
      return [p.code, p.name, p.category, locName, p.unit, p.price, p.currentStock, p.minStock];
    });
    
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wscols = headers.map(h => ({ wch: h.length + 5 }));
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stok Barang");
    
    XLSX.writeFile(workbook, "Data_Stok_Barang.xlsx");
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      const rows = jsonData.filter(row => row.length > 0);

      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const code = row[0]?.toString().trim();
        const name = row[1]?.toString().trim();
        
        if (code && name) {
          const locName = row[3]?.toString().trim();
          let locId = '';
          
          if (locName && locName !== '-') {
            const existingLoc = locations.find(l => l.name.toLowerCase() === locName.toLowerCase());
            if (existingLoc) {
              locId = existingLoc.id;
            } else {
              const newLocId = crypto.randomUUID();
              addLocation({ id: newLocId, name: locName, description: 'Imported via Excel' });
              locId = newLocId;
            }
          }

          const newProduct: Product = {
            id: crypto.randomUUID(),
            code: code,
            name: name,
            category: row[2]?.toString().trim() || 'General',
            unit: row[4]?.toString().trim() || 'Pcs',
            price: Number(row[5]) || 0,
            currentStock: Number(row[6]) || 0,
            minStock: Number(row[7]) || 5,
            locationId: locId
          };
          
          addProduct(newProduct);
          successCount++;
        } else {
          errorCount++;
        }
      }

      alert(`Import Excel Selesai.\nBerhasil: ${successCount} produk.\nGagal/Dilewati: ${errorCount} baris.`);

    } catch (error) {
      console.error("Error reading excel:", error);
      alert("Gagal membaca file Excel.");
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Manajemen Stok</h1>
        <div className="flex flex-wrap gap-2">
           {canEdit && (
             <>
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 onChange={handleImportExcel} 
                 accept=".xlsx, .xls" 
                 className="hidden" 
               />
               <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center shadow-sm text-sm"
              >
                <Upload size={16} className="mr-2" /> Import
              </button>
             </>
           )}
           
           <button 
            onClick={downloadExcel}
            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center shadow-sm text-sm"
          >
            <FileSpreadsheet size={16} className="mr-2" /> Export
          </button>
          
          {canEdit && (
             <button 
              onClick={() => setView(view === 'LIST' ? 'OPNAME' : 'LIST')}
              className="px-3 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 text-sm transition-colors"
            >
              {view === 'LIST' ? 'Mode Opname' : 'Kembali ke Daftar'}
            </button>
          )}

          {view === 'LIST' && canEdit && (
            <button 
              onClick={handleAddNew}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center shadow-sm text-sm"
            >
              <Plus size={16} className="mr-2" /> Tambah Produk
            </button>
          )}
        </div>
      </div>

      {view === 'LIST' ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors">
          
          {/* SEARCH & FILTER BAR */}
          <div className="p-4 border-b dark:border-slate-700 space-y-3">
             <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Cari kode, nama barang..." 
                    className="w-full pl-10 pr-4 py-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <button 
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`px-4 py-2 rounded-lg flex items-center border transition-colors ${
                    showAdvancedFilters
                      ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300' 
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200'
                  }`}
                >
                  <Filter size={18} className="mr-2" />
                  Filter
                  {showAdvancedFilters ? <ChevronUp size={16} className="ml-2"/> : <ChevronDown size={16} className="ml-2"/>}
                </button>

                <button 
                  onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                  className={`px-4 py-2 rounded-lg flex items-center border transition-colors whitespace-nowrap ${
                    showLowStockOnly 
                      ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-900/50 dark:text-red-300' 
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200'
                  }`}
                >
                  <AlertCircle size={18} className="mr-2" />
                  {showLowStockOnly ? 'Stok Menipis: ON' : 'Stok Menipis'}
                </button>
             </div>

             {/* ADVANCED FILTER PANEL */}
             {showAdvancedFilters && (
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border dark:border-slate-600 mt-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Kategori</label>
                    <select 
                      className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white text-sm"
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                    >
                      <option value="">Semua Kategori</option>
                      {uniqueCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Lokasi Gudang</label>
                    <select 
                      className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white text-sm"
                      value={filterLocation}
                      onChange={(e) => setFilterLocation(e.target.value)}
                    >
                      <option value="">Semua Lokasi</option>
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Range Harga (Rp)</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        placeholder="Min" 
                        className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white text-sm"
                        value={filterMinPrice}
                        onChange={(e) => setFilterMinPrice(e.target.value)}
                      />
                      <span className="text-gray-400">-</span>
                      <input 
                        type="number" 
                        placeholder="Max" 
                        className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white text-sm"
                        value={filterMaxPrice}
                        onChange={(e) => setFilterMaxPrice(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-4 flex justify-end">
                    <button 
                      onClick={resetFilters}
                      className="text-sm text-gray-500 hover:text-red-600 flex items-center"
                    >
                      <RefreshCcw size={14} className="mr-1"/> Reset Filter
                    </button>
                  </div>
               </div>
             )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-medium border-b dark:border-slate-600">
                <tr>
                  <th className="p-4">Kode</th>
                  <th className="p-4">Nama Produk</th>
                  <th className="p-4">Kategori</th>
                  <th className="p-4">Lokasi</th>
                  <th className="p-4 text-right">Harga (Rp)</th>
                  <th className="p-4 text-center">Stok</th>
                  <th className="p-4 text-center">Min. Stok</th>
                  <th className="p-4 text-center">Unit</th>
                  {canEdit && <th className="p-4 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {filteredProducts.map(product => {
                  const isLowStock = product.currentStock <= product.minStock;
                  const locationName = getLocationName(product.locationId);
                  
                  return (
                    <tr key={product.id} className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 ${isLowStock ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                      <td className="p-4 font-mono text-gray-500 dark:text-gray-400">{product.code}</td>
                      <td className="p-4 font-medium text-gray-900 dark:text-gray-100">
                        {product.name}
                        {isLowStock && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">Low</span>}
                      </td>
                      <td className="p-4 text-gray-500 dark:text-gray-400">{product.category}</td>
                      <td className="p-4 text-gray-600 dark:text-gray-300">
                        {locationName ? (
                           <span className="inline-flex items-center px-2 py-1 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs">
                             <MapPin size={12} className="mr-1" /> {locationName}
                           </span>
                        ) : '-'}
                      </td>
                      <td className="p-4 text-right text-gray-800 dark:text-gray-200">
                        {product.price.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          isLowStock 
                            ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 animate-pulse' 
                            : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {product.currentStock}
                        </span>
                      </td>
                      <td className="p-4 text-center text-gray-400">{product.minStock}</td>
                      <td className="p-4 text-center text-gray-500 dark:text-gray-400">{product.unit}</td>
                      {canEdit && (
                        <td className="p-4 text-center">
                          <div className="flex justify-center space-x-2">
                            <button onClick={() => openEdit(product)} className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"><Edit size={16} /></button>
                            <button onClick={() => deleteProduct(product.id)} className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={canEdit ? 9 : 8} className="p-8 text-center text-gray-400 dark:text-gray-500">
                      Tidak ada produk yang cocok dengan filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <StockOpnameView products={products} onSave={addOpname} onCancel={() => setView('LIST')} />
      )}

      {/* Modal Add/Edit Product */}
      {isModalOpen && canEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md shadow-xl border dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kode Barang</label>
                  <input required type="text" className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kategori</label>
                  <input type="text" className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Produk</label>
                <input required type="text" className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              {/* LOCATION INPUT: Datalist for Flexible Entry with Manage Button */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lokasi Gudang / Rak</label>
                  <button 
                    type="button"
                    onClick={() => setIsLocationModalOpen(true)}
                    className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 flex items-center hover:underline"
                  >
                    <Settings size={12} className="mr-1" /> Kelola Daftar
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    list="location-list"
                    className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white placeholder-gray-400"
                    placeholder="Pilih atau ketik lokasi baru..."
                    value={manualLocationName}
                    onChange={(e) => setManualLocationName(e.target.value)}
                  />
                  <datalist id="location-list">
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.name} />
                    ))}
                  </datalist>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                    <MapPin size={16} />
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Tips: Ketik manual untuk menambah lokasi baru secara otomatis.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Harga</label>
                   <input required type="number" className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Unit</label>
                   <input required type="text" className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stok Awal</label>
                   <input required type="number" className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white" value={formData.currentStock} onChange={e => setFormData({...formData, currentStock: Number(e.target.value)})} />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Min. Stok (Alert)</label>
                   <input required type="number" className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white" value={formData.minStock} onChange={e => setFormData({...formData, minStock: Number(e.target.value)})} />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border dark:border-slate-600 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Manage Locations */}
      {isLocationModalOpen && canEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <LocationManager onClose={() => setIsLocationModalOpen(false)} />
        </div>
      )}
    </div>
  );
};

const LocationManager: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { locations, addLocation, deleteLocation } = useInventory();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addLocation({ id: crypto.randomUUID(), name, description });
    setName('');
    setDescription('');
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-sm shadow-xl border dark:border-slate-700">
        <div className="flex justify-between items-center mb-4">
           <h2 className="text-xl font-bold text-gray-800 dark:text-white">Kelola Lokasi Gudang</h2>
           <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"><X size={20}/></button>
        </div>
        
        <form onSubmit={handleAdd} className="space-y-3 mb-4">
          <input 
            type="text" 
            placeholder="Nama Gudang / Rak (Misal: Gudang AB)" 
            className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white text-sm"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <input 
            type="text" 
            placeholder="Deskripsi (Opsional)" 
            className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white text-sm"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <button type="submit" className="w-full bg-purple-600 text-white p-2 rounded hover:bg-purple-700 flex items-center justify-center">
            <Plus size={16} className="mr-2"/> Tambah Lokasi
          </button>
        </form>

        <div className="max-h-60 overflow-y-auto border-t dark:border-slate-700 pt-2 custom-scrollbar">
          {locations.length === 0 ? (
             <p className="text-sm text-gray-400 text-center py-4">Belum ada lokasi terdaftar.</p>
          ) : (
            <ul className="space-y-2">
              {locations.map(loc => (
                <li key={loc.id} className="flex justify-between items-start bg-gray-50 dark:bg-slate-700/50 p-2 rounded text-sm">
                  <div>
                    <span className="text-gray-700 dark:text-gray-200 flex items-center font-medium">
                      <MapPin size={14} className="mr-2 text-purple-500"/> {loc.name}
                    </span>
                    {loc.description && <p className="text-xs text-gray-500 dark:text-gray-400 ml-5">{loc.description}</p>}
                  </div>
                  <button onClick={() => deleteLocation(loc.id)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1"><Trash2 size={16}/></button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
  );
};

const StockOpnameView: React.FC<{ products: Product[], onSave: (o: StockOpname) => void, onCancel: () => void }> = ({ products, onSave, onCancel }) => {
  const [opnameItems, setOpnameItems] = useState(products.map(p => ({
    productId: p.id,
    productName: p.name,
    systemQty: p.currentStock,
    physicalQty: p.currentStock,
    difference: 0
  })));
  const [notes, setNotes] = useState('');

  const handleQtyChange = (id: string, qty: number) => {
    setOpnameItems(prev => prev.map(item => {
      if (item.productId === id) {
        return { ...item, physicalQty: qty, difference: qty - item.systemQty };
      }
      return item;
    }));
  };

  const handleSave = () => {
    const opname: StockOpname = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      items: opnameItems.filter(i => i.difference !== 0 || i.physicalQty !== i.systemQty), 
      notes,
      status: 'COMPLETED'
    };
    onSave(opname);
    alert('Stok Opname berhasil disimpan & stok diperbarui.');
    onCancel();
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 transition-colors">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Formulir Stok Opname</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">{new Date().toLocaleDateString()}</span>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Catatan Opname</label>
        <textarea className="w-full border dark:border-slate-600 rounded p-2 mt-1 bg-white dark:bg-slate-700 dark:text-white" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Misal: Cek rutin bulanan..." />
      </div>

      <div className="overflow-x-auto mb-6">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-slate-700 border-b dark:border-slate-600">
            <tr className="text-gray-600 dark:text-gray-300">
              <th className="p-3">Produk</th>
              <th className="p-3 text-center">Stok Sistem</th>
              <th className="p-3 text-center w-32">Stok Fisik</th>
              <th className="p-3 text-center">Selisih</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-700">
            {opnameItems.map(item => (
              <tr key={item.productId} className="text-gray-800 dark:text-gray-200">
                <td className="p-3 font-medium">{item.productName}</td>
                <td className="p-3 text-center text-gray-500 dark:text-gray-400">{item.systemQty}</td>
                <td className="p-3 text-center">
                  <input 
                    type="number" 
                    className="w-20 border dark:border-slate-600 rounded p-1 text-center font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-700"
                    value={item.physicalQty}
                    onChange={(e) => handleQtyChange(item.productId, Number(e.target.value))}
                  />
                </td>
                <td className={`p-3 text-center font-bold ${item.difference < 0 ? 'text-red-500' : item.difference > 0 ? 'text-green-500' : 'text-gray-400'}`}>
                  {item.difference > 0 ? '+' : ''}{item.difference}
                </td>
                <td className="p-3 text-center">
                  {item.difference === 0 ? <CheckCircle size={18} className="text-green-500 inline" /> : <AlertCircle size={18} className="text-orange-500 inline" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end space-x-3">
        <button onClick={onCancel} className="px-4 py-2 border dark:border-slate-600 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700">Batal</button>
        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Simpan & Perbarui Stok</button>
      </div>
    </div>
  );
};

export default InventoryManager;
