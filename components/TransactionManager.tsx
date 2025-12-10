
import React, { useState, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Transaction, TransactionItem, TransactionType } from '../types';
import { Plus, Trash, FileText, Printer, ArrowRight, ArrowLeft, AlertCircle, Edit, Save, X } from 'lucide-react';

const TransactionManager: React.FC = () => {
  const { products, partners, transactions, deleteTransaction, currentUser } = useInventory();
  const [activeTab, setActiveTab] = useState<TransactionType>('IN');
  const [viewMode, setViewMode] = useState<'FORM' | 'LIST' | 'DELIVERY_NOTE'>('LIST');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // RBAC
  const canEdit = currentUser?.role === 'ADMIN' || currentUser?.role === 'INVENTORY';

  const handleEdit = (transaction: Transaction) => {
    if (!canEdit) return;
    setEditingTransaction(transaction);
    setActiveTab(transaction.type);
    setViewMode('FORM');
  };

  const handleDelete = (id: string) => {
    if (!canEdit) return;
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini? Stok akan dikembalikan ke kondisi sebelumnya.')) {
      deleteTransaction(id);
    }
  };

  const handleCancelForm = () => {
    setViewMode('LIST');
    setEditingTransaction(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center no-print">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          {viewMode === 'DELIVERY_NOTE' 
            ? (selectedTransaction?.type === 'IN' ? 'Cetak Bukti Masuk' : 'Cetak Surat Jalan') 
            : (editingTransaction ? 'Edit Transaksi' : 'Transaksi Barang')}
        </h1>
        <div className="flex space-x-2">
           {viewMode === 'LIST' && canEdit && (
             <>
              <button 
                onClick={() => { setActiveTab('IN'); setViewMode('FORM'); setEditingTransaction(null); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center shadow-sm"
              >
                <ArrowRight size={18} className="mr-2" /> Barang Masuk
              </button>
              <button 
                onClick={() => { setActiveTab('OUT'); setViewMode('FORM'); setEditingTransaction(null); }}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center shadow-sm"
              >
                <ArrowLeft size={18} className="mr-2" /> Barang Keluar
              </button>
             </>
           )}
           {viewMode !== 'LIST' && (
             <button 
               onClick={handleCancelForm} 
               className="px-4 py-2 border bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600"
             >
               Kembali
             </button>
           )}
        </div>
      </div>

      {viewMode === 'LIST' && (
        <TransactionList 
          transactions={transactions} 
          partners={partners}
          onViewNote={(t) => { setSelectedTransaction(t); setViewMode('DELIVERY_NOTE'); }}
          onEdit={handleEdit}
          onDelete={handleDelete}
          canEdit={canEdit}
        />
      )}

      {viewMode === 'FORM' && canEdit && (
        <TransactionForm 
          type={activeTab} 
          initialData={editingTransaction}
          onSuccess={() => { setViewMode('LIST'); setEditingTransaction(null); }}
          onCancel={handleCancelForm}
        />
      )}

      {viewMode === 'DELIVERY_NOTE' && selectedTransaction && (
        <DeliveryNote transaction={selectedTransaction} />
      )}
    </div>
  );
};

const TransactionList: React.FC<{ 
  transactions: Transaction[], 
  partners: any[], 
  onViewNote: (t: Transaction) => void,
  onEdit: (t: Transaction) => void,
  onDelete: (id: string) => void,
  canEdit: boolean
}> = ({ transactions, partners, onViewNote, onEdit, onDelete, canEdit }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-b dark:border-slate-600">
          <tr>
            <th className="p-4">Tanggal</th>
            <th className="p-4">Tipe</th>
            <th className="p-4">No. Referensi</th>
            <th className="p-4">Partner</th>
            <th className="p-4 text-center">Jml Item</th>
            <th className="p-4 text-right">Nilai Transaksi</th>
            <th className="p-4 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
          {transactions.map(t => {
            const partner = partners.find(p => p.id === t.partnerId);
            return (
              <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 text-gray-800 dark:text-gray-200">
                <td className="p-4">{t.date}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${t.type === 'IN' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200'}`}>
                    {t.type === 'IN' ? 'MASUK' : 'KELUAR'}
                  </span>
                </td>
                <td className="p-4 font-mono text-gray-600 dark:text-gray-400">{t.referenceNo}</td>
                <td className="p-4">{partner?.name || '-'}</td>
                <td className="p-4 text-center">{t.items.length}</td>
                <td className="p-4 text-right">
                  {t.totalValue.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <button 
                      onClick={() => onViewNote(t)} 
                      className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                      title="Cetak Surat"
                    >
                      <Printer size={16} />
                    </button>
                    {canEdit && (
                      <>
                        <button 
                          onClick={() => onEdit(t)} 
                          className="text-gray-500 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 p-1.5 rounded hover:bg-yellow-50 dark:hover:bg-yellow-900/30 transition-colors"
                          title="Edit / Revisi"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => onDelete(t.id)} 
                          className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                          title="Hapus / Batalkan"
                        >
                          <Trash size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
           {transactions.length === 0 && (
            <tr><td colSpan={7} className="p-8 text-center text-gray-400 dark:text-gray-500">Belum ada transaksi.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const TransactionForm: React.FC<{ 
  type: TransactionType, 
  initialData?: Transaction | null, 
  onSuccess: () => void, 
  onCancel: () => void
}> = ({ type, initialData, onSuccess, onCancel }) => {
  const { products, partners, addTransaction, updateTransaction } = useInventory();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [partnerId, setPartnerId] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<TransactionItem[]>([]);
  
  // Item entry state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0); // Manual price state

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setDate(initialData.date);
      setPartnerId(initialData.partnerId);
      setReferenceNo(initialData.referenceNo);
      setNotes(initialData.notes);
      setItems(initialData.items);
    } else {
      // Reset form if switching to 'New' mode
      setDate(new Date().toISOString().split('T')[0]);
      setPartnerId('');
      setReferenceNo('');
      setNotes('');
      setItems([]);
    }
  }, [initialData]);

  // Helper to find selected product
  const activeProduct = products.find(p => p.id === selectedProductId);

  // Calculate available stock considering what's already in the cart and original stock
  const getAvailableStock = (prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return 0;
    
    let baseStock = prod.currentStock;
    
    // LOGIC: If we are editing an OUT transaction, we must conceptually "return" 
    // the original items to the stock before validating the new quantity.
    if (initialData && initialData.type === 'OUT') {
      const originalItem = initialData.items.find(i => i.productId === prodId);
      if (originalItem) {
        baseStock += originalItem.quantity;
      }
    }

    // Subtract what is currently in the form's cart (accumulated)
    const inCartQty = items
      .filter(item => item.productId === prodId)
      .reduce((acc, item) => acc + item.quantity, 0);
      
    return baseStock - inCartQty;
  };

  const currentAvailable = activeProduct && type === 'OUT' ? getAvailableStock(activeProduct.id) : 999999;

  const handleAddItem = () => {
    if (!activeProduct || qty <= 0) return;

    // Strict Stock Validation for OUT transactions
    if (type === 'OUT') {
      if (qty > currentAvailable) {
        alert(`Stok tidak mencukupi! \nStok Tersedia (Termasuk Revisi): ${currentAvailable} ${activeProduct.unit}`);
        return;
      }
    }

    setItems(prev => [...prev, {
      productId: activeProduct.id,
      productName: activeProduct.name,
      productCode: activeProduct.code,
      quantity: qty,
      pricePerUnit: price, // Use the manually set price
      unit: activeProduct.unit // Save the unit at the time of transaction
    }]);
    
    // Reset inputs
    setSelectedProductId('');
    setQty(1);
    setPrice(0);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert("Masukkan minimal satu barang ke dalam daftar transaksi.");
      return;
    }

    const totalValue = items.reduce((acc, item) => acc + (item.quantity * item.pricePerUnit), 0);
    
    const transactionData: Transaction = {
      id: initialData ? initialData.id : crypto.randomUUID(),
      type,
      date,
      partnerId,
      referenceNo,
      notes,
      items,
      totalValue,
      createdAt: initialData ? initialData.createdAt : Date.now()
    };
    
    if (initialData) {
      updateTransaction(transactionData);
      alert("Revisi transaksi berhasil disimpan! Stok telah disesuaikan.");
    } else {
      addTransaction(transactionData);
      alert("Transaksi berhasil disimpan! Stok telah diperbarui.");
    }
    
    onSuccess();
  };

  // Filter partners based on transaction type
  const relevantPartners = partners.filter(p => type === 'IN' ? p.type === 'SUPPLIER' : p.type === 'CUSTOMER');

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 max-w-4xl mx-auto transition-colors">
      <h2 className="text-xl font-bold mb-6 border-b dark:border-slate-700 pb-2 text-gray-800 dark:text-white flex items-center justify-between">
        <span className="flex items-center">
          {type === 'IN' ? (
             <span className="text-blue-600 dark:text-blue-400 flex items-center"><ArrowRight className="mr-2"/> {initialData ? 'Revisi Barang Masuk' : 'Input Barang Masuk'}</span>
          ) : (
             <span className="text-orange-600 dark:text-orange-400 flex items-center"><ArrowLeft className="mr-2"/> {initialData ? 'Revisi Barang Keluar' : 'Input Barang Keluar'}</span>
          )}
        </span>
        {initialData && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded border border-yellow-200">Mode Edit</span>}
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
             <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tanggal Transaksi</label>
              <input required type="date" className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">No. Referensi (PO/Invoice)</label>
              <input required type="text" placeholder="Contoh: INV-001 / PO-2024" className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white" value={referenceNo} onChange={e => setReferenceNo(e.target.value)} />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{type === 'IN' ? 'Supplier (Pemasok)' : 'Customer (Pelanggan)'}</label>
              <select required className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white" value={partnerId} onChange={e => setPartnerId(e.target.value)}>
                <option value="">-- Pilih Partner --</option>
                {relevantPartners.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {relevantPartners.length === 0 && (
                <p className="text-xs text-red-500 mt-1">Belum ada data partner. Silakan tambahkan di menu Partner.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Catatan (Opsional)</label>
              <input type="text" placeholder="Keterangan tambahan..." className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-slate-700/50 p-5 rounded-lg mb-6 border dark:border-slate-700 shadow-inner">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex justify-between">
             <span>Item Transaksi</span>
             {activeProduct && type === 'OUT' && (
               <span className={`text-xs ${currentAvailable <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                 Stok Tersedia: <strong>{currentAvailable} {activeProduct.unit}</strong>
               </span>
             )}
          </h3>
          <div className="flex flex-col md:flex-row gap-3 mb-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs text-gray-500 mb-1">Pilih Produk</label>
              <select 
                className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white" 
                value={selectedProductId} 
                onChange={e => { 
                  const pid = e.target.value;
                  setSelectedProductId(pid); 
                  setQty(1); 
                  // Auto-populate price
                  const p = products.find(prod => prod.id === pid);
                  setPrice(p ? p.price : 0);
                }}
              >
                <option value="">-- Cari Produk --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name} {type === 'OUT' ? `(Sisa: ${p.currentStock} ${p.unit})` : `(${p.unit})`}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-32">
               <label className="block text-xs text-gray-500 mb-1">Harga Satuan</label>
               <input 
                type="number" 
                className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white"
                placeholder="Harga" 
                min="0"
                value={price}
                onChange={e => setPrice(Number(e.target.value))}
              />
            </div>
            <div className="w-full md:w-24">
               <label className="block text-xs text-gray-500 mb-1">Jumlah</label>
               <input 
                type="number" 
                className={`w-full border rounded p-2 bg-white dark:bg-slate-700 dark:text-white ${type === 'OUT' && qty > currentAvailable ? 'border-red-500 focus:ring-red-500' : 'dark:border-slate-600'}`}
                placeholder="Qty" 
                min="1"
                max={type === 'OUT' ? currentAvailable : undefined}
                value={qty}
                onChange={e => setQty(Number(e.target.value))}
              />
            </div>
            <button 
              type="button" 
              onClick={handleAddItem} 
              disabled={!selectedProductId || (type === 'OUT' && qty > currentAvailable)}
              className="w-full md:w-auto bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Plus size={20} className="mr-1" /> Tambah
            </button>
          </div>
          
          {type === 'OUT' && activeProduct && qty > currentAvailable && (
             <p className="text-xs text-red-500 mb-2 flex items-center"><AlertCircle size={12} className="mr-1"/> Jumlah melebihi stok tersedia.</p>
          )}

          {items.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border dark:border-slate-600">
              <table className="w-full bg-white dark:bg-slate-800 text-sm">
                <thead className="bg-gray-100 dark:bg-slate-700">
                  <tr className="text-gray-600 dark:text-gray-300">
                    <th className="p-3 text-left">Kode</th>
                    <th className="p-3 text-left">Nama Produk</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-center">Satuan</th>
                    <th className="p-3 text-right">Harga</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody className="text-gray-800 dark:text-gray-200 divide-y dark:divide-slate-700">
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-mono text-gray-500">{item.productCode}</td>
                      <td className="p-3 font-medium">{item.productName}</td>
                      <td className="p-3 text-center font-bold">{item.quantity}</td>
                      <td className="p-3 text-center text-gray-500">{item.unit}</td>
                      <td className="p-3 text-right">
                        {item.pricePerUnit.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {(item.quantity * item.pricePerUnit).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                      </td>
                      <td className="p-3 text-center">
                        <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30">
                          <Trash size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
             <div className="text-center py-6 text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-lg">
               Belum ada item ditambahkan.
             </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t dark:border-slate-700">
          <button type="button" onClick={onCancel} className="px-6 py-2 mr-3 border dark:border-slate-600 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700">
            Batal
          </button>
          <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 shadow-md flex items-center">
            <Save size={18} className="mr-2" /> {initialData ? 'Simpan Perubahan' : 'Simpan Transaksi'}
          </button>
        </div>
      </form>
    </div>
  );
};

const DeliveryNote: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
  const { settings, partners } = useInventory();
  const partner = partners.find(p => p.id === transaction.partnerId);
  const isIncoming = transaction.type === 'IN';

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto shadow-lg print:shadow-none print:w-full text-gray-900">
      {/* Note: We force light mode colors here because printed documents are usually white */}
      <div className="flex justify-between items-start border-b pb-6 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 uppercase tracking-wide">
            {isIncoming ? 'Bukti Penerimaan Barang' : 'Surat Jalan'}
          </h1>
          <div className="mt-2 text-gray-600">
            <p className="font-bold">{settings.name}</p>
            <p className="text-sm max-w-xs">{settings.address}</p>
            <p className="text-sm">{settings.phone}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">No. Referensi</p>
          <p className="text-xl font-mono font-bold text-gray-800">{transaction.referenceNo}</p>
          <p className="text-sm text-gray-500 mt-2">Tanggal</p>
          <p className="font-medium text-gray-800">{transaction.date}</p>
        </div>
      </div>

      <div className="mb-8 p-4 bg-gray-50 rounded border border-gray-200">
        <p className="text-xs text-gray-500 uppercase font-bold mb-1">
          {isIncoming ? 'Diterima Dari:' : 'Kepada Yth:'}
        </p>
        <p className="font-bold text-lg text-gray-800">{partner?.name || (isIncoming ? 'Supplier Umum' : 'Cash Customer')}</p>
        <p className="text-sm text-gray-700">{partner?.address}</p>
        <p className="text-sm text-gray-700">{partner?.contact}</p>
      </div>

      <table className="w-full mb-8 border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-800">
            <th className="py-2 text-left w-12 text-gray-800">No.</th>
            <th className="py-2 text-left text-gray-800">Kode Barang</th>
            <th className="py-2 text-left text-gray-800">Nama Barang</th>
            <th className="py-2 text-center text-gray-800">Qty</th>
            <th className="py-2 text-center text-gray-800">Unit</th>
          </tr>
        </thead>
        <tbody className="text-gray-700">
          {transaction.items.map((item, idx) => (
            <tr key={idx} className="border-b border-gray-200">
              <td className="py-3">{idx + 1}</td>
              <td className="py-3 font-mono text-sm">{item.productCode}</td>
              <td className="py-3">{item.productName}</td>
              <td className="py-3 text-center font-bold">{item.quantity}</td>
              <td className="py-3 text-center text-gray-500 text-sm">{item.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-12 flex justify-between text-center print:mt-20">
        <div className="w-48">
          <p className="mb-16 border-b border-gray-300 pb-2 text-gray-800">
            {isIncoming ? 'Diserahkan Oleh' : 'Penerima'}
          </p>
          <p className="text-sm text-gray-500">
            {isIncoming ? '(Supplier/Kurir)' : '(Tanda Tangan & Stempel)'}
          </p>
        </div>
        <div className="w-48">
          <p className="mb-16 border-b border-gray-300 pb-2 text-gray-800">
            {isIncoming ? 'Diterima Oleh' : 'Hormat Kami'}
          </p>
          <p className="text-sm text-gray-500">({settings.name})</p>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t flex justify-end gap-3 no-print">
        <button 
          onClick={() => window.print()} 
          className="px-6 py-2 bg-gray-800 text-white rounded shadow hover:bg-gray-900 flex items-center transition-colors"
        >
          <Printer size={18} className="mr-2" /> 
          {isIncoming ? 'Cetak Bukti Masuk' : 'Cetak Surat Jalan'}
        </button>
      </div>
    </div>
  );
};

export default TransactionManager;
