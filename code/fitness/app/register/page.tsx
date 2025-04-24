'use client';

import { useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import LoginBoxWrapper from '@/app/components/LoginBoxWrapper';
import styles from '../login/page.module.scss';
import { Button, message } from 'antd';
import { serverTimestamp } from 'firebase/firestore';


const Register = () => {
  const router = useRouter();
  const auth = getAuth();

  const [form, setForm] = useState({
    name: '',
    birthdate: '',
    address: '',
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    router.push('/home');
  };

  const handleRegister = async () => {
    const { name, birthdate, address, email, password } = form;

    if (!name || !birthdate || !address || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // 创建用户账号
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // 写入 Firestore 的 members 表
      await setDoc(doc(db, 'members', uid), {
        uid,
        name,
        birthdate,
        address,
        email,
        role: 'member',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        appointmentStatus: false
      });

      message.success('Registration successful!');
      router.push('/home');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginBoxWrapper onClose={handleClose}>
      {error && <div className={styles.error}>{error}</div>}
      <input
        name="name"
        type="text"
        placeholder="Name"
        value={form.name}
        onChange={handleChange}
      />
      <input
        name="birthdate"
        type="date"
        placeholder="Birthdate"
        value={form.birthdate}
        onChange={handleChange}
      />
      <input
        name="address"
        type="text"
        placeholder="Address"
        value={form.address}
        onChange={handleChange}
      />
      <input
        name="email"
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
      />
      <Button
        style={{ 
          margin: "auto 95px" 
        }}
        onClick={handleRegister}
        loading={loading}
      >
        Register
      </Button>
    </LoginBoxWrapper>
  );
};

export default Register;
