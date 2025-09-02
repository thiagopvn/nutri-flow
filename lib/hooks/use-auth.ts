import { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { User } from '@/lib/types';

export function useAuth() {
  const { user, firebaseUser, loading, setUser, initialize } = useAuthStore();

  useEffect(() => {
    const unsubscribe = initialize();
    return () => unsubscribe?.();
  }, [initialize]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ uid: firebaseUser.uid, ...userDoc.data() } as User);
        }
      } else {
        setUser(null);
      }
    };

    fetchUserData();
  }, [firebaseUser, setUser]);

  return { user, firebaseUser, loading };
}