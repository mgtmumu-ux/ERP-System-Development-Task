
import React, { useState, useMemo, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Order, OrderType, OrderStatus, TransactionItem, Transaction, Product } from '../types';
import { Plus, Printer, Trash, Edit, CheckCircle, XCircle, FileText, ArrowRight, Truck, PackageCheck, FileSpreadsheet, Sparkles, AlertTriangle, Users, RefreshCw, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const OrderManager: React.FC = () => {
  const { orders, partners, products, addOrder, currentUser } = useInventory();
  const [activeTab, setActiveTab] = useState<OrderType>('PO'); // PO or SO
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'DETAIL' | 'RESTOCK'>('LIST');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // RBAC: Project Staff can create/edit. Manager Read Only.
  const canEdit = currentUser?.role === 'ADMIN' || currentUser?.role === 'PROJECT';

  const filteredOrders = orders.filter(o => o.type === activeTab);

  const handleCreateNew = () => {
    setSelectedOrder(null);
    setViewMode('FORM');
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setViewMode('DETAIL');
  };

  const exportToExcel = () => {
    if (filteredOrders.length === 0) {
      alert("Tidak ada data untuk diexport.");
      return;
    }

    const data = filteredOrders.map(o => {
      const partner = partners.find(p => p.id === o.partnerId);
      // Get unique categories for export
      const uniqueCategories = Array.from(new Set(
        o.items.map(item => products.find(prod => prod.id === item.productId)?.category).filter(Boolean)
      )).join(', ');

      return {
        "Tanggal": o.date,
        "No. Order": o.orderNumber,
        "Tipe": o.type === 'PO' ? 'Purchase Order' : 'Sales Order',
        "Partner": partner?.name || 'Unknown',
        "Kategori": uniqueCategories,
        "Jumlah Item": o.items.length,
        "Total Nilai": o.totalValue,
        "Status": o.status,
        "Catatan": o.notes
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const wscols = Object.keys(data[0]).map(k => ({ wch: k.length + 10 }));
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Data_${activeTab}`);
    
    XLSX.writeFile(workbook, `Laporan_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          {viewMode === 'LIST' && `Pesanan (${activeTab === 'PO' ? 'Pembelian' : 'Penjualan'})`}
          {viewMode === 'FORM' && `Buat ${activeTab === 'PO' ? 'Purchase Order' : 'Sales Order'} Baru`}
          {viewMode === 'DETAIL' && `Detail ${activeTab}`}
          {viewMode === 'RESTOCK' && `Smart Restock (PO Otomatis)`}
        </h1>
        
        <div className="flex space-x-2">
          {viewMode === 'LIST' && (
            <>
              <div className="bg-gray-100 dark:bg-slate-700 p-1 rounded-lg flex mr-4">
                <button 
                  onClick={() => setActiveTab('PO')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'PO' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  Purchase Order (PO)
                </button>
                <button 
                  onClick={() => setActiveTab('SO')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'SO' ? 'bg-white dark:bg-slate-600 text-orange-600 dark:text-orange-300 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  Sales Order (SO)
                </button>
              </div>
              
              {activeTab === 'PO' && canEdit && (
                <button 
                  onClick={() => setViewMode('RESTOCK')}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center shadow-sm mr-2 text-sm animate-pulse"
                  title="Buat PO Otomatis untuk barang stok rendah"
                >
                  <Sparkles size={18} className="mr-2" /> Auto Restock
                </button>
              )}

              <button 
                onClick={exportToExcel}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center shadow-sm mr-2 text-sm"
                title="Export data ke Excel"
              >
                <FileSpreadsheet size={18} className="mr-2" /> Export
              </button>
              {canEdit && (
                <button 
                  onClick={handleCreateNew}
                  className={`px-4 py-2 text-white rounded-lg flex items-center ${activeTab === 'PO' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'}`}
                >
                  <Plus size={18} className="mr-2" /> Buat {activeTab}
                </button>
              )}
            </>
          )}
          {viewMode !== 'LIST' && (
            <button 
              onClick={() => { setViewMode('LIST'); setSelectedOrder(null); }} 
              className="px-4 py-2 border bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600"
            >
              Kembali
            </button>
          )}
        </div>
      </div>

      {viewMode === 'LIST' && (
        <OrderList orders={filteredOrders} onView={handleViewOrder} type={activeTab} />
      )}

      {viewMode === 'FORM' && canEdit && (
        <OrderForm type={activeTab} onSuccess={() => setViewMode('LIST')} />
      )}

      {viewMode === 'DETAIL' && selectedOrder && (
        <OrderDetail order={selectedOrder} onBack={() => setViewMode('LIST')} canEdit={canEdit} />
      )}

      {viewMode === 'RESTOCK' && (
        <RestockGenerator 
          products={products} 
          onCancel={() => setViewMode('LIST')} 
          onSuccess={() => setViewMode('LIST')} 
        />
      )}
    </div>
  );
};

// --- RESTOCK GENERATOR COMPONENT ---

interface RestockItem {
  product: Product;
  orderQty: number;
  selected: boolean;
}

interface SupplierGroup {
  supplierId: string;
  supplierName: string;
  items: RestockItem[];
}

const RestockGenerator: React.FC<{ 
  products: Product[], 
  onCancel: () => void, 
  onSuccess: () => void 
}> = ({ products, onCancel, onSuccess }) => {
  const { partners, addOrder, transactions } = useInventory();
  const [groups, setGroups] = useState<SupplierGroup[]>([]);
  
  // Initialize logic on mount
  useEffect(() => {
    const lowStockProducts = products.filter(p => p.currentStock <= p.minStock);
    
    // Helper to find last supplier for a product based on transaction history
    const getLastSupplierId = (productId: string): string | null => {
      // Find the most recent 'IN' transaction for this product
      // Context transactions are sorted desc by default, so find() gets the latest
      const lastTx = transactions.find(t => 
        t.type === 'IN' && t.items.some(i => i.productId === productId)
      );
      return lastTx ? lastTx.partnerId : null;
    };

    const tempGroups: Record<string, SupplierGroup> = {};

    lowStockProducts.forEach(p => {
      const lastSupplierId = getLastSupplierId(p.id) || 'unknown';
      const supplierName = lastSupplierId === 'unknown' 
        ? 'Supplier Belum Ditentukan' 
        : partners.find(ptr => ptr.id === lastSupplierId)?.name || 'Unknown Supplier';

      if (!tempGroups[lastSupplierId]) {
        tempGroups[lastSupplierId] = {
          supplierId: lastSupplierId,
          supplierName: supplierName,
          items: []
        };
      }

      // Default logic: Order enough to reach safe levels.
      // Heuristic: minStock * 3 to cover lead time and safety stock
      tempGroups[lastSupplierId].items.push({
        product: p,
        orderQty: Math.max(p.minStock * 3, 10), 
        selected: true
      });
    });

    setGroups(Object.values(tempGroups));
  }, [products, transactions, partners]);

  const handleQtyChange = (supplierId: string, productId: string, qty: number) => {
    setGroups(prev => prev.map(g => {
      if (g.supplierId !== supplierId) return g;
      return {
        ...g,
        items: g.items.map(i => i.product.id === productId ? { ...i, orderQty: qty } : i)
      };
    }));
  };

  const toggleItem = (supplierId: string, productId: string) => {
    setGroups(prev => prev.map(g => {
      if (g.supplierId !== supplierId) return g;
      return {
        ...g,
        items: g.items.map(i => i.product.id === productId ? { ...i, selected: !i.selected } : i)
      };
    }));
  };

  const handleAssignSupplier = (oldGroupId: string, newSupplierId: string) => {
    if (!newSupplierId) return;
    
    setGroups(prev => {
      const oldGroup = prev.find(g => g.supplierId === oldGroupId);
      if (!oldGroup) return prev;

      const newPartner = partners.find(p => p.id === newSupplierId);
      const newSupplierName = newPartner?.name || 'Unknown';

      // Check if new group exists
      const existingGroupIndex = prev.findIndex(g => g.supplierId === newSupplierId);
      
      let newGroups = [...prev];

      if (existingGroupIndex > -1) {
        // Merge into existing group
        newGroups[existingGroupIndex].items = [
          ...newGroups[existingGroupIndex].items,
          ...oldGroup.items
        ];
        // Remove old group
        newGroups = newGroups.filter(g => g.supplierId !== oldGroupId);
      } else {
        // Update old group with new supplier details
        newGroups = newGroups.map(g => {
           if (g.supplierId === oldGroupId) {
             return { ...g, supplierId: newSupplierId, supplierName: newSupplierName };
           }
           return g;
        });
      }
      return newGroups;
    });
  };

  const handleGenerateOrders = () => {
    let generatedCount = 0;

    groups.forEach(group => {
      const selectedItems = group.items.filter(i => i.selected);
      if (selectedItems.length === 0) return;
      
      if (group.supplierId === 'unknown') {
        alert("Mohon pilih supplier untuk grup 'Supplier Belum Ditentukan' sebelum membuat PO.");
        return;
      }

      const orderItems: TransactionItem[] = selectedItems.map(i => ({
        productId: i.product.id,
        productName: i.product.name,
        productCode: i.product.code,
        quantity: i.orderQty,
        pricePerUnit: i.product.price, // Use base price from product master
        unit: i.product.unit
      }));

      const totalValue = orderItems.reduce((acc, i) => acc + (i.quantity * i.pricePerUnit), 0);

      const newOrder: Order = {
        id: crypto.randomUUID(),
        orderNumber: `PO-AUTO-${Math.floor(Math.random() * 10000)}`,
        type: 'PO',
        partnerId: group.supplierId,
        date: new Date().toISOString().split('T')[0],
        status: 'DRAFT',
        items: orderItems,
        totalValue,
        notes: 'Generated via Auto Restock based on low stock analysis.',
        createdAt: Date.now()
      };

      addOrder(newOrder);
      generatedCount++;
    });

    if (generatedCount > 0) {
      alert(`${generatedCount} Draft Purchase Order berhasil dibuat! Silakan cek daftar pesanan.`);
      onSuccess();
    } else {
      alert("Tidak ada item yang dipilih atau Supplier belum ditentukan.");
    }
  };

  const suppliers = partners.filter(p => p.type === 'SUPPLIER');

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 max-w-5xl mx-auto transition-colors">
      <div className="flex items-center mb-6 text-purple-600 dark:text-purple-400 border-b dark:border-slate-700 pb-4">
        <Sparkles size={28} className="mr-3" />
        <div>
          <h2 className="text-2xl font-bold">Auto Restock Generator</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sistem menganalisis riwayat transaksi untuk mengelompokkan barang stok rendah berdasarkan Supplier langganan.
          </p>
        </div>
      </div>

      <div className="space-y-6 mb-8">
        {groups.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 dark:bg-slate-700/30 rounded-lg">
             <CheckCircle size={48} className="mx-auto text-green-500 mb-2" />
             <h3 className="text-lg font-bold text-gray-700 dark:text-white">Semua Stok Aman</h3>
             <p className="text-gray-500 dark:text-gray-400">Tidak ada barang yang perlu di-restock saat ini.</p>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.supplierId} className={`border rounded-xl overflow-hidden transition-all ${group.supplierId === 'unknown' ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-700' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
              <div className="p-4 bg-gray-50 dark:bg-slate-700/50 border-b dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                 <div className="flex items-center">
                    <Users className={`mr-2 ${group.supplierId === 'unknown' ? 'text-orange-500' : 'text-blue-500'}`} size={20} />
                    <h3 className="font-bold text-gray-800 dark:text-white text-lg">{group.supplierName}</h3>
                    <span className="ml-3 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200 text-xs px-2 py-1 rounded-full">{group.items.filter(i => i.selected).length} Item Dipilih</span>
                 </div>
                 
                 {group.supplierId === 'unknown' && (
                   <div className="flex items-center gap-2">
                     <span className="text-xs text-orange-600 dark:text-orange-400 font-bold whitespace-nowrap">⚠ Tentukan Supplier:</span>
                     <select 
                        className="text-sm border border-orange-300 dark:border-orange-700 rounded p-1.5 bg-white dark:bg-slate-800 dark:text-white"
                        onChange={(e) => handleAssignSupplier(group.supplierId, e.target.value)}
                        defaultValue=""
                     >
                       <option value="" disabled>Pilih...</option>
                       {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                     </select>
                   </div>
                 )}
              </div>

              <div className="p-0 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 border-b dark:border-slate-700">
                    <tr>
                      <th className="p-3 w-10 text-center">#</th>
                      <th className="p-3">Produk</th>
                      <th className="p-3 text-center">Stok / Min</th>
                      <th className="p-3 w-40">Jumlah Order</th>
                      <th className="p-3 w-10">Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-700">
                    {group.items.map(item => (
                      <tr key={item.product.id} className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 ${!item.selected ? 'opacity-50 grayscale' : ''}`}>
                        <td className="p-3 text-center">
                          <input 
                            type="checkbox" 
                            checked={item.selected} 
                            onChange={() => toggleItem(group.supplierId, item.product.id)}
                            className="w-4 h-4 text-purple-600 rounded"
                          />
                        </td>
                        <td className="p-3">
                          <p className="font-medium text-gray-800 dark:text-gray-200">{item.product.name}</p>
                          <p className="text-xs text-gray-500">{item.product.code}</p>
                        </td>
                        <td className="p-3 text-center">
                           <span className="text-red-500 font-bold">{item.product.currentStock}</span>
                           <span className="text-gray-400 mx-1">/</span>
                           <span className="text-gray-600 dark:text-gray-400">{item.product.minStock}</span>
                        </td>
                        <td className="p-3">
                           <input 
                             type="number" 
                             className="w-full border dark:border-slate-600 rounded p-1.5 text-center font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-700"
                             value={item.orderQty}
                             onChange={(e) => handleQtyChange(group.supplierId, item.product.id, Number(e.target.value))}
                             min="1"
                             disabled={!item.selected}
                           />
                        </td>
                        <td className="p-3 text-gray-500 dark:text-gray-400 text-sm">{item.product.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t dark:border-slate-700">
        <button onClick={onCancel} className="px-6 py-2 border dark:border-slate-600 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700">
          Batal
        </button>
        <button 
          onClick={handleGenerateOrders}
          disabled={groups.length === 0}
          className="px-6 py-2 bg-purple-600 text-white rounded font-bold hover:bg-purple-700 shadow-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={18} className="mr-2" /> Generate {groups.filter(g => g.supplierId !== 'unknown').length} Purchase Orders
        </button>
      </div>
    </div>
  );
};

const OrderList: React.FC<{ orders: Order[], onView: (o: Order) => void, type: OrderType }> = ({ orders, onView, type }) => {
  const { partners, products } = useInventory();

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'DRAFT': return <span className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs font-bold">DRAFT</span>;
      case 'OPEN': return <span className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded text-xs font-bold">OPEN</span>;
      case 'PARTIALLY_FULFILLED': return <span className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200 px-2 py-1 rounded text-xs font-bold">SEBAGIAN</span>;
      case 'COMPLETED': return <span className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded text-xs font-bold">SELESAI</span>;
      case 'CANCELLED': return <span className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 px-2 py-1 rounded text-xs font-bold">BATAL</span>;
      default: return null;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 dark:bg-slate-700 border-b dark:border-slate-600">
          <tr className="text-gray-600 dark:text-gray-300">
            <th className="p-4">Tanggal</th>
            <th className="p-4">No. Order</th>
            <th className="p-4">{type === 'PO' ? 'Supplier' : 'Customer'}</th>
            <th className="p-4">Kategori</th>
            <th className="p-4 text-center">Jml Item</th>
            <th className="p-4 text-right">Total Nilai</th>
            <th className="p-4 text-center">Status</th>
            <th className="p-4 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-slate-700 text-gray-800 dark:text-gray-200">
          {orders.map(o => {
            const partner = partners.find(p => p.id === o.partnerId);
            const categories = Array.from(new Set(
              o.items.map(item => products.find(prod => prod.id === item.productId)?.category).filter(Boolean)
            )).join(', ');

            return (
              <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer" onClick={() => onView(o)}>
                <td className="p-4">{o.date}</td>
                <td className="p-4 font-mono font-medium text-gray-700 dark:text-gray-300">{o.orderNumber}</td>
                <td className="p-4">{partner?.name || '-'}</td>
                <td className="p-4 text-gray-600 dark:text-gray-400 text-xs">{categories || '-'}</td>
                <td className="p-4 text-center">{o.items.length}</td>
                <td className="p-4 text-right">
                  {o.totalValue.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                </td>
                <td className="p-4 text-center">{getStatusBadge(o.status)}</td>
                <td className="p-4 text-center text-blue-600 dark:text-blue-400">
                  <ArrowRight size={18} className="mx-auto" />
                </td>
              </tr>
            );
          })}
          {orders.length === 0 && (
             <tr><td colSpan={8} className="p-8 text-center text-gray-400 dark:text-gray-500">Belum ada pesanan.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const OrderForm: React.FC<{ type: OrderType, onSuccess: () => void }> = ({ type, onSuccess }) => {
  const { products, partners, addOrder } = useInventory();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderNumber, setOrderNumber] = useState(`${type}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [partnerId, setPartnerId] = useState('');
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [notes, setNotes] = useState('');
  
  // Item Entry
  const [selectedProduct, setSelectedProduct] = useState('');
  const [qty, setQty] = useState(1);

  const relevantPartners = partners.filter(p => type === 'PO' ? p.type === 'SUPPLIER' : p.type === 'CUSTOMER');
  const selectedProductData = products.find(p => p.id === selectedProduct);

  const handleAddItem = () => {
    if (!selectedProduct || qty <= 0) return;
    const prod = products.find(p => p.id === selectedProduct);
    if (!prod) return;

    setItems([...items, {
      productId: prod.id,
      productName: prod.name,
      productCode: prod.code,
      quantity: qty,
      pricePerUnit: prod.price,
      unit: prod.unit
    }]);
    setSelectedProduct('');
    setQty(1);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert("Minimal satu item harus ditambahkan.");
      return;
    }

    const totalValue = items.reduce((acc, i) => acc + (i.quantity * i.pricePerUnit), 0);

    const newOrder: Order = {
      id: crypto.randomUUID(),
      orderNumber,
      type,
      partnerId,
      date,
      status: 'DRAFT',
      items,
      totalValue,
      notes,
      createdAt: Date.now()
    };

    addOrder(newOrder);
    alert('Pesanan berhasil dibuat (Status: Draft).');
    onSuccess();
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 max-w-4xl mx-auto transition-colors">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">No. Order</label>
            <input required type="text" className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white" value={orderNumber} onChange={e => setOrderNumber(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tanggal</label>
            <input required type="date" className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{type === 'PO' ? 'Supplier' : 'Customer'}</label>
            <select required className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white" value={partnerId} onChange={e => setPartnerId(e.target.value)}>
              <option value="">Pilih Partner...</option>
              {relevantPartners.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Catatan</label>
            <input type="text" className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg mb-6 border dark:border-slate-700">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Item Pesanan</h3>
          <div className="flex gap-2 mb-4 items-start">
            <div className="flex-1">
              <select 
                className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white" 
                value={selectedProduct} 
                onChange={e => setSelectedProduct(e.target.value)}
              >
                <option value="">Pilih Produk...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.code} - {p.name} {type === 'SO' ? `(Stok: ${p.currentStock})` : ''}</option>
                ))}
              </select>
              {type === 'SO' && selectedProductData && selectedProductData.currentStock <= 0 && (
                <p className="text-xs text-red-500 mt-1">Stok saat ini 0. Pesanan akan menjadi backorder.</p>
              )}
            </div>
            <input 
              type="number" 
              className="w-24 border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 dark:text-white" 
              placeholder="Qty" 
              min="1"
              value={qty}
              onChange={e => setQty(Number(e.target.value))}
            />
            <button type="button" onClick={handleAddItem} className="bg-blue-600 text-white px-4 py-2 h-10 rounded hover:bg-blue-700">
              <Plus size={20} />
            </button>
          </div>

          {items.length > 0 ? (
            <table className="w-full bg-white dark:bg-slate-800 border dark:border-slate-600 rounded text-sm">
              <thead className="bg-gray-100 dark:bg-slate-700">
                <tr className="text-gray-600 dark:text-gray-300">
                  <th className="p-2 text-left">Produk</th>
                  <th className="p-2 text-center">Qty</th>
                  <th className="p-2 text-center">Satuan</th>
                  <th className="p-2 text-right">Harga</th>
                  <th className="p-2 text-right">Subtotal</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody className="text-gray-800 dark:text-gray-200 divide-y dark:divide-slate-700">
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-2">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.productCode}</p>
                    </td>
                    <td className="p-2 text-center">{item.quantity}</td>
                    <td className="p-2 text-center text-gray-500 dark:text-gray-400">{item.unit || '-'}</td>
                    <td className="p-2 text-right">
                      {item.pricePerUnit.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                    </td>
                    <td className="p-2 text-right">
                      {(item.quantity * item.pricePerUnit).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                    </td>
                    <td className="p-2 text-center">
                      <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400"><Trash size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="text-center text-gray-400 dark:text-gray-500 py-4">Belum ada item ditambahkan.</p>}
        </div>

        <div className="flex justify-end pt-4 border-t dark:border-slate-700">
          <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700">
            Simpan Draft
          </button>
        </div>
      </form>
    </div>
  );
};

const OrderDetail: React.FC<{ order: Order, onBack: () => void, canEdit: boolean }> = ({ order, onBack, canEdit }) => {
  const { partners, updateOrder, addTransaction, settings, products } = useInventory();
  const partner = partners.find(p => p.id === order.partnerId);

  // Check for stock availability specifically for SO
  const checkStock = (item: TransactionItem) => {
    if (order.type !== 'SO') return true;
    const prod = products.find(p => p.id === item.productId);
    return prod && prod.currentStock >= item.quantity;
  };

  const allStockAvailable = order.items.every(checkStock);

  const handleStatusChange = (status: OrderStatus) => {
    if (!canEdit) return;

    const isPO = order.type === 'PO';
    let confirmMsg = '';

    if (status === 'OPEN') {
      const title = isPO ? "TERBITKAN PURCHASE ORDER" : "KONFIRMASI SALES ORDER";
      const action = isPO 
        ? "Apakah Anda yakin data sudah benar dan siap diterbitkan ke Supplier?" 
        : "Apakah Anda yakin menyetujui pesanan ini untuk diproses?";
      
      const consequences = [
        "Status berubah menjadi OPEN (Pesanan Aktif).",
        "Data item dan harga TERKUNCI untuk menjaga integritas.",
        isPO ? "Menunggu barang datang untuk proses penerimaan (Fulfill)." : "Menunggu pengiriman barang untuk pengurangan stok (Fulfill)."
      ];

      confirmMsg = `=== ${title} ===\n\n${action}\n\nKONSEKUENSI:\n${consequences.map(c => `- ${c}`).join('\n')}`;

    } else if (status === 'CANCELLED') {
      const title = "BATALKAN PESANAN";
      const action = "Apakah Anda yakin ingin membatalkan pesanan ini?";
      
      const consequences = [
        "Status berubah menjadi CANCELLED (Batal).",
        "Pesanan dianggap tidak valid.",
        "Tidak ada perubahan pada stok inventaris."
      ];

      confirmMsg = `=== ${title} ===\n\n${action}\n\nKONSEKUENSI:\n${consequences.map(c => `- ${c}`).join('\n')}`;
    } else {
      confirmMsg = `Ubah status pesanan menjadi ${status}?`;
    }

    if (confirm(confirmMsg)) {
       updateOrder({ ...order, status });
    }
  };

  const handleFulfill = () => {
    if (!canEdit) return;

    // 1. Validasi Stok untuk Sales Order (SO)
    if (order.type === 'SO' && !allStockAvailable) {
        alert(`Gagal memproses pesanan! Beberapa item stoknya tidak mencukupi. Periksa tanda peringatan merah pada daftar item.`);
        return;
    }

    // 2. Konfirmasi User
    const isPO = order.type === 'PO';
    const title = isPO ? "TERIMA BARANG MASUK" : "KIRIM BARANG KELUAR";
    const action = isPO 
      ? "Apakah fisik barang sudah diterima dan sesuai dengan PO?" 
      : "Apakah barang sudah siap dikirim dan diambil dari gudang?";
    
    const consequences = [
      "Status pesanan menjadi COMPLETED (Selesai).",
      isPO ? "Stok fisik bertambah & Transaksi 'Masuk' tercatat." : "Stok fisik berkurang & Transaksi 'Keluar' tercatat.",
      isPO ? "Nilai aset gudang akan meningkat." : "Jika stok mencapai batas minimum, notifikasi restock akan muncul."
    ];
      
    const confirmMsg = `=== ${title} ===\n\n${action}\n\nKONSEKUENSI:\n${consequences.map(c => `- ${c}`).join('\n')}\n\nLanjutkan proses?`;

    if (!confirm(confirmMsg)) return;

    // 3. Buat Transaksi Otomatis (IN untuk PO, OUT untuk SO)
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      type: order.type === 'PO' ? 'IN' : 'OUT',
      date: new Date().toISOString().split('T')[0],
      partnerId: order.partnerId,
      referenceNo: order.orderNumber,
      notes: `Auto-generated fulfillment of ${order.type} #${order.orderNumber}`,
      items: order.items,
      totalValue: order.totalValue,
      createdAt: Date.now()
    };

    // 4. Eksekusi
    addTransaction(transaction); // Context akan handle logika update stok (+/-)
    updateOrder({ ...order, status: 'COMPLETED', relatedTransactionId: transaction.id });
    
    alert(`Pesanan ${order.orderNumber} Selesai!\nStok telah diperbarui.`);
    onBack();
  };

  const handleExportDetail = () => {
    // Header Data
    const headerInfo = [
      ["DETAIL ORDER"],
      ["No. Order", order.orderNumber],
      ["Tanggal", order.date],
      ["Status", order.status],
      ["Partner", partner?.name || 'Unknown'],
      ["Alamat", partner?.address || '-'],
      ["Kontak", partner?.contact || '-'],
      [] // Empty row
    ];

    // Table Header
    const tableHeader = ["Kode Barang", "Nama Barang", "Qty", "Unit", "Harga Satuan", "Total Harga"];
    
    // Table Data
    const tableData = order.items.map(item => [
      item.productCode,
      item.productName,
      item.quantity,
      item.unit,
      item.pricePerUnit,
      item.quantity * item.pricePerUnit
    ]);

    // Total Row
    const totalRow = ["", "", "", "", "TOTAL", order.totalValue];

    const worksheet = XLSX.utils.aoa_to_sheet([...headerInfo, tableHeader, ...tableData, totalRow]);
    
    // Column Widths
    worksheet['!cols'] = [{wch: 15}, {wch: 30}, {wch: 10}, {wch: 10}, {wch: 15}, {wch: 15}];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Detail Order");
    XLSX.writeFile(workbook, `${order.orderNumber}_Detail.xlsx`);
  };

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto shadow-lg print:shadow-none print:w-full text-gray-900">
      {/* Note: Light mode only forced for Order Detail view as it mimics paper document */}
      <div className="flex justify-between items-start border-b pb-6 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 uppercase tracking-wide">
            {order.type === 'PO' ? 'Purchase Order' : 'Sales Order'}
          </h1>
          <div className="mt-2 text-gray-600">
            <p className="font-bold">{settings.name}</p>
            <p className="text-sm max-w-xs">{settings.address}</p>
            <p className="text-sm">{settings.phone}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">No. Order</p>
          <p className="text-xl font-mono font-bold text-gray-800">{order.orderNumber}</p>
          <p className="text-sm text-gray-500 mt-2">Tanggal</p>
          <p className="font-medium text-gray-800">{order.date}</p>
          <p className="text-sm text-gray-500 mt-2">Status</p>
          <p className={`font-bold inline-block px-2 py-1 rounded text-sm ${
            order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
            order.status === 'PARTIALLY_FULFILLED' ? 'bg-orange-100 text-orange-700' :
            order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {order.status}
          </p>
        </div>
      </div>

      {/* PARTNER INFO */}
      <div className="mb-8 p-4 bg-gray-50 rounded border border-gray-200">
        <p className="text-xs text-gray-500 uppercase font-bold mb-1">
          {order.type === 'PO' ? 'Vendor / Supplier:' : 'Customer:'}
        </p>
        <p className="font-bold text-lg text-gray-800">{partner?.name || 'Unknown Partner'}</p>
        <p className="text-sm text-gray-700">{partner?.address}</p>
        <p className="text-sm text-gray-700">{partner?.contact}</p>
      </div>

      {/* ITEMS TABLE */}
      <table className="w-full mb-8 border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-gray-800">
            <th className="py-2 text-left w-12 text-gray-800">No.</th>
            <th className="py-2 text-left text-gray-800">Kode Barang</th>
            <th className="py-2 text-left text-gray-800">Deskripsi</th>
            <th className="py-2 text-center text-gray-800">Qty</th>
            <th className="py-2 text-center text-gray-500">Unit</th>
            <th className="py-2 text-right text-gray-800">Harga Satuan</th>
            <th className="py-2 text-right text-gray-800">Total</th>
          </tr>
        </thead>
        <tbody className="text-gray-700">
          {order.items.map((item, idx) => {
            const isStockOk = checkStock(item);
            const prod = products.find(p => p.id === item.productId);
            
            return (
              <tr key={idx} className={`border-b border-gray-200 ${!isStockOk ? 'bg-red-50' : ''}`}>
                <td className="py-3">{idx + 1}</td>
                <td className="py-3 font-mono text-gray-600">{item.productCode}</td>
                <td className="py-3">
                  {item.productName}
                  {/* Warning label if stock insufficient for SO */}
                  {!isStockOk && (
                    <div className="flex items-center text-red-600 text-xs font-bold mt-1">
                      <AlertTriangle size={12} className="mr-1" />
                      Stok Kurang (Sisa: {prod?.currentStock || 0})
                    </div>
                  )}
                </td>
                <td className="py-3 text-center font-bold">{item.quantity}</td>
                <td className="py-3 text-center text-gray-500">{item.unit || '-'}</td>
                <td className="py-3 text-right">
                  {item.pricePerUnit.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                </td>
                <td className="py-3 text-right font-medium">
                  {(item.quantity * item.pricePerUnit).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={6} className="py-4 text-right font-bold text-lg text-gray-800">TOTAL</td>
            <td className="py-4 text-right font-bold text-lg border-t border-gray-800 text-gray-800">
              {order.totalValue.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* NOTES */}
      {order.notes && (
        <div className="mb-12">
          <p className="text-sm font-bold text-gray-500 mb-1">Catatan:</p>
          <p className="text-sm text-gray-700 italic bg-yellow-50 p-3 rounded">{order.notes}</p>
        </div>
      )}

      {/* SIGNATURES */}
      <div className="mt-12 flex justify-between text-center print:mt-20 page-break-inside-avoid">
        <div className="w-48">
          <p className="mb-16 border-b border-gray-300 pb-2 text-gray-800">Disetujui Oleh</p>
          <p className="text-sm text-gray-500">(Manager)</p>
        </div>
        <div className="w-48">
          <p className="mb-16 border-b border-gray-300 pb-2 text-gray-800">Dibuat Oleh</p>
          <p className="text-sm text-gray-500">(Admin)</p>
        </div>
      </div>

      {/* ACTION BUTTONS (Hidden when printing) */}
      <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center gap-3 no-print">
        
        {/* Left Side: Document Actions */}
        <div className="flex gap-2">
           <button onClick={handleExportDetail} className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 flex items-center transition-colors">
            <FileSpreadsheet size={18} className="mr-2" /> Export Excel
          </button>
          <button onClick={() => window.print()} className="px-4 py-2 bg-gray-800 text-white rounded shadow hover:bg-gray-900 flex items-center transition-colors">
            <Printer size={18} className="mr-2" /> Cetak Dokumen
          </button>
        </div>

        {/* Right Side: Process Actions */}
        {canEdit && (
          <div className="flex gap-2 items-center">
            {order.status === 'DRAFT' && (
              <button onClick={() => handleStatusChange('OPEN')} className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 flex items-center transition-colors font-medium">
                <CheckCircle size={18} className="mr-2" /> Konfirmasi Order
              </button>
            )}
            
            {(order.status === 'OPEN' || order.status === 'PARTIALLY_FULFILLED') && (
              <div className="flex flex-col items-end">
                <button 
                  onClick={handleFulfill} 
                  disabled={order.type === 'SO' && !allStockAvailable}
                  className={`px-4 py-2 text-white rounded shadow flex items-center transition-colors font-bold ${
                    order.type === 'SO' && !allStockAvailable 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700 animate-pulse'
                  }`}
                >
                  <PackageCheck size={18} className="mr-2" /> 
                  {order.type === 'PO' ? 'Terima Barang & Tambah Stok' : 'Kirim Barang & Kurangi Stok'}
                </button>
              </div>
            )}

            {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
              <button onClick={() => handleStatusChange('CANCELLED')} className="px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 border border-red-200 transition-colors">
                Batalkan
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManager;
