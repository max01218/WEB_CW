'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      message.error('Passwords do not match!');
      return;
    }

    if (!name || !birthdate) {
      message.error('Please fill in all fields!');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // 创建用户档案
      await setDoc(doc(db, 'members', uid), {
        uid,
        name,
        birthdate,
        email,
        role: 'member',
        createdAt: new Date(),
      });

      message.success('Registration successful!');
      router.push('/member/dashboard');
    } catch (error) {
      message.error('Registration failed. Please try again.');
    }
  };

  return (
    <div style={containerStyle}>
      <Link href="/" style={backButtonStyle} className="register-button-secondary">
        <ArrowLeftOutlined /> Back
      </Link>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Create Account</h1>
        <form style={formStyle} onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
            className="register-input"
            required
          />
          <input
            type="date"
            placeholder="Date of Birth"
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
            style={inputStyle}
            className="register-input"
            required
            min="1900-01-01"
            max={new Date().toISOString().split('T')[0]}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            className="register-input"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            className="register-input"
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={inputStyle}
            className="register-input"
            required
          />
          <button type="submit" style={primaryButtonStyle} className="register-button-primary">
            Register
          </button>
        </form>
        <div style={linkContainerStyle}>
          Already have an account?
          <Link href="/login" style={linkStyle} className="register-link">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
