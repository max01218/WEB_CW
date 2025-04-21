// src/pages/Login.tsx
'use client';
import { ChangeEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'antd';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth ,db } from '@/lib/firebase'; 
import styles from './page.module.scss';

interface Iprops {
  isShow: boolean;
  onClose: () => void;
}

const Login = (props : Iprops) => {
  const router = useRouter();
  const { isShow = false , onClose} = props;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setform] = useState({
    email:'',
    password:'',
  });

  const handleClose = () => {
    onClose();
    setError(''); 
  }

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const cred = await signInWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const userRef  = doc(db, 'members', cred.user.uid);
      const userDoc = await getDoc(userRef);

      
      if (!userDoc.exists()) {
        setError('User data not found');
        await auth.signOut(); 
        return;
      }

      const userData = userDoc.data();
      const role = userData?.role || 'member';

      if (role === 'admin') {
        router.push('/member/dashboard');
      } else {
        router.push('/home');
      }

      onClose();

    } catch (err : any) {
      console.error('Login error:', err);
      switch (err.code) {
        case 'auth/invalid-email':
          setError('Invalid email format');
          break;
        case 'auth/user-not-found':
          setError('No user found with this email');
          break;
        case 'auth/wrong-password':
          setError('Wrong password');
          break;
        case 'auth/network-request-failed':
          setError('Network error – please check your connection');
          break;
        case 'permission-denied':
          setError('No permission to read user data');
          break;
        default:
          // If Firestore threw a plain Error or something else:
          setError(err.message || 'An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };


  const handleReg = () => {

  }

  const handleOAuthGoogle = () => {

  }

  const handleFromChange = (e : ChangeEvent<HTMLInputElement>) => {
    const { name, value} = e?.target;
    setform(f => ({ ...f, [name]: value }));
  }

 return isShow ? (
  <div className = {styles.loginArea}>
    <div className={styles.loginBox}> 
      <div className={styles.loginTitle}>
        <div>Access via email</div>
        <div className={styles.close} onClick={handleClose}>x</div>
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <input 
        name= "email" 
        type="email" 
        placeholder='please input email'  
        value={form.email} 
        onChange={handleFromChange}
      />
      <input 
        name= "password" 
        type="password" 
        placeholder='please input password'  
        value={form.password} 
        onChange={handleFromChange}
      />
      <div className={styles.buttonGroup}>
      <Button 
        className={styles.loginBtn} 
        onClick={handleLogin} disabled={loading}>
        Login
      </Button>
      <Button className={styles.regBtn} onClick={handleReg}>register</Button>
      </div>
      <div className={styles.otherLogin} onClick={handleOAuthGoogle}>Login via google email</div>
    </div>
  </div>
 ) : null ;
};

export default Login;
