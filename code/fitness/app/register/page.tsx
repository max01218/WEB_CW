"use client";

import { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
}

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const onFinish = async (values: RegisterFormData) => {
    setLoading(true);
    try {
      await signUp(values.email, values.password, values.name);
      message.success('註冊成功！');
      router.push('/login');
    } catch (error: any) {
      console.error('註冊錯誤:', error);
      message.error(error.message || '註冊失敗，請稍後再試');
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
      background: '#f0f2f5',
      padding: '20px'
    }}>
      <Card
        title={<h2 style={{ textAlign: 'center', margin: 0 }}>會員註冊</h2>}
        style={{ 
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}
      >
        <Form
          name="register"
          onFinish={onFinish}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="name"
            label="姓名"
            rules={[
              { required: true, message: '請輸入姓名' },
              { min: 2, message: '姓名至少2個字符' }
            ]}
          >
            <Input size="large" placeholder="請輸入您的姓名" />
          </Form.Item>

          <Form.Item
            name="email"
            label="電子郵件"
            rules={[
              { required: true, message: '請輸入電子郵件' },
              { type: 'email', message: '請輸入有效的電子郵件' }
            ]}
          >
            <Input size="large" placeholder="請輸入您的電子郵件" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密碼"
            rules={[
              { required: true, message: '請輸入密碼' },
              { min: 6, message: '密碼至少6個字符' }
            ]}
          >
            <Input.Password size="large" placeholder="請輸入密碼" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="確認密碼"
            dependencies={['password']}
            rules={[
              { required: true, message: '請確認密碼' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('兩次輸入的密碼不一致'));
                },
              }),
            ]}
          >
            <Input.Password size="large" placeholder="請再次輸入密碼" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              style={{ width: '100%' }}
            >
              註冊
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            已有帳號？ <Link href="/login">立即登入</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
} 