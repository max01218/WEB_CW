// src/pages/Login.tsx
'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { message, Button, Divider } from 'antd';
import { ArrowLeftOutlined, GoogleOutlined } from '@ant-design/icons';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
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
import { collection, query, where, getDocs, limit, setDoc } from 'firebase/firestore';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  const socialButtonStyle = {
    width: '100%',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '16px',
  };

  const getUserRole = async (email: string): Promise<string> => {
    try {
      // 使用 email 字段查询 members 集合
      const membersQuery = query(
        collection(db, 'members'),
        where('email', '==', email),
        limit(1)
      );
      
      const querySnapshot = await getDocs(membersQuery);
      
      if (!querySnapshot.empty) {
        const memberDoc = querySnapshot.docs[0];
        const userData = memberDoc.data();
        
        if (!userData.role) {
          return 'member';
        }
        
        // 不转换为小写，保持原始角色值
        const role = userData.role;
        
        // 更新有效角色列表，移除 supervisor，添加 admin
        const validRoles = ['trainer', 'member', 'admin'];
        if (!validRoles.includes(role)) {
          return 'member';
        }
        
        return role;
      }
      
      return 'member';
    } catch (error) {
      return 'member';
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      
      if (!result.user) {
        throw new Error('No user data returned');
      }

      // 检查用户是否已存在
      const userRef = doc(db, 'members', result.user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // 创建新用户数据
        const userData = {
          email: result.user.email,
          name: result.user.displayName || 'User',
          birthdate: null,
          appointmentStatus: false,
          role: 'member',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          uid: result.user.uid,
          emailVerified: true,
        };

        await setDoc(userRef, userData);
        message.success('Account created successfully!');
        router.push('/member/dashboard');
      } else {
        const userData = userSnap.data();
        const role = userData.role || 'member';
        message.success('Login successful!');
        
        switch (role) {
          case 'admin':
            router.push('/admin/dashboard');
            break;
          case 'trainer':
            router.push('/trainer');
            break;
          default:
            router.push('/member/dashboard');
        }
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
      if (error.code === 'auth/operation-not-allowed') {
        message.error('Google sign in is not enabled. Please contact administrator.');
      } else if (error.code === 'auth/popup-blocked') {
        message.error('Popup was blocked by your browser. Please allow popups for this site.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        message.info('Sign in was cancelled');
      } else {
        message.error('Failed to sign in with Google. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // 检查邮箱是否已验证
      if (!userCredential.user.emailVerified) {
        message.error('Please verify your email before logging in. Check your inbox for the verification link.');
        router.push('/home');
        return;
      }
      
      const userRole = await getUserRole(email);
      message.success('Login successful!');
      
      switch (userRole) {
        case 'admin':
          router.push('/admin/dashboard');
          break;
        case 'trainer':
          router.push('/trainer');
          break;
        default:
          router.push('/member/dashboard');
      }
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential') {
        message.error('Invalid email or password.');
      } else {
        message.error('Login failed. Please try again.');
      }
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

        <Button 
          type="default" 
          icon={<GoogleOutlined />}
          onClick={handleGoogleSignIn}
          style={socialButtonStyle}
          loading={googleLoading}
          disabled={loading}
        >
          Continue with Google
        </Button>

        <Divider>or</Divider>

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
            disabled={loading || googleLoading}
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
