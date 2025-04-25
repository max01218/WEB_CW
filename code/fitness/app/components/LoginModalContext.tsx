"use client";
import React, { createContext, useContext, useState } from "react";
import LoginModal from "./LoginModal";

interface LoginModalContextType {
  showLogin: () => void;
}

export const LoginModalContext = createContext<LoginModalContextType>({
  showLogin() {
    console.warn("LoginModalContext not initialized");
  },
});

export function LoginModalProvider({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

  const showLogin = () => {
    setIsVisible(true);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <LoginModalContext.Provider value={{ showLogin }}>
      {children}
      <LoginModal visible={isVisible} onClose={handleClose} />
    </LoginModalContext.Provider>
  );
}

export function useLoginModal() {
  return useContext(LoginModalContext);
}