// src/components/LoginBoxWrapper.tsx
'use client';
import React from 'react';
import styles from '@/app/login/page.module.scss';

interface Props {
  children: React.ReactNode;
  onClose?: () => void;
}

const LoginBoxWrapper = ({ children, onClose }: Props) => {
  return (
    <div className={styles.loginArea}>
      <div className={styles.loginBox}>
        <div className={styles.loginTitle}>
          <div>{onClose ? 'Access via email' : 'Register new account'}</div>
          {onClose && (
            <div className={styles.close} onClick={onClose}>
              x
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};

export default LoginBoxWrapper;
