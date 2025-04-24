'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { message } from 'antd';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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

          // 获取用户角色
          const userDoc = await getDoc(doc(db, 'members', user.uid));
          const userData = userDoc.data();

          if (!userData) {
            message.error('用户信息不存在');
            router.push('/home');
            return;
          }

          // 如果需要特定角色
          if (requiredRole && userData.role !== requiredRole) {
            message.error('NO permission');
            router.push('/home');
            return;
          }

          setIsAuthorized(true);
        } catch (error) {
          message.error('error');
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