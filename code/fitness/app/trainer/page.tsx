'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, Row, Col, Button, Typography } from 'antd';
import { UserAddOutlined, HistoryOutlined, CalendarOutlined, LogoutOutlined } from '@ant-design/icons';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { withAuth } from '../components/withAuth';

const { Title } = Typography;

const TrainerPage = () => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/home');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const cardStyle = {
    marginBottom: '20px',
    borderRadius: '15px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    cursor: 'pointer',
    height: '100%',
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
    position: 'relative' as const,
  };

  const titleStyle = {
    textAlign: 'center' as const,
    marginBottom: '40px',
  };

  const iconStyle = {
    fontSize: '36px',
    color: '#1890ff',
    marginBottom: '16px',
  };

  const buttonStyle = {
    height: 'auto',
    padding: '24px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    background: 'white',
  };

  const logoutButtonStyle = {
    position: 'absolute' as const,
    top: '24px',
    right: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  return (
    <div style={containerStyle}>
      <Button 
        type="text" 
        icon={<LogoutOutlined />} 
        onClick={handleLogout}
        style={logoutButtonStyle}
        danger
      >
        Logout
      </Button>
      <Title level={2} style={titleStyle}>Trainer Dashboard</Title>
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={8}>
          <Card 
            hoverable 
            style={cardStyle}
            bodyStyle={{ padding: 0 }}
          >
            <Button 
              type="text" 
              style={buttonStyle}
              onClick={() => router.push('/trainer/receive-member')}
            >
              <UserAddOutlined style={iconStyle} />
              <Title level={4}>Receive Member</Title>
              <p>View and accept new member applications</p>
            </Button>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card 
            hoverable 
            style={cardStyle}
            bodyStyle={{ padding: 0 }}
          >
            <Button 
              type="text" 
              style={buttonStyle}
              onClick={() => router.push('/trainer/member-history')}
            >
              <HistoryOutlined style={iconStyle} />
              <Title level={4}>Update History</Title>
              <p>Record and update member training history</p>
            </Button>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card 
            hoverable 
            style={cardStyle}
            bodyStyle={{ padding: 0 }}
          >
            <Button 
              type="text" 
              style={buttonStyle}
              onClick={() => router.push('/trainer/book-session')}
            >
              <CalendarOutlined style={iconStyle} />
              <Title level={4}>Book Session</Title>
              <p>Schedule next training session</p>
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default withAuth(TrainerPage, { requiredRole: 'trainer' }); 