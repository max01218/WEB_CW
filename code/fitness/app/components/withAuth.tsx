'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { message } from 'antd';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface WithAuthProps {
  requiredRole?: string;
}

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  { requiredRole }: WithAuthProps = {}
) {
  return function WithAuthComponent(props: P) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
      const checkAuth = async () => {
        try {
          const user = auth.currentUser;
          if (!user) {
            message.error('Please login');
            router.push('/login');
            return;
          }

          // Get user role
          const userDoc = await getDoc(doc(db, 'members', user.uid));
          const userData = userDoc.data();

          if (!userData) {
            message.error('User information not found');
            router.push('/home');
            return;
          }

          // If specific role is required
          if (requiredRole && userData.role !== requiredRole) {
            console.log(`Required role: ${requiredRole}, but user role is ${userData.role}`);
            
            // If user is trainer but doesn't have trainerId, might need to check trainer collection
            if (requiredRole === 'trainer' && userData.role !== 'trainer') {
              const trainerDoc = await getDoc(doc(db, 'trainer', user.uid));
              if (trainerDoc.exists()) {
                setIsAuthorized(true);
                return;
              }
              
              // Try to query trainer collection to find matching email
              const trainersQuery = query(
                collection(db, 'trainer'),
                where('email', '==', user.email)
              );
              const trainerSnapshot = await getDocs(trainersQuery);
              if (!trainerSnapshot.empty) {
                setIsAuthorized(true);
                return;
              }
            }
            
            message.error('No permission');
            router.push('/home');
            return;
          }

          setIsAuthorized(true);
        } catch (error) {
          console.error('Permission check error:', error);
          message.error('Error');
          router.push('/home');
        } finally {
          setLoading(false);
        }
      };

      checkAuth();
    }, [router, requiredRole]);

    if (loading) {
      return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
    }

    if (!isAuthorized) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
} 