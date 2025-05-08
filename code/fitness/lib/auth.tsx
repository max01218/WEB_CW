'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface MemberData {
  memberId: string;
  email: string | null;
  name: string;
  role: string;
  status: string;
  birthdate: string | null;
  address: string;
  trainerId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface AuthContextType {
  user: User | null;
  memberData: MemberData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, birthdate: string, address: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to get member data
  const getMemberData = async (user: User): Promise<any> => {
    try {
      const memberDoc = await getDoc(doc(db, 'members', user.uid));
      if (memberDoc.exists()) {
        return memberDoc.data();
      }
      const newMemberData = {
        memberId: user.uid,
        uid: user.uid,
        email: user.email,
        name: 'Unnamed Member',
        role: 'member',
        status: 'active',
        birthdate: '',
        address: '',
        trainerId: '',
        appointmentStatus: false,
        emailVerified: user.emailVerified || false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      await setDoc(doc(db, 'members', user.uid), newMemberData);
      return newMemberData;
    } catch (error) {
      console.error('Error getting member data:', error);
      throw new Error('Unable to get member data');
    }
  };

  useEffect(() => {
    console.log('Setting up auth state listener');
    setLoading(true);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', { 
        userId: user?.uid,
        email: user?.email,
        isAuthenticated: !!user 
      });
      
      setUser(user);
      
      if (user) {
        const memberData = await getMemberData(user);
        if (!memberData) {
          console.error('Failed to fetch or create member data');
        }
        setMemberData(memberData);
      } else {
        setMemberData(null);
      }
      
      setLoading(false);
    });

    return () => {
      console.log('Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const memberData = await getMemberData(user);
      setUser(user);
      setMemberData(memberData);
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Sign in failed');
    }
  };

  const signUp = async (email: string, password: string, name: string, birthdate: string, address: string): Promise<void> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const newMemberData = {
        memberId: user.uid,
        uid: user.uid,
        email: user.email,
        name,
        role: 'member',
        status: 'active',
        birthdate,
        address,
        trainerId: '',
        appointmentStatus: false,
        emailVerified: user.emailVerified || false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      await setDoc(doc(db, 'members', user.uid), newMemberData);
      setUser(user);
      setMemberData(newMemberData);
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.message || 'Sign up failed');
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setMemberData(null);
      console.log('Successfully signed out');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, memberData, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// Custom hook to ensure user is logged in
export const useRequireAuth = () => {
  const { user, memberData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  return { user, memberData, loading };
};

export function useTrainerData(email: string | null) {
  const [trainerData, setTrainerData] = useState<any>(null);

  useEffect(() => {
    if (!email) return;
    const fetchTrainer = async () => {
      const q = query(collection(db, 'trainer'), where('email', '==', email));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setTrainerData(snapshot.docs[0].data());
      }
    };
    fetchTrainer();
  }, [email]);

  return trainerData;
} 