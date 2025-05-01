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
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface MemberData {
  memberId: string;
  email: string;
  name: string;
  role: 'member' | 'trainer' | 'admin';
  status: 'active' | 'inactive';
  birthday?: Date | null;
  address?: string;
  trainerId?: string;
  createdAt: any;
  updatedAt: any;
}

interface AuthContextType {
  user: User | null;
  memberData: MemberData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);

  // 獲取會員資料的函數
  const fetchMemberData = async (userId: string, userEmail: string | null) => {
    if (!userId || !userEmail) {
      console.log('Missing userId or userEmail:', { userId, userEmail });
      return null;
    }

    try {
      // 1. 嘗試獲取現有會員資料
      const memberDoc = await getDoc(doc(db, 'members', userId));
      
      if (memberDoc.exists()) {
        const data = memberDoc.data() as MemberData;
        console.log('Found existing member data:', data);
        setMemberData(data);
        return data;
      }
      
      // 2. 如果會員資料不存在，創建新的會員資料
      console.log('Creating new member data for:', userEmail);
      const newMemberData: MemberData = {
        memberId: userId,
        email: userEmail,
        name: '未命名會員',
        role: 'member',
        status: 'active',
        birthday: null,
        address: '',
        trainerId: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // 3. 寫入新會員資料
      await setDoc(doc(db, 'members', userId), newMemberData);
      console.log('Successfully created new member data');
      
      // 4. 設置狀態
      setMemberData(newMemberData);
      return newMemberData;
    } catch (error) {
      console.error('Error in fetchMemberData:', error);
      return null;
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
        const memberData = await fetchMemberData(user.uid, user.email);
        if (!memberData) {
          console.error('Failed to fetch or create member data');
        }
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

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('User signed in:', userCredential.user.email);
      
      const memberData = await fetchMemberData(userCredential.user.uid, userCredential.user.email);
      if (!memberData) {
        throw new Error('無法獲取會員資料');
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || '登入失敗');
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const memberData: MemberData = {
        memberId: user.uid,
        email: email,
        name: name,
        role: 'member',
        status: 'active',
        birthday: null,
        address: '',
        trainerId: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'members', user.uid), memberData);
      console.log('Successfully created member data for:', email);
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.message || '註冊失敗');
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

// 自定義Hook用於確保用戶已登入
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