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
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
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

  const googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user already exists
      const userDoc = await getDoc(doc(db, 'members', user.uid));

      if (!userDoc.exists()) {
        // Create new user data
        const newUserData = {
          memberId: user.uid,
          email: user.email,
          name: user.displayName || 'Unnamed Member',
          role: 'member',
          status: 'active',
          birthday: null,
          address: '',
          trainerId: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          emailVerified: true, // Email is verified for Google login users
        };

        await setDoc(doc(db, 'members', user.uid), newUserData);
      }

      router.push('/member/dashboard');
    } catch (error: any) {
      console.error('Google sign in error:', error);
      message.error(error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password,
      );
      const user = userCredential.user;

      // Send verification email
      await sendEmailVerification(user);

      // Prepare user data
      const userData = {
        memberId: user.uid,
        email: values.email,
        name: values.name,
        role: 'member',
        status: 'active',
        birthdate: values.birthdate ? values.birthdate.format('YYYY-MM-DD') : '',
        address: values.address || '',
        trainerId: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        emailVerified: false,
        appointmentStatus: false
      };

      // Store user data in Firestore
      await setDoc(doc(db, 'members', user.uid), userData);

      message.success('Registration successful! Please verify your email.');
      router.push('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      message.error(error.message || 'Failed to register');
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
          onFinish={handleSubmit}
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
