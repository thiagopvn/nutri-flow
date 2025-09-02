import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  name: string;
  email: string;
  crn?: string;
  logoUrl?: string;
  whatsappNumber?: string;
  subscription?: {
    type: 'free' | 'premium' | 'enterprise';
    status: 'active' | 'inactive' | 'canceled';
  };
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Patient {
  id?: string;
  name: string;
  email: string;
  phone: string;
  birthDate: Date | Timestamp;
  gender?: 'male' | 'female' | 'other';
  cpf?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  anthropometricData?: AnthropometricData[];
  anamnesis?: Anamnesis;
}

export interface AnthropometricData {
  date: Date | Timestamp;
  weight?: number; // kg
  height?: number; // cm
  imc?: number;
  bodyFat?: number; // percentage
  muscleMass?: number; // kg
  visceralFat?: number;
  waistCircumference?: number; // cm
  hipCircumference?: number; // cm
  armCircumference?: number; // cm
  thighCircumference?: number; // cm
  notes?: string;
}

export interface Anamnesis {
  mainComplaint?: string;
  medicalHistory?: string;
  familyHistory?: string;
  medications?: string[];
  allergies?: string[];
  lifestyle?: {
    physicalActivity?: string;
    sleepQuality?: string;
    stressLevel?: string;
    smoking?: boolean;
    alcohol?: string;
  };
  eatingHabits?: {
    mealsPerDay?: number;
    waterIntake?: string;
    foodPreferences?: string[];
    foodRestrictions?: string[];
    supplementation?: string[];
  };
  objectives?: string[];
  observations?: string;
}

export interface Appointment {
  id?: string;
  nutritionistId: string;
  patientId: string;
  patientName: string;
  date: Date | Timestamp;
  duration: number; // minutes
  type: 'online' | 'presencial';
  status: 'scheduled' | 'completed' | 'canceled' | 'no-show';
  teleconsultationLink?: string;
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface DietPlan {
  id?: string;
  title: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  startDate?: Date | Timestamp;
  endDate?: Date | Timestamp;
  objective?: string;
  totalCalories?: number;
  macros?: {
    protein: number; // grams
    carbs: number; // grams
    fat: number; // grams
    fiber: number; // grams
  };
  meals: Meal[];
  observations?: string;
  recommendations?: string[];
}

export interface Meal {
  name: string;
  time: string;
  calories?: number;
  items: FoodItem[];
}

export interface FoodItem {
  food: string;
  quantity: string;
  unit?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  notes?: string;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: {
    text: string;
    timestamp: Timestamp;
    senderId: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Message {
  id?: string;
  senderId: string;
  text?: string;
  imageUrl?: string;
  timestamp: Timestamp;
  read?: boolean;
}

export interface FinancialRecord {
  id?: string;
  description: string;
  value: number;
  date: Date | Timestamp;
  type: 'income' | 'expense';
  category?: string;
  patientId?: string;
  patientName?: string;
  paymentMethod?: 'cash' | 'pix' | 'credit_card' | 'debit_card' | 'bank_transfer';
  status?: 'pending' | 'paid' | 'canceled';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}