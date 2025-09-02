import { create } from 'zustand';
import { User } from '@/lib/types';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  firebaseUser: null,
  loading: true,
  setUser: (user) => set({ user }),
  setFirebaseUser: (user) => set({ firebaseUser: user }),
  setLoading: (loading) => set({ loading }),
  initialize: () => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      set({ firebaseUser, loading: false });
    });
    return unsubscribe;
  },
}));