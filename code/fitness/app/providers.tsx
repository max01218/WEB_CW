'use client';

import { AuthProvider } from "@/lib/auth";
import { LoginModalProvider } from "@/app/components/LoginModalContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LoginModalProvider>
        {children}
      </LoginModalProvider>
    </AuthProvider>
  );
} 

