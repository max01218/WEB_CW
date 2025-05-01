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
            console.log(`需要角色 ${requiredRole}，但用户角色是 ${userData.role}`);
            
            // 如果用户是trainer但没有trainerId，可能需要额外检查trainer集合
            if (requiredRole === 'trainer' && userData.role !== 'trainer') {
              const trainerDoc = await getDoc(doc(db, 'trainer', user.uid));
              if (trainerDoc.exists()) {
                setIsAuthorized(true);
                return;
              }
              
              // 尝试查询trainer集合以查找匹配的email
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
            
            message.error('NO permission');
            router.push('/home');
            return;
          }

          setIsAuthorized(true);
        } catch (error) {
          console.error('权限检查错误:', error);
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