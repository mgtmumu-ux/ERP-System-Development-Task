
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  CompanySettings, 
  InventoryContextType, 
  Partner, 
  Product, 
  StockOpname, 
  Transaction,
  Order,
  StorageLocation,
  User
} from '../types';

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const defaultSettings: CompanySettings = {
  name: 'PT MODULAR GLOBAL TEKINDO',
  address: 'Jl. manglid NO.42, Margahayu Selatan, Kec.Margahayu, Kab.Bandung, Jawa barat 40226',
  phone: '02254439313',
  email: 'admin@modularglobal.com',
  currency: 'IDR'
};

const DEFAULT_USERS: User[] = [
  { username: 'admin', name: 'Super Admin', role: 'ADMIN', password: '123' },
  { username: 'inventory', name: 'Staf Gudang', role: 'INVENTORY', password: '123' },
  { username: 'ppic', name: 'Staf PPIC', role: 'PPIC', password: '123' },
  { username: 'project', name: 'Staf Project', role: 'PROJECT', password: '123' },
  { username: 'manager', name: 'Bapak Manager', role: 'MANAGER', password: '123' },
];

const STORAGE_KEYS = {
  PRODUCTS: 'inv_products',
  PARTNERS: 'inv_partners',
  TRANSACTIONS: 'inv_transactions',
  OPNAMES: 'inv_opnames',
  SETTINGS: 'inv_settings',
  ORDERS: 'inv_orders',
  LOCATIONS: 'inv_locations',
  THEME: 'inv_theme',
  USER: 'inv_current_user',
  ALL_USERS: 'inv_all_users' // New key for user management
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [opnames, setOpnames] = useState<StockOpname[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Initialize Data
  useEffect(() => {
    try {
      const storedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      const storedPartners = localStorage.getItem(STORAGE_KEYS.PARTNERS);
      const storedTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      const storedOpnames = localStorage.getItem(STORAGE_KEYS.OPNAMES);
      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const storedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
      const storedLocations = localStorage.getItem(STORAGE_KEYS.LOCATIONS);
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      const storedAllUsers = localStorage.getItem(STORAGE_KEYS.ALL_USERS);
      
      // Theme Initialization
      const storedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setTheme('dark');
        document.documentElement.classList.add('dark');
      } else {
        setTheme('light');
        document.documentElement.classList.remove('dark');
      }

      if (storedProducts) setProducts(JSON.parse(storedProducts));
      if (storedPartners) setPartners(JSON.parse(storedPartners));
      if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
      if (storedOpnames) setOpnames(JSON.parse(storedOpnames));
      if (storedSettings) setSettings(JSON.parse(storedSettings));
      else setSettings(defaultSettings);
      if (storedOrders) setOrders(JSON.parse(storedOrders));
      if (storedLocations) setLocations(JSON.parse(storedLocations));
      if (storedUser) setCurrentUser(JSON.parse(storedUser));
      if (storedAllUsers) setUsers(JSON.parse(storedAllUsers));
    } catch (e) {
      console.error("Failed to load data from storage", e);
    }
  }, []);

  // Sync Theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  // Save to local storage whenever state changes
  useEffect(() => localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.PARTNERS, JSON.stringify(partners)), [partners]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.OPNAMES, JSON.stringify(opnames)), [opnames]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings)), [settings]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders)), [orders]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(locations)), [locations]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(users)), [users]);
  
  // Auth Logic
  const login = (username: string, pass: string): boolean => {
    // Check against the dynamic 'users' state instead of static MOCK_USERS
    const user = users.find(u => u.username === username && u.password === pass);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
  };

  // User Management
  const addUser = (user: User) => {
    setUsers(prev => [...prev, user]);
  };

  const updateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.username === updatedUser.username ? updatedUser : u));
    // Also update current session if the updated user is the logged in one
    if (currentUser && currentUser.username === updatedUser.username) {
        setCurrentUser(updatedUser);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    }
  };

  const deleteUser = (username: string) => {
    if (currentUser?.username === username) {
        alert("Tidak dapat menghapus akun yang sedang digunakan login!");
        return;
    }
    setUsers(prev => prev.filter(u => u.username !== username));
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const addProduct = (product: Product) => {
    setProducts(prev => [...prev, product]);
  };

  const updateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addPartner = (partner: Partner) => {
    setPartners(prev => [...prev, partner]);
  };

  const deletePartner = (id: string) => {
    setPartners(prev => prev.filter(p => p.id !== id));
  };

  const addLocation = (location: StorageLocation) => {
    setLocations(prev => [...prev, location]);
  };

  const deleteLocation = (id: string) => {
    setLocations(prev => prev.filter(l => l.id !== id));
  };

  const addTransaction = (transaction: Transaction) => {
    setTransactions(prev => [transaction, ...prev]);

    // Update stock levels
    const updatedProducts = [...products];
    transaction.items.forEach(item => {
      const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
      if (productIndex > -1) {
        if (transaction.type === 'IN') {
          updatedProducts[productIndex].currentStock += item.quantity;
        } else {
          updatedProducts[productIndex].currentStock -= item.quantity;
        }
      }
    });
    setProducts(updatedProducts);
  };

  const deleteTransaction = (id: string) => {
    const txToDelete = transactions.find(t => t.id === id);
    if (!txToDelete) return;

    // Reverse stock effect
    const updatedProducts = [...products];
    txToDelete.items.forEach(item => {
      const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
      if (productIndex > -1) {
        if (txToDelete.type === 'IN') {
          updatedProducts[productIndex].currentStock -= item.quantity;
        } else {
          updatedProducts[productIndex].currentStock += item.quantity;
        }
      }
    });

    setProducts(updatedProducts);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const updateTransaction = (updatedTx: Transaction) => {
    // 1. Revert the Old Transaction effect
    const oldTx = transactions.find(t => t.id === updatedTx.id);
    if (!oldTx) return;

    let updatedProducts = [...products];
    
    // Undo Old
    oldTx.items.forEach(item => {
      const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
      if (productIndex > -1) {
        if (oldTx.type === 'IN') {
          updatedProducts[productIndex].currentStock -= item.quantity;
        } else {
          updatedProducts[productIndex].currentStock += item.quantity;
        }
      }
    });

    // 2. Apply New Transaction effect
    updatedTx.items.forEach(item => {
      const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
      if (productIndex > -1) {
        if (updatedTx.type === 'IN') {
          updatedProducts[productIndex].currentStock += item.quantity;
        } else {
          updatedProducts[productIndex].currentStock -= item.quantity;
        }
      }
    });

    setProducts(updatedProducts);
    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));
  };

  const addOpname = (opname: StockOpname) => {
    setOpnames(prev => [opname, ...prev]);
    
    if (opname.status === 'COMPLETED') {
      const updatedProducts = [...products];
      opname.items.forEach(item => {
        const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
        if (productIndex > -1) {
          updatedProducts[productIndex].currentStock = item.physicalQty;
        }
      });
      setProducts(updatedProducts);
    }
  };

  // --- ORDER FUNCTIONS ---
  const addOrder = (order: Order) => {
    setOrders(prev => [order, ...prev]);
  };

  const updateOrder = (updatedOrder: Order) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };

  const deleteOrder = (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
  };

  const updateSettings = (newSettings: CompanySettings) => {
    setSettings(newSettings);
  };

  const resetData = () => {
    if(confirm("Apakah Anda yakin ingin menghapus SEMUA data?")) {
      setProducts([]);
      setPartners([]);
      setTransactions([]);
      setOpnames([]);
      setOrders([]);
      setLocations([]);
      setUsers(DEFAULT_USERS);
      localStorage.clear();
      window.location.reload();
    }
  }

  const getDashboardStats = () => {
    const totalProducts = products.length;
    const lowStock = products.filter(p => p.currentStock <= p.minStock).length;
    const totalValue = products.reduce((acc, p) => acc + (p.currentStock * p.price), 0);
    const transactionsIn = transactions.filter(t => t.type === 'IN').length;
    const transactionsOut = transactions.filter(t => t.type === 'OUT').length;

    return { totalProducts, lowStock, totalValue, transactionsIn, transactionsOut };
  };

  return (
    <InventoryContext.Provider value={{
      products,
      partners,
      transactions,
      opnames,
      orders,
      locations,
      settings,
      theme,
      currentUser,
      users,
      toggleTheme,
      login,
      logout,
      addUser,
      updateUser,
      deleteUser,
      addProduct,
      updateProduct,
      deleteProduct,
      addPartner,
      deletePartner,
      addLocation,
      deleteLocation,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addOpname,
      addOrder,
      updateOrder,
      deleteOrder,
      updateSettings,
      getDashboardStats,
      resetData
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
