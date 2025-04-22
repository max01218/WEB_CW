// src/pages/Login.tsx
'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  containerStyle,
  cardStyle,
  titleStyle,
  formStyle,
  inputStyle,
  primaryButtonStyle,
  linkContainerStyle,
  linkStyle,
  backButtonStyle,
} from './styles';
import './styles.css';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const getUserRole = async (email: string): Promise<string> => {
    try {
      console.log('Fetching role for email:', email);
      
      // 使用 email 字段查询 members 集合
      const membersQuery = query(
        collection(db, 'members'),
        where('email', '==', email),
        limit(1)
      );
      
      console.log('Executing query for email:', email);
      const querySnapshot = await getDocs(membersQuery);
      
      if (!querySnapshot.empty) {
        const memberDoc = querySnapshot.docs[0];
        const userData = memberDoc.data();
        console.log('Raw user data from database:', userData);
        console.log('Document ID:', memberDoc.id);
        console.log('Role value:', userData.role);
        
        if (!userData.role) {
          console.log('Role is undefined or null');
          return 'member';
        }
        
        // 不转换为小写，保持原始角色值
        const role = userData.role;
        console.log('User role:', role);
        
        // 更新有效角色列表，移除 supervisor，添加 admin
        const validRoles = ['trainer', 'member', 'admin'];
        if (!validRoles.includes(role)) {
          console.log('Invalid role found:', role);
          return 'member';
        }
        
        return role;
      }
      
      console.log('No user document found for email:', email);
      return 'member';
    } catch (error) {
      console.error('Error fetching user role:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return 'member';
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('Attempting login for email:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase authentication successful');
      
      const userRole = await getUserRole(email);
      console.log('Final user role:', userRole);
      message.success('Login successful!');
      
      switch (userRole) {
        case 'admin':
          console.log('Redirecting to admin dashboard');
          router.push('/admin/dashboard');
          break;
        case 'trainer':
          console.log('Redirecting to trainer dashboard');
          router.push('/trainer');
          break;
        default:
          console.log('Redirecting to member dashboard');
          router.push('/member/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      message.error('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <Link href="/" style={backButtonStyle} className="login-button-secondary">
        <ArrowLeftOutlined /> Back
      </Link>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Welcome Back</h1>
        <form style={formStyle} onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            className="login-input"
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            className="login-input"
            required
            disabled={loading}
          />
          <button 
            type="submit" 
            style={primaryButtonStyle} 
            className="login-button-primary"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div style={linkContainerStyle}>
          Don't have an account?
          <Link href="/register" style={linkStyle} className="login-link">
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
