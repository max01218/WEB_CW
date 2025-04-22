'use client'
import React, { useState } from 'react';
import 'antd/dist/reset.css';
import { Layout, Menu, theme,Button, Flex } from 'antd';
import Image from 'next/image';
import Login from '../login/page'
import { usePathname,useRouter } from 'next/navigation';
import styles from '../(user)/home/page.module.scss'


const { Header, Content, Footer } = Layout;

const items = [
  {
    key: 'membership',
    label: 'Membership',
    path: '/member'
  },
  {
    key: 'class',
    label: 'classes and sessions', 
    path: '/course'
  },
  {
    key: 'about',
    label: 'Gym',
    path: '/gym' 
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

  const handleLongin = () => setIsShowLogin(true);
  const handleClose = () => setIsShowLogin(false);

  const handleMenuClick = (e: { key: string }) => {
    const target = items.find(item => item.key === e.key)?.path;
    if (target) router.push(target);
  };

  return (
    <Layout>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center',
        padding: '0 24px' 
      }}>
        {/* Header 内容保持不变 */}
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
        <h1 className="site-title">Fitness Training System</h1>
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
          <Button type='primary' onClick={handleLongin}>Login</Button>
        </Flex>
        <Login isShow={isShowLogin} onClose={handleClose} />
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
  );
}

