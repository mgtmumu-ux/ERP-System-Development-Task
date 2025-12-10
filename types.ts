
export type TransactionType = 'IN' | 'OUT';

export interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  currency: string;
}

export interface Partner {
  id: string;
  name: string;
  type: 'SUPPLIER' | 'CUSTOMER';
  contact: string;
  address: string;
  email: string;
}

// New Interface for Warehouse/Storage Locations
export interface StorageLocation {
  id: string;
  name: string; // e.g., "Gudang Utama - Rak A", "Gudang AB", "Area Z"
  description?: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string; // e.g., Pcs, Kg, Box
  minStock: number;
  price: number; // Selling price (or Buying price for reference)
  currentStock: number;
  locationId?: string; // Link to StorageLocation ID
}

export interface TransactionItem {
  productId: string;
  quantity: number;
  pricePerUnit: number;
  productName?: string; // Cache for display
  productCode?: string;
  unit?: string; // Added field for unit of measurement
}

export interface Transaction {
  id: string;
  type: TransactionType;
  date: string; // ISO Date string
  partnerId: string; // Customer or Supplier ID
  referenceNo: string; // Invoice / PO Number
  notes: string;
  items: TransactionItem[];
  totalValue: number;
  createdAt: number;
}

export interface StockOpname {
  id: string;
  date: string;
  notes: string;
  items: {
    productId: string;
    productName: string;
    systemQty: number;
    physicalQty: number;
    difference: number;
  }[];
  status: 'DRAFT' | 'COMPLETED';
}

// --- ORDER TYPES ---

export type OrderStatus = 'DRAFT' | 'OPEN' | 'PARTIALLY_FULFILLED' | 'COMPLETED' | 'CANCELLED';
export type OrderType = 'PO' | 'SO'; // Purchase Order | Sales Order

export interface Order {
  id: string;
  orderNumber: string; // Auto-generated or manual
  type: OrderType;
  partnerId: string;
  date: string;
  expectedDate?: string;
  status: OrderStatus;
  items: TransactionItem[];
  totalValue: number;
  notes: string;
  relatedTransactionId?: string; // Link to the inventory movement once completed
  createdAt: number;
}

// --- AUTH TYPES ---
export type Role = 'ADMIN' | 'INVENTORY' | 'PPIC' | 'PROJECT' | 'MANAGER';

export interface User {
  username: string;
  name: string;
  role: Role;
  password?: string; // Only for verification mock
}

export interface InventoryContextType {
  products: Product[];
  partners: Partner[];
  transactions: Transaction[];
  opnames: StockOpname[];
  orders: Order[];
  locations: StorageLocation[]; 
  settings: CompanySettings;
  theme: 'light' | 'dark';
  currentUser: User | null;
  users: User[]; // List of all users
  toggleTheme: () => void;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  
  // User Management
  addUser: (u: User) => void;
  updateUser: (u: User) => void;
  deleteUser: (username: string) => void;

  addProduct: (p: Product) => void;
  updateProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  addPartner: (p: Partner) => void;
  deletePartner: (id: string) => void;
  addTransaction: (t: Transaction) => void;
  updateTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addOpname: (o: StockOpname) => void;
  addOrder: (o: Order) => void;
  updateOrder: (o: Order) => void;
  deleteOrder: (id: string) => void;
  addLocation: (l: StorageLocation) => void;
  deleteLocation: (id: string) => void;
  updateSettings: (s: CompanySettings) => void;
  getDashboardStats: () => any;
  resetData: () => void;
}
