import { CSSProperties } from 'react';

export const containerStyle: CSSProperties = {
  padding: "24px",
  background: "linear-gradient(135deg, #f5f7fa 0%, #e4e9f2 100%)",
  minHeight: "100vh"
};

export const contentStyle: CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "32px",
  background: "rgba(255, 255, 255, 0.95)",
  borderRadius: "24px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
  backdropFilter: "blur(20px)"
};

export const headerStyle: CSSProperties = {
  marginBottom: "40px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 8px"
};

export const avatarContainerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "20px"
};

export const avatarStyle: CSSProperties = {
  width: "56px",
  height: "56px",
  borderRadius: "28px",
  background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 4px 12px rgba(24,144,255,0.35)",
  transition: "all 0.3s ease"
};

export const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "32px",
  background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent"
};

export const welcomeTextStyle: CSSProperties = {
  color: "#666",
  fontSize: "16px",
  display: "block",
  marginTop: "4px"
};

export const headerActionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '20px'
};

export const bellButtonStyle: CSSProperties = {
  width: '40px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '20px',
  transition: 'all 0.3s ease'
};

export const logoutButtonStyle: CSSProperties = {
  height: "44px",
  borderRadius: "22px",
  padding: "0 28px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  boxShadow: "0 4px 12px rgba(245,34,45,0.25)",
  transition: "all 0.3s ease"
};

export const statisticTitleStyle = (color: string): CSSProperties => ({
  fontSize: "16px",
  color: color,
  marginBottom: "16px",
  display: "flex",
  alignItems: "center",
  gap: "12px"
});

export const statisticIconStyle = (bgColor: string): CSSProperties => ({
  fontSize: "24px",
  background: bgColor,
  padding: "8px",
  borderRadius: "12px"
});

export const statisticValueStyle = (color: string): CSSProperties => ({
  color: color,
  fontSize: "32px",
  fontWeight: "600"
});

export const statisticDescStyle: CSSProperties = {
  marginTop: "16px",
  color: "#666",
  fontSize: "14px",
  display: "flex",
  alignItems: "center",
  gap: "8px"
};

export const dotStyle = (color: string): CSSProperties => ({
  width: "6px",
  height: "6px",
  borderRadius: "3px",
  backgroundColor: color,
  opacity: 0.5
});

export const navCardIconStyle: CSSProperties = {
  position: "absolute",
  top: "20px",
  right: "20px",
  fontSize: "80px",
  opacity: "0.15",
  transform: "rotate(-15deg)"
};

export const navCardTitleStyle: CSSProperties = {
  color: "#fff",
  fontSize: "24px",
  fontWeight: "600",
  textShadow: "0 2px 4px rgba(0,0,0,0.1)"
};

export const navCardValueStyle: CSSProperties = {
  color: "rgba(255,255,255,0.9)",
  fontSize: '18px',
  marginTop: "12px",
  fontWeight: "normal"
};

export const navCardDescStyle: CSSProperties = {
  marginTop: "24px",
  fontSize: "14px",
  opacity: 0.8,
  position: "relative",
  zIndex: 1,
  display: "flex",
  alignItems: "center",
  gap: "8px"
};

export const navCardDotStyle: CSSProperties = {
  width: "4px",
  height: "4px",
  borderRadius: "2px",
  backgroundColor: "#fff",
  opacity: 0.5
}; 