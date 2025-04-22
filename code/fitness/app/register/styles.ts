import { CSSProperties } from 'react';

export const containerStyle: CSSProperties = {
  minHeight: '100vh',
  background: '#0F172A',
  color: '#fff',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '20px',
  position: 'relative',
};

export const cardStyle: CSSProperties = {
  width: '100%',
  maxWidth: '420px',
  padding: '40px',
  background: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '24px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(20px)',
};

export const titleStyle: CSSProperties = {
  fontSize: '32px',
  fontWeight: 600,
  textAlign: 'center',
  marginBottom: '32px',
  background: 'linear-gradient(to right, #60A5FA, #A78BFA)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
};

export const formStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

export const inputStyle: CSSProperties = {
  padding: '16px',
  fontSize: '16px',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(255, 255, 255, 0.05)',
  color: '#fff',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'all 0.3s ease',
};

export const primaryButtonStyle: CSSProperties = {
  padding: '16px',
  fontSize: '16px',
  fontWeight: 600,
  borderRadius: '12px',
  border: 'none',
  background: 'linear-gradient(to right, #3B82F6, #8B5CF6)',
  color: '#fff',
  cursor: 'pointer',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  width: '100%',
};

export const backButtonStyle: CSSProperties = {
  position: 'absolute',
  top: '20px',
  left: '20px',
  padding: '8px 16px',
  fontSize: '14px',
  fontWeight: 500,
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  background: 'rgba(255, 255, 255, 0.05)',
  color: '#fff',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
};

export const linkContainerStyle: CSSProperties = {
  marginTop: '24px',
  textAlign: 'center',
  fontSize: '14px',
  color: '#94A3B8',
};

export const linkStyle: CSSProperties = {
  color: '#60A5FA',
  textDecoration: 'none',
  marginLeft: '4px',
  transition: 'color 0.3s ease',
}; 