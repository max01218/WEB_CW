'use client'
import React, { useState } from 'react';
import 'antd/dist/reset.css';
import { Breadcrumb, Layout, Menu, theme,Button, Flex } from 'antd';
import Image from 'next/image';
import Login from '../login/page'
import Link from "next/link";
import styles from './page.module.scss'
import { usePathname,useRouter } from 'next/navigation';


const { Header, Content, Footer } = Layout;

const items = [
  {
    key: 'membership',
    label: 'Membership',
    path: '/member'
  },
  {
    key: 'appointment',
    label: 'Appointment', 
    path: '/member/appointment'
  },
  {
    key: 'about',
    label: 'About CWSport',
    path: '/about-cwsport' 
  },
];

const App: React.FC = () => {
  const router = useRouter(); // 获取路由对象

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [isShowLogin, setIsShowLogin] = useState(false);

  const handleLongin = () => {
    setIsShowLogin(true);
  };

  const handleClose = () => {
    // 类似单项数据流概念
    setIsShowLogin(false);
  }

  const pathname = usePathname();
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
            minWidth: 0,
            // justifyContent: 'flex-end'
           }}
        />
        <Flex gap="small" wrap className='styles.operationArea'>
          <Button type='primary' onClick={handleLongin}>Login</Button>
        </Flex>
        <Login isShow={isShowLogin} onClose={handleClose}></Login>
      </Header>
      <Content style={{ padding: '0 48px' }}>
        {/* <Breadcrumb style={{ margin: '16px 0' }}>
          <Breadcrumb.Item>Home</Breadcrumb.Item>
          <Breadcrumb.Item>List</Breadcrumb.Item>
          <Breadcrumb.Item>App</Breadcrumb.Item>
        </Breadcrumb> */}
        <div
          style={{
            background: colorBgContainer,
            minHeight: 280,
            padding: 24,
            borderRadius: borderRadiusLG,
          }}
        >
        </div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        Ant Design ©{new Date().getFullYear()} Created by Ant UED
      </Footer>
    </Layout>
  );
};

export default App;
