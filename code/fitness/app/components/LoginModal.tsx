import React, { useState } from 'react';
import { Modal, Form, Input, Button, message, Divider } from 'antd';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { GoogleOutlined } from '@ant-design/icons';

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ visible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      console.log('Attempting Google sign in...');
      const result = await signInWithPopup(auth, provider);
      console.log('Google sign in successful:', result);
      
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
        if (!userData.appointmentStatus) {
          message.warning('Your appointment request is still pending approval. Please wait for admin approval.');
          router.push('/home');
          return;
        }
      }

      message.success('Login successful!');
      onClose();
      router.push('/member/dashboard');
    } catch (error: any) {
      console.error('Google sign in error:', error);
      if (error.code === 'auth/operation-not-allowed') {
        message.error('Google sign in is not enabled. Please contact administrator.');
      } else if (error.code === 'auth/popup-blocked') {
        message.error('Popup was blocked by your browser. Please allow popups for this site.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        message.info('Sign in was cancelled');
      } else if (error.code === 'auth/unauthorized-domain') {
        message.error('This domain is not authorized for Google sign in. Please contact administrator.');
      } else {
        message.error(`Failed to sign in with Google: ${error.message}`);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      
      if (!userCredential.user.emailVerified) {
        message.error('Please verify your email first. Check your inbox for the verification link.');
        router.push('/home');
        return;
      }

      // Get user data
      const userRef = doc(db, 'members', userCredential.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (!userData.appointmentStatus) {
          message.warning('Your appointment request is still pending approval. Please wait for admin approval.');
          router.push('/home');
          return;
        }
      }
      
      message.success('Login successful!');
      onClose();
      router.push('/member/dashboard');
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
    <Modal
      title="Login"
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
    >
      <Button 
        type="default" 
        icon={<GoogleOutlined />}
        onClick={handleGoogleSignIn}
        loading={googleLoading}
        disabled={loading}
        block
        style={{ marginBottom: 16 }}
      >
        Continue with Google
      </Button>

      <Divider>or</Divider>

      <Form
        name="login"
        onFinish={handleLogin}
        layout="vertical"
      >
        <Form.Item
          name="email"
          rules={[{ required: true, message: 'Please enter your email' }]}
        >
          <Input placeholder="Email" />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Please enter your password' }]}
        >
          <Input.Password placeholder="Password" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Login
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default LoginModal; 