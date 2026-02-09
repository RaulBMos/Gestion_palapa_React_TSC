import { type ReactNode } from 'react';

export enum PaymentMethod {
  CASH = 'Efectivo',
  TRANSFER = 'Transferencia',
}

export enum TransactionType {
  INCOME = 'Ingreso',
  EXPENSE = 'Gasto',
}

export enum ReservationStatus {
  INFORMATION = 'Información', // Changed from PENDING
  CONFIRMED = 'Confirmada',
  COMPLETED = 'Completada',
  CANCELLED = 'Cancelada',
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
}

export interface Reservation {
  id: string;
  clientId: string;
  cabinCount: number; // Changed from specific ID to quantity
  startDate: string; // ISO Date string
  endDate: string; // ISO Date string
  adults: number; // Adults and Children > 5
  children: number; // Children < 5
  totalAmount: number;
  status: ReservationStatus;
  isArchived?: boolean; // New flag to move Information items to history without cancelling
}

export interface Transaction {
  id: string;
  date: string; // ISO Date string
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  paymentMethod: PaymentMethod;
  reservationId?: string; // Optional link to a reservation
}

export type ViewState = 'dashboard' | 'reservations' | 'finances' | 'clients';

// Dashboard types
export interface MonthlyData {
  name: string;
  ingresos: number;
  gastos: number;
}

export interface ExpenseCategory {
  name: string;
  value: number;
}

// Hook interfaces para romper dependencias circulares
export interface DashboardLogicState {
  aiAnalysis: string | null;
  loadingAi: boolean;
  aiError: string | null;
  retryAttempt: number;
  isAnalysisDisabled: boolean;
  countdownSeconds: number;
  showFallback: boolean;
  failureCount: number;
  isSystemDegraded: boolean;
}

export interface DashboardLogicData {
  financialBalance: {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
  };
  kpiData: {
    occupancyRate: string;
    adr: string;
    avgStayDuration: string;
    revPar: string;
  };
  dataByMonth: MonthlyData[];
  expenseCategories: ExpenseCategory[];
}

export interface DashboardLogicActions {
  handleAiAnalysis: () => Promise<void>;
  handleCancelAiAnalysis: () => void;
  clearAiError: () => void;
  handleManualInput: (manualText: string) => Promise<void>;
  handleRetryAnalysis: () => void;
}

export interface CalendarState {
  currentMonth: Date;
  selectedDate: string | null;
  pickerMonth: Date;
}

export interface ReservationFormState {
  editingId: string | null;
  showForm: boolean;
  newRes: Partial<Reservation>;
  filter: string;
  viewMode: 'list' | 'calendar';
  listTab: 'active' | 'history';
}

export interface ReservationCalendarHelpers {
  getDateString: (date: Date) => string;
  formatDateForDisplay: (dateStr: string | undefined) => string;
  getDaysInMonth: (date: Date) => (Date | null)[];
  getOccupancy: (dateStr: string, excludeReservationId?: string) => {
    occupiedCount: number;
    activeReservations: Reservation[];
  };
  getClientName: (id: string, clients: Client[]) => string;
  statusColor: (status: ReservationStatus) => string;
}

export interface FinancialData {
  ingresos: number;
  gastos: number;
  netProfit: number;
  profitMargin: number;
}

// Calendar types
export interface OccupancyData {
  occupiedCount: number;
  activeReservations: Reservation[];
}

export interface CalendarDayInfo {
  date: Date;
  dateStr: string;
  occupiedCount: number;
  availableCount: number;
  activeReservations: Reservation[];
  isSelected: boolean;
  isInRange: boolean;
  isStart: boolean;
  isEnd: boolean;
  bgColor: string;
  textColor: string;
  borderColor: string;
  isFullyOccupied: boolean;
  isPartiallyOccupied: boolean;
}

export interface CalendarNewReservation {
  id: string;
  clientId: string;
  cabinCount: number;
  startDate: string;
  endDate: string;
  status?: ReservationStatus;
  category?: string;
  notes?: string;
}

// API types
export interface GeminiAnalysisRequest {
  transactions: Transaction[];
  reservations: Reservation[];
  totalCabins: number;
}

export interface GeminiAnalysisResponse {
  analysis: string;
  confidence: number;
  suggestions: string[];
}

export interface GeminiErrorResponse {
  error: string;
  code: string;
  retryAfter?: number;
}

export interface NewReservation {
  id?: string;
  clientId?: string;
  cabinCount?: number;
  startDate?: string;
  endDate?: string;
  status?: ReservationStatus;
  totalAmount?: number;
  adults?: number;
  children?: number;
  isArchived?: boolean;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  retryAfter?: number;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number | null;
}

// Form types
export interface FormFieldError {
  field: string;
  message: string;
  code?: string;
}

export interface FormState<T> {
  data: T;
  errors: FormFieldError[];
  isSubmitting: boolean;
  isValid: boolean;
}

// Component props types
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
  testId?: string;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export interface InputProps extends BaseComponentProps {
  type?: string;
  placeholder?: string;
  value?: string | number;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
}

// Hook return types
export interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: () => Promise<void>;
  reset: () => void;
}

// Data context types
export interface DataState {
  clients: Client[];
  reservations: Reservation[];
  transactions: Transaction[];
  totalCabins: number;
  loading: boolean;
  error: string | null;
}

export interface DataActions {
  addClient: (client: Omit<Client, 'id'>) => void;
  updateClient: (updatedClient: Client) => void;
  deleteClient: (id: string) => void;
  addReservation: (reservation: Omit<Reservation, 'id'>) => void;
  updateReservation: (updatedReservation: Reservation) => void;
  deleteReservation: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (updatedTransaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  refreshData: () => Promise<void>;
  clearError: () => void;
  updateReservationStatus: (id: string, status: ReservationStatus) => void;
  archiveReservation: (id: string) => void;
}

export type DataContextType = DataState & DataActions;

// Storage types
export interface StorageData {
  clients: Client[];
  reservations: Reservation[];
  transactions: Transaction[];
}

export interface StorageConfig {
  key: string;
  version: number;
  encrypt: boolean;
}

export * from './ai.schema';
