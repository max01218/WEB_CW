'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Form, Input, Button, DatePicker, message, Typography, Divider } from 'antd';
import { ArrowLeftOutlined, GoogleOutlined } from '@ant-design/icons';
import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import dayjs from 'dayjs';

const { Title } = Typography;

const RegisterPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const containerStyle = {
    maxWidth: '400px',
    margin: '0 auto',
    padding: '24px',
    position: 'relative' as const,
  };

  const cardStyle = {
    padding: '24px',
    borderRadius: '15px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    background: 'white',
  };

  const titleStyle = {
    textAlign: 'center' as const,
    marginBottom: '24px',
  };

  const backButtonStyle = {
    marginBottom: '24px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  };

  const socialButtonStyle = {
    width: '100%',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '16px',
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
          address: '',
          appointmentStatus: false,
          role: 'member',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          uid: result.user.uid,
          emailVerified: true, // Google 登录的用户邮箱已验证
        };

        await setDoc(userRef, userData);
        message.success('Account created successfully!');
        message.warning('Your appointment request is pending approval. Please wait for admin approval.');
        router.push('/home');
        return;
      } else {
        const userData = userSnap.data();
        if (!userData.appointmentStatus) {
          message.warning('Your appointment request is still pending approval. Please wait for admin approval.');
          router.push('/home');
          return;
        }
        message.success('Welcome back!');
        router.push('/member/dashboard');
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

  const handleRegister = async (values: any) => {
    setLoading(true);
    try {
      // 创建 Firebase Auth 用户
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );

      // 发送验证邮件
      await sendEmailVerification(userCredential.user);
      message.info('Verification email sent. Please check your inbox.');

      // 准备用户数据
      const userData = {
        email: values.email,
        name: values.name,
        birthdate: dayjs(values.birthdate).format('YYYY-MM-DD'),
        address: values.address || '',
        appointmentStatus: false,
        role: 'member',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        uid: userCredential.user.uid,
        emailVerified: false,
      };

      // 存储用户数据到 Firestore
      await setDoc(doc(db, 'members', userCredential.user.uid), userData);

      message.success('Registration successful! Please verify your email.');
      router.push('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      message.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <Link href="/" style={backButtonStyle}>
        <ArrowLeftOutlined /> Back to Home
      </Link>

      <div style={cardStyle}>
        <Title level={2} style={titleStyle}>Register</Title>

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

        <Form
          layout="vertical"
          onFinish={handleRegister}
          disabled={loading}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Please input your name!' }]}
          >
            <Input placeholder="Enter your name" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input placeholder="Enter your email" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 6, message: 'Password must be at least 6 characters!' }
            ]}
          >
            <Input.Password placeholder="Enter your password" />
          </Form.Item>

          <Form.Item
            label="Birth Date"
            name="birthdate"
            rules={[{ required: true, message: 'Please select your birth date!' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Address"
            name="address"
            rules={[{ required: true, message: 'Please enter your address!' }]}
          >
            <Input.TextArea 
              placeholder="Enter your address" 
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              style={{ width: '100%' }}
            >
              Register
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#1890ff' }}>
              Login now
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default RegisterPage;
