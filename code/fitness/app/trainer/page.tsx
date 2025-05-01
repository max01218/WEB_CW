'use client';
import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Statistic, Typography, Spin } from 'antd';
import { CalendarOutlined, HistoryOutlined, UserAddOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { withAuth } from '@/app/components/withAuth';

const { Title, Text } = Typography;

const TrainerDashboard = () => {
  const [pendingRequests, setPendingRequests] = useState(0);
  const [upcomingSessions, setUpcomingSessions] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);
  const [loading, setLoading] = useState(true);
  const { memberData } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!memberData) return;
      
      setLoading(true);
      try {
        // 直接从trainer集合中获取trainerId
        let trainerIdQuery: string;
        
        const trainersQuery = query(
          collection(db, 'trainer'),
          where('email', '==', memberData.email)
        );
        
        const trainerSnapshot = await getDocs(trainersQuery);
        if (!trainerSnapshot.empty) {
          const trainerData = trainerSnapshot.docs[0].data();
          trainerIdQuery = trainerData.trainerId || trainerSnapshot.docs[0].id;
        } else {
          // 如果没有找到，则使用memberId作为fallback
          console.warn("No trainer found, using memberId as fallback");
          trainerIdQuery = memberData.memberId || 'T001';
        }
        
        console.log("Current trainer ID:", trainerIdQuery);
        
        // Fetch pending requests count
        const requestsQuery = query(
          collection(db, 'requests'),
          where('trainerId', '==', trainerIdQuery),
          where('status', '==', 'pending')
        );
        
        const requestsSnapshot = await getDocs(requestsQuery);
        setPendingRequests(requestsSnapshot.docs.length);
        
        // Fetch upcoming sessions count
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = Timestamp.fromDate(today);
        
        const appointmentsQuery = query(
          collection(db, 'appointments'),
          where('trainerId', '==', trainerIdQuery),
          where('date', '>=', todayTimestamp),
          where('status', '==', 'scheduled')
        );
        
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        setUpcomingSessions(appointmentsSnapshot.docs.length);
        
        // Fetch assigned members count
        const membersQuery = query(
          collection(db, 'members'),
          where('trainerId', '==', trainerIdQuery)
        );
        
        const membersSnapshot = await getDocs(membersQuery);
        setTotalMembers(membersSnapshot.docs.length);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [memberData]);

  const modules = [
    {
      title: 'Request Management',
      description: 'Accept member requests or redirect them to other trainers',
      icon: <UserAddOutlined style={{ fontSize: '36px', color: '#1890ff' }} />,
      path: '/trainer/receive-member',
      notification: pendingRequests > 0 ? pendingRequests : null,
    },
    {
      title: 'Training History',
      description: 'View and track your members\' training progress',
      icon: <HistoryOutlined style={{ fontSize: '36px', color: '#52c41a' }} />,
      path: '/trainer/member-history',
    },
    {
      title: 'Session Booking',
      description: 'Schedule training sessions with your members',
      icon: <CalendarOutlined style={{ fontSize: '36px', color: '#722ed1' }} />,
      path: '/trainer/book-session',
      notification: upcomingSessions > 0 ? upcomingSessions : null,
    }
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        padding: '24px',
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Title level={2} style={{ marginBottom: '24px' }}>Trainer Dashboard</Title>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>Loading dashboard data...</div>
          </div>
        ) : (
          <>
            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col span={8}>
                <Card>
                  <Statistic 
                    title="Pending Requests" 
                    value={pendingRequests} 
                    valueStyle={{ color: pendingRequests > 0 ? '#ff4d4f' : '#000' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic 
                    title="Upcoming Sessions" 
                    value={upcomingSessions}
                    valueStyle={{ color: upcomingSessions > 0 ? '#1890ff' : '#000' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic 
                    title="Total Members" 
                    value={totalMembers}
                  />
                </Card>
              </Col>
            </Row>
            
            <Title level={4} style={{ marginBottom: '16px' }}>Trainer Modules</Title>
            <Row gutter={[16, 16]}>
              {modules.map((module, index) => (
                <Col key={index} xs={24} md={8}>
                  <Card 
                    style={{ height: '100%', cursor: 'pointer' }}
                    onClick={() => router.push(module.path)}
                    hoverable
                  >
                    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                      {module.icon}
                      {module.notification && (
                        <span style={{
                          position: 'absolute',
                          top: '24px',
                          right: '24px',
                          background: '#ff4d4f',
                          color: '#fff',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'inline-flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          fontSize: '12px',
                        }}>
                          {module.notification}
                        </span>
                      )}
                    </div>
                    <Title level={4} style={{ textAlign: 'center', marginTop: 0 }}>
                      {module.title}
                    </Title>
                    <Text style={{ display: 'block', textAlign: 'center' }}>
                      {module.description}
                    </Text>
                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                      <Button type="primary">
                        Go to {module.title}
                      </Button>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        )}
      </div>
    </div>
  );
};

export default withAuth(TrainerDashboard, { requiredRole: 'trainer' }); 