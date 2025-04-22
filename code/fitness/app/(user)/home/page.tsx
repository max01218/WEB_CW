// app/(user)/home/page.tsx
"use client";

import React from "react";
import { Button, message } from "antd";
import { getAuth, signOut } from "firebase/auth";

export default function HomePage() {
  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      message.success("You have been logged out.");
    } catch (error) {
      console.error("Logout error:", error);
      message.error("Logout failed.");
    }
  };

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1>Welcome to Home Page</h1>
      <Button type="primary" danger onClick={handleLogout}>
        Logout
      </Button>
      <h3>这个页面目前是清除浏览器登录信息的,后续会改,可能会改成俱乐部信息板或者直接删掉了</h3>
      <h3>建议先Logout再登录</h3>
    </div>
  );
}
