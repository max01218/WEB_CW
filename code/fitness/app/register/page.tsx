'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Form, Input, Button, DatePicker, message, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import dayjs from 'dayjs';

const { Title } = Typography;

const RegisterPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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

  const handleRegister = async (values: any) => {
    setLoading(true);
    try {
      // 创建 Firebase Auth 用户
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );

      // 准备用户数据
      const userData = {
        email: values.email,
        name: values.name,
        birthdate: dayjs(values.birthdate).format('YYYY-MM-DD'),
        appointmentStatus: false,
        role: 'member',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        uid: userCredential.user.uid,
      };

      // 存储用户数据到 Firestore
      await setDoc(doc(db, 'members', userCredential.user.uid), userData);

      message.success('Registration successful!');
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
