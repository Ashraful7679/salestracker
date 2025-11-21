
export type UserRole = 'admin' | 'manager';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  password?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
}

export type ItemType = 'product' | 'service';

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  type: 'product';
  category: string;
  buyingPrice: number;
  sellingPrice: number;
  stock: number;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  type: 'service';
  category: string;
}

export type CatalogItem = Product | Service;

export interface CartItem {
  itemId: string;
  name: string;
  type: ItemType;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  timestamp: number;
  customerName: string;
  customerPhone?: string;
  vehicleModel?: string;
  mechanicName?: string;
  items: CartItem[];
  productTotal: number;
  serviceTotal: number;
  productDiscount: number;
  serviceDiscount: number;
  totalAmount: number;
  totalProfit: number;
  createdBy: string;
  createdByName: string;
}

export type CashFlowType = 'expense' | 'withdrawal';

export interface CashFlowEntry {
  id: string;
  type: CashFlowType;
  category?: string; // Only for expenses
  amount: number;
  description: string;
  timestamp: number;
  createdBy: string;
  createdByName: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalProfit: number;
  totalTransactions: number;
  lowStockCount: number;
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  position: string;
  salaryPerMonth: number;
  totalDueSalary: number;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: number; // timestamp for the day (midnight)
  status: 'present' | 'absent';
  type?: 'full' | 'half'; // Only if present
  wage: number; // Calculated amount for this day
}
