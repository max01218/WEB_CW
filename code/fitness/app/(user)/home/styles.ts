import { CSSProperties } from 'react';

export const containerStyle: CSSProperties = {
  minHeight: '100vh',
  background: '#0F172A',
  color: '#fff',
};

export const headerStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  padding: '20px 5%',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: 'rgba(15, 23, 42, 0.8)',
  backdropFilter: 'blur(12px)',
  zIndex: 1000,
};

export const logoStyle: CSSProperties = {
  fontSize: '24px',
  fontWeight: 700,
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

export const navStyle: CSSProperties = {
  display: 'flex',
  gap: '32px',
  alignItems: 'center',
};

export const heroSectionStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '120px 5%',
  background: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15) 0%, rgba(15, 23, 42, 0) 50%)',
  position: 'relative',
  overflow: 'hidden',
};

export const heroContentStyle: CSSProperties = {
  maxWidth: '1200px',
  width: '100%',
  textAlign: 'center',
  position: 'relative',
  zIndex: 2,
};

export const heroTitleStyle: CSSProperties = {
  fontSize: '64px',
  fontWeight: 800,
  marginBottom: '24px',
  background: 'linear-gradient(to right, #60A5FA, #A78BFA)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  lineHeight: 1.2,
};

export const heroSubtitleStyle: CSSProperties = {
  fontSize: '20px',
  color: '#94A3B8',
  maxWidth: '600px',
  margin: '0 auto 40px',
  lineHeight: 1.6,
};

export const buttonContainerStyle: CSSProperties = {
  display: 'flex',
  gap: '16px',
  justifyContent: 'center',
  marginBottom: '64px',
};

export const primaryButtonStyle: CSSProperties = {
  padding: '16px 32px',
  fontSize: '16px',
  fontWeight: 600,
  color: '#fff',
  background: 'linear-gradient(to right, #3B82F6, #8B5CF6)',
  border: 'none',
  borderRadius: '12px',
  cursor: 'pointer',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  textDecoration: 'none',
};

export const secondaryButtonStyle: CSSProperties = {
  padding: '16px 32px',
  fontSize: '16px',
  fontWeight: 600,
  color: '#fff',
  background: 'rgba(255, 255, 255, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '12px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  textDecoration: 'none',
};

export const featureSectionStyle: CSSProperties = {
  padding: '100px 5%',
  background: '#1E293B',
};

export const featureGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '32px',
  maxWidth: '1200px',
  margin: '0 auto',
};

export const featureCardStyle: CSSProperties = {
  padding: '32px',
  background: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '20px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
};

export const featureIconStyle: CSSProperties = {
  fontSize: '32px',
  color: '#60A5FA',
  marginBottom: '20px',
};

export const featureTitleStyle: CSSProperties = {
  fontSize: '24px',
  fontWeight: 600,
  color: '#fff',
  marginBottom: '16px',
};

export const featureDescStyle: CSSProperties = {
  fontSize: '16px',
  color: '#94A3B8',
  lineHeight: 1.6,
};

export const footerStyle: CSSProperties = {
  padding: '40px 5%',
  background: '#0F172A',
  color: '#64748B',
  textAlign: 'center',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
}; 