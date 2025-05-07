'use client';
import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Statistic, Typography, Spin, Alert, List, Badge, notification, message } from 'antd';
import { CalendarOutlined, HistoryOutlined, UserAddOutlined, LogoutOutlined, BellOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth, useTrainerData } from '@/lib/auth';
import { withAuth } from '@/app/components/withAuth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const { Title, Text } = Typography;

// Define interface for cancelled session data
interface CancelledSession {
  id: string;
  memberEmail?: string;
  timeStart?: string;
  timeEnd?: string;
  date?: Timestamp;
  trainerName?: string;
  status?: string;
}

const TrainerDashboard = () => {
  const [pendingRequests, setPendingRequests] = useState(0);
  const [upcomingSessions, setUpcomingSessions] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cancelledSessions, setCancelledSessions] = useState<CancelledSession[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, memberData } = useAuth();
  const trainerData = useTrainerData(user?.email || null);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!trainerData) return;
      setLoading(true);
      try {
        const trainerId = trainerData.trainerId;
        // Fetch pending requests count
        const requestsQuery = query(
          collection(db, 'requests'),
          where('trainerId', '==', trainerId),
          where('status', '==', 'pending')
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        setPendingRequests(requestsSnapshot.docs.length);

        // Fetch accepted requests count for total members
        const acceptedRequestsQuery = query(
          collection(db, 'requests'),
          where('trainerId', '==', trainerId),
          where('status', '==', 'accepted')
        );
        const acceptedRequestsSnapshot = await getDocs(acceptedRequestsQuery);
        setTotalMembers(acceptedRequestsSnapshot.docs.length);

        // Fetch upcoming sessions count
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = Timestamp.fromDate(today);

        const appointmentsQuery = query(
          collection(db, 'appointments'),
          where('trainerId', '==', trainerId),
          where('date', '>=', todayTimestamp),
          where('status', '==', 'scheduled')
        );
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        setUpcomingSessions(appointmentsSnapshot.docs.length);

        // Fetch cancelled sessions
        const cancelledQuery = query(
          collection(db, 'appointments'),
          where('trainerId', '==', trainerId),
          where('status', '==', 'cancelled'),
          orderBy('date', 'desc'),
          limit(10)
        );
        const cancelledSnapshot = await getDocs(cancelledQuery);
        const cancelledData: CancelledSession[] = cancelledSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCancelledSessions(cancelledData);

        // Show notification for cancelled sessions if there are any
        if (cancelledData.length > 0) {
          cancelledData.forEach(session => {
            notification.warning({
              message: 'Session Cancelled',
              description: `${session.memberEmail || 'A member'} has cancelled session from ${session.timeStart || 'N/A'} to ${session.timeEnd || 'N/A'}`,
              icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
              duration: 5
            });
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [trainerData]);

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>Trainer Dashboard</Title>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Badge count={cancelledSessions.length} overflowCount={99}>
              <Button 
                icon={<BellOutlined />} 
                onClick={() => setShowNotifications(!showNotifications)}
                type={showNotifications ? 'primary' : 'default'}
              >
                Notifications
              </Button>
            </Badge>
            <Button 
              type="primary" 
              danger 
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
        
        {showNotifications && cancelledSessions.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <Card title="Cancelled Sessions" style={{ marginBottom: '24px' }}>
              <List
                itemLayout="horizontal"
                dataSource={cancelledSessions}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<CloseCircleOutlined style={{ color: 'red', fontSize: '24px' }} />}
                      title={`Session with ${item.trainerName}`}
                      description={item.date && item.date.toDate ? 
                        `${new Date(item.date.toDate()).toLocaleDateString()} from ${item.timeStart} to ${item.timeEnd}` :
                        `From ${item.timeStart} to ${item.timeEnd}`
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </div>
        )}
        
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