'use client';

import { useState } from 'react';
import { Card, Input, Button, message, Form } from 'antd';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      message.success('登入成功');
      router.push('/member/dashboard'); // 登入成功後轉到儀表板
    } catch (error: any) {
      console.error('Login error:', error);
      message.error(error.message || '登入失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#f5f5f5'
    }}>
      <Card
        title="會員登入"
        style={{
          width: 400,
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}
      >
        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            label="電子郵件"
            name="email"
            rules={[{ required: true, message: '請輸入電子郵件' }]}
          >
            <Input size="large" placeholder="請輸入電子郵件" />
          </Form.Item>

          <Form.Item
            label="密碼"
            name="password"
            rules={[{ required: true, message: '請輸入密碼' }]}
          >
            <Input.Password size="large" placeholder="請輸入密碼" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              登入
            </Button>
          </Form.Item>

          {/* 測試帳號提示 */}
          <div style={{ textAlign: 'center', color: '#666' }}>
            <p>測試帳號：test@example.com</p>
            <p>測試密碼：123456</p>
          </div>
        </Form>
      </Card>
    </div>
  );
} 