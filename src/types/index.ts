// Core Types for API Integration

export interface BikePosition {
  id: string;
  imei: string;
  name: string;
  lat: number;
  lon: number;
  status: 'available' | 'in-use' | 'maintenance' | 'low-battery';
  battery: number;
  gpsSignal: number;
  gsmSignal: number;
  speed: number;
  lastUpdate: string;
  zone: string;
  model?: string;
  brand?: string;
  purchaseDate?: string;
  lastMaintenance?: string;
  totalDistance?: number;
  totalTrips?: number;
  isActive?: boolean;
  equipment?: string[]; // Équipements du vélo (phares, panier, etc.)
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  accountBalance: number;
  totalTrips: number;
  totalSpent: number;
  isActive: boolean;
  status: 'active' | 'blocked';
  joinDate: string;
  reliabilityScore: number;
  address?: string;
  city?: string;
  idCardNumber?: string;
  createdAt: Date;
}

export interface Trip {
  id: string;
  userId: string;
  userName: string;
  bikeId: string;
  bikeName: string;
  startTime: string;
  endTime: string | null;
  distance: number;
  duration: number;
  cost: number;
  status: 'active' | 'completed' | 'cancelled';
  startLocation?: { lat: number; lon: number };
  endLocation?: { lat: number; lon: number };
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: 'recharge' | 'payment' | 'refund';
  amount: number;
  method: 'orange-money' | 'mobile-money' | 'cash';
  status: 'pending' | 'completed' | 'failed';
  reference: string;
  date: string;
  description?: string;
}

export interface Incident {
  id: string;
  userId: string;
  userName: string;
  bikeId: string;
  bikeName: string;
  type: 'technical' | 'accident' | 'damaged' | 'payment' | 'theft';
  description: string;
  status: 'pending' | 'in-progress' | 'resolved' | 'rejected';
  createdAt: string;
  refundAmount: number | null;
  photos: string[];
  adminNote?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  hourlyRate: number;
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  discount: number;
  isActive: boolean;
  conditions: string[];
  description?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  permissions: string[];
  status: 'active' | 'blocked';
  joinDate: string;
  hireDate?: string;
  lastLogin?: string;
  avatar?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  employeeCount: number;
  createdAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'bikes' | 'users' | 'financial' | 'incidents' | 'employees' | 'settings';
}

export interface ActivityLog {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  action: string;
  description: string;
  category: string;
  timestamp: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

export interface CompanySettings {
  id: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  orangeMoneyNumber: string;
  mobileMoneyNumber: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  website?: string;
  logo?: string;
  description?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type DateFilter = '7days' | '30days' | '90days' | 'all' | 'custom';

export interface DateRange {
  start: string;
  end: string;
}
