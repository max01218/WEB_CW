'use client'
import React, { useState } from 'react';
import 'antd/dist/reset.css';
import { Layout, Menu, theme,Button, Flex } from 'antd';
import Image from 'next/image';
import Login from '../login/page'
import { usePathname,useRouter } from 'next/navigation';
import styles from '@/app/login/page.module.scss'
import { LoginModalContext } from "@/app/components/LoginModalContext";

const { Header, Content, Footer } = Layout;

const items = [
  {
    key: 'home',
    label: 'Home',
    path: '/home' 
  },
  {
    key: 'personal trainer',
    label: 'Personal trainer',
    path: '/trainer' 
  },
  {
    key: 'class',
    label: 'Classes and sessions', 
    path: '/course'
  },
  {
    key: 'membership',
    label: 'Membership',
    path: '/member'
  },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const [isShowLogin, setIsShowLogin] = useState(false);
  const pathname = usePathname();

  const showLogin = () => setIsShowLogin(true);
  const hideLogin = () => setIsShowLogin(false);

  const handleMenuClick = (e: { key: string }) => {
    const target = items.find(item => item.key === e.key)?.path;
    if (target) router.push(target);
  };

  return (
    <LoginModalContext.Provider value={{ showLogin }}>
    <Layout>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center',
        padding: '0 24px' ,
        position: 'relative', // Provide a reference for positioning sub-elements
        overflow: 'visible'    // Allow the login box to overflow
      }}>
        <div className="demo-logo" style={{
          marginRight: 40,
          display: 'flex',
          alignItems: 'center'
        }} />
        <Image
          src="/images/logo.png" 
          alt="Company Logo"
          width={120}
          height={40}
        />
        {/* <h1 className="site-title">Fitness Training System</h1> */}
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={items
            .filter(item => pathname.startsWith(item.path))
            .map(item => item.key)}
          items={items}
          onClick={handleMenuClick}
          style={{ 
            flex: 1, 
            minWidth: 0
          }}
        />
        <Flex gap="small" wrap className={styles.operationArea}>
          <Button type='primary' onClick={showLogin}>Login</Button>
        </Flex>
        <Login isShow={isShowLogin} onClose={hideLogin} />
      </Header>
      
      <Content style={{ padding: '0 48px' }}>
        <div style={{
          background: colorBgContainer,
          minHeight: 280,
          padding: 24,
          borderRadius: borderRadiusLG,
        }}>
          {children}
        </div>
      </Content>
      
      <Footer style={{ textAlign: 'center' }}>
        Ant Design ©{new Date().getFullYear()} Created by Ant UED
      </Footer>
    </Layout>
     </LoginModalContext.Provider>
  );
}

