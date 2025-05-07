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
      // Query members collection using email field
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
        
        // Keep original role value without converting to lowercase
        const role = userData.role;
        
        // Update valid roles list, remove supervisor, add admin
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
      // Check if user exists
      const userRef = doc(db, 'members', result.user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        // Create new user data
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
        message.warning('Your appointment request is pending approval. Please wait for admin approval.');
        router.push('/home');
        return;
      } else {
        const userData = userSnap.data();
        const role = userData.role || 'member';
        if (role !== 'admin' && !userData.appointmentStatus) {
          message.warning('Your appointment request is still pending approval. Please wait for admin approval.');
          router.push('/home');
          return;
        }
        message.success('Login successful!');
        switch (role) {
          case 'admin':
            router.push('/admin/dashboard');
            break;
          case 'trainer':
            router.push('/trainer');
            break;
          default:
            try {
              const requestsQuery = query(
                collection(db, 'requests'),
                where('memberName', '==', result.user.email),
                limit(1)
              );
              const requestsSnapshot = await getDocs(requestsQuery);
          
              if (!requestsSnapshot.empty) {
                const requestDoc = requestsSnapshot.docs[0];
                const requestData = requestDoc.data();
                const status = requestData.status;
          
                if (status === 'rejected') {
                  message.success('You have been rejected. Please choose again.');
                  router.push('/trainer_search');
                } else if (status === 'accepted') {
                  message.success('Please check the course.');
                  router.push('/member/dashboard');
                } else {
                  message.success('The request is still under review.');
                  router.push('/trainer_search');
                }
              } else {
                // No request record
                message.success('Please choose your personal trainer.');
                router.push('/trainer_search');
              }
            } catch (error) {
              console.error('Error checking request status:', error);
              message.error('Failed to check request status. Please try again.');
              router.push('/trainer_search');
            }
            break;
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
      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        message.error('Please verify your email before logging in. Check your inbox for the verification link.');
        router.push('/home');
        return;
      }
      // Get user data
      const userRef = doc(db, 'members', userCredential.user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const role = userData.role || 'member';
        if (role !== 'admin' && !userData.appointmentStatus) {
          message.warning('Your appointment request is still pending approval. Please wait for admin approval.');
          router.push('/home');
          return;
        }
        message.success('Login successful!');
        switch (role) {
          case 'admin':
            router.push('/admin/dashboard');
            break;
          case 'trainer':
            router.push('/trainer');
            break;
          default:
            try {
              const requestsQuery = query(
                collection(db, 'requests'),
                where('memberName', '==', email),
                limit(1)
              );
              const requestsSnapshot = await getDocs(requestsQuery);
          
              if (!requestsSnapshot.empty) {
                const requestDoc = requestsSnapshot.docs[0];
                const requestData = requestDoc.data();
                const status = requestData.status;
          
                if (status === 'rejected') {
                  message.success('You have been rejected. Please choose again.');
                  router.push('/trainer_search');
                } else if (status === 'accepted') {
                  message.success('Please check the course.');
                  router.push('/member/dashboard');
                } else {
                  message.success('The request is still under review.');
                  router.push('/trainer_search');
                }
              } else {
                // No request record
                message.success('Please choose your personal trainer.');
                router.push('/trainer_search');
              }
            } catch (error) {
              console.error('Error checking request status:', error);
              message.error('Failed to check request status. Please try again.');
              router.push('/trainer_search');
            }
            break;
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
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
