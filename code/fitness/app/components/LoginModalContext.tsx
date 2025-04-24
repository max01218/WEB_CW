"use client";
import React, { createContext, useContext } from "react";

interface LoginModalContextType {
  showLogin: () => void;
}

export const LoginModalContext = createContext<LoginModalContextType>({
  showLogin() {
    console.warn("LoginModalContext not initialized");
  },
});

export function useLoginModal() {
  return useContext(LoginModalContext);
}
