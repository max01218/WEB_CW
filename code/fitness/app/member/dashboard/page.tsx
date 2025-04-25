// app/member/view/dashboard/page.js
"use client";

import { Card, Row, Col, Statistic, Button, Typography, Badge, Popover, List, Spin, message } from "antd";
import { useState, useEffect } from "react";
import Link from "next/link";
import './styles.css';
import { 
  ClockCircleOutlined, 
  HistoryOutlined, 
  CalendarOutlined, 
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  TrophyOutlined,
  CheckOutlined,
  PlusOutlined,
  EditOutlined,
  EnvironmentOutlined
} from "@ant-design/icons";
import { collection, query, where, getDocs, Timestamp, onSnapshot, orderBy, addDoc } from 'firebase/firestore';
import { ref, onValue, update } from 'firebase/database';
import { db, database } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { withAuth } from '@/app/components/withAuth';
import {
  containerStyle,
  contentStyle,
  headerStyle,
  avatarContainerStyle,
  avatarStyle,
  titleStyle,
  welcomeTextStyle,
  headerActionsStyle,
  bellButtonStyle,
  logoutButtonStyle,
  statisticTitleStyle,
  statisticIconStyle,
  statisticValueStyle,
  statisticDescStyle,
  dotStyle,
  navCardIconStyle,
  navCardTitleStyle,
  navCardValueStyle,
  navCardDescStyle,
  navCardDotStyle
} from './styles';
import FitnessMap from '@/app/components/FitnessMap';

const { Title, Text } = Typography;

interface DashboardStats {
  totalTrainingMinutes: number;
  upcomingAppointments: number;
  completedTrainings: number;
  unreadNotifications: number;
}

interface Notification {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'appointment' | 'training' | 'system';
  read: boolean;
}

// 添加一个辅助函数来编码邮箱地址
const encodeEmail = (email: string) => {
  return email.replace(/[.@]/g, '_');
};

const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalTrainingMinutes: 0,
    upcomingAppointments: 0,
    completedTrainings: 0,
    unreadNotifications: 0
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, memberData, signOut, loading: authLoading } = useAuth();
  const router = useRouter();

  // 监听预约变化
  useEffect(() => {
    if (!user || !memberData) return;

    const now = new Date();
    const appointmentQuery = query(
      collection(db, 'appointments'),
      where('email', '==', memberData.email),
      where('status', '==', 'scheduled')
    );

    // 设置实时监听
    const unsubscribeAppointments = onSnapshot(appointmentQuery, (snapshot) => {
      const upcomingAppointments = snapshot.docs.filter(doc => {
        const appointmentDate = doc.data().appointmentDate;
        if (appointmentDate instanceof Timestamp) {
          return appointmentDate.toDate() > now;
        }
        return new Date(appointmentDate) > now;
      }).length;

      setStats(prev => ({
        ...prev,
        upcomingAppointments
      }));
    });

    return () => {
      unsubscribeAppointments();
    };
  }, [user, memberData]);

  // 监听训练记录变化
  useEffect(() => {
    if (!user || !memberData) return;

    const trainingQuery = query(
      collection(db, 'trainingRecords'),
      where('email', '==', memberData.email),
      where('status', '==', 'completed')
    );

    // 设置实时监听
    const unsubscribeTraining = onSnapshot(trainingQuery, (snapshot) => {
      const completedTrainings = snapshot.docs.length;
      const totalMinutes = snapshot.docs.reduce(
        (total, doc) => total + (doc.data().duration || 0), 
        0
      );

      setStats(prev => ({
        ...prev,
        totalTrainingMinutes: totalMinutes,
        completedTrainings
      }));
    });

    return () => {
      unsubscribeTraining();
    };
  }, [user, memberData]);

  const markAsRead = async (notificationId: string) => {
    if (!memberData?.email) return;

    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
      
      // 本地状态会通过 onSnapshot 自动更新
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // 监听通知变化
  useEffect(() => {
    if (!memberData?.email) return;

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('email', '==', memberData.email),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );
    
    // 设置实时监听
    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      setNotifications(notificationsList);
      setStats(prev => ({
        ...prev,
        unreadNotifications: notificationsList.length
      }));

      // 如果有新通知，显示提醒
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const notification = change.doc.data();
          message.open({
            type: 'info',
            content: (
              <div>
                <div style={{ fontWeight: 'bold' }}>{notification.title}</div>
                <div>{notification.description}</div>
              </div>
            ),
            duration: 5,
            icon: <BellOutlined style={{ color: '#1890ff' }} />
          });
        }
      });
    });

    return () => {
      unsubscribeNotifications();
    };
  }, [memberData?.email]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/home');
        return;
      }
      if (!memberData) {
        setLoading(true);
      } else {
        setLoading(false);
      }
    }
  }, [user, memberData, authLoading]);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return '📅';
      case 'training':
        return '💪';
      case 'system':
        return '🔔';
      default:
        return '📌';
    }
  };

  const notificationContent = (
    <div style={{ 
      width: 350, 
      maxHeight: 450, 
      overflow: 'auto',
      padding: '8px',
      borderRadius: '8px'
    }}>
      {loading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Spin size="large" />
          <Text type="secondary">Loading notifications...</Text>
        </div>
      ) : notifications.length > 0 ? (
        <List
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item
              className={`notification-item ${item.read ? 'notification-item-read' : 'notification-item-unread'}`}
            >
              <div style={{ width: '100%' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '8px' 
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px' 
                  }}>
                    <span style={{ 
                      fontSize: '20px',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                    }}>
                      {getNotificationIcon(item.type)}
                    </span>
                    <Text strong style={{ fontSize: '15px' }}>{item.title}</Text>
                  </div>
                  {!item.read && (
                    <Button
                      type="text"
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={() => markAsRead(item.id)}
                      style={{
                        color: '#1890ff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 12px',
                        borderRadius: '15px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Mark as Read
                    </Button>
                  )}
                </div>
                <Text type="secondary" style={{ 
                  fontSize: '13px',
                  display: 'block',
                  marginBottom: '6px'
                }}>
                  {new Date(item.date).toLocaleString()}
                </Text>
                <div style={{ marginTop: '4px' }}>
                  <Text style={{ fontSize: '14px', lineHeight: '1.5' }}>
                    {item.description}
                  </Text>
                </div>
              </div>
            </List.Item>
          )}
        />
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#666',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px' 
        }}>
          <BellOutlined style={{ fontSize: '24px', opacity: 0.5 }} />
          <Text type="secondary">No notifications</Text>
        </div>
      )}
    </div>
  );

  const createTestAppointment = async () => {
    if (!memberData?.email) return;

    try {
      // 计算两周后的日期
      const twoWeeksLater = new Date();
      twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
      twoWeeksLater.setHours(10, 0, 0, 0); // 设置为上午10点

      const testAppointment = {
        email: memberData.email,
        appointmentDate: Timestamp.fromDate(twoWeeksLater),
        status: 'scheduled',
        type: 'training',
        notes: 'Test appointment created from dashboard',
        createdAt: Timestamp.now()
      };

      // 添加预约
      const appointmentRef = await addDoc(collection(db, 'appointments'), testAppointment);

      // 创建通知
      const notification = {
        email: memberData.email,
        title: 'New Appointment Scheduled',
        description: `Test appointment scheduled for ${twoWeeksLater.toLocaleDateString()} at 10:00 AM`,
        date: Timestamp.now(),
        type: 'appointment',
        read: false,
        appointmentId: appointmentRef.id,
        createdAt: Timestamp.now()
      };

      await addDoc(collection(db, 'notifications'), notification);

      message.success('Test appointment created successfully!');
    } catch (error) {
      console.error('Error creating test appointment:', error);
      message.error('Failed to create test appointment');
    }
  };

  const handleEditProfile = () => {
    router.push('/member/profile');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={headerStyle}>
          <div style={avatarContainerStyle}>
            <div style={avatarStyle}>
              <UserOutlined style={{ fontSize: "28px", color: "#fff" }} />
            </div>
            <div>
              <Title level={2} style={titleStyle}>
                Member Dashboard
              </Title>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={welcomeTextStyle}>
                  Welcome back, {memberData?.name || 'Member'}!
                </span>
                <Button 
                  type="link" 
                  icon={<EditOutlined />} 
                  onClick={handleEditProfile}
                  style={{ padding: 0, height: 'auto' }}
                >
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>
          <div style={headerActionsStyle}>
            <Popover
              content={notificationContent}
              title={
                <div style={{
                  padding: '8px 4px',
                  fontSize: '16px',
                  fontWeight: 600,
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  Notifications
                </div>
              }
              trigger="click"
              placement="bottomRight"
              overlayStyle={{ 
                width: 350,
                padding: 0
              }}
              overlayInnerStyle={{
                borderRadius: '12px',
                boxShadow: '0 6px 16px rgba(0,0,0,0.08)'
              }}
            >
              <Badge 
                count={notifications.filter(n => !n.read).length} 
                offset={[-2, 2]}
                style={{
                  backgroundColor: '#ff4d4f'
                }}
              >
                <Button
                  type="text"
                  icon={<BellOutlined style={{ 
                    fontSize: '22px',
                    color: 'rgba(0, 0, 0, 0.65)'
                  }} />}
                  className="notification-button"
                  style={bellButtonStyle}
                />
              </Badge>
            </Popover>
            <Button 
              type="primary" 
              danger 
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              size="large"
              style={logoutButtonStyle}
            >
              Logout
            </Button>
          </div>
        </div>
        
        {/* Statistics cards */}
        <Row gutter={[24, 24]} style={{ marginBottom: "32px" }}>
          <Col xs={24} sm={8}>
            <Card 
              hoverable 
              className="stat-card"
            >
              <Statistic
                title={
                  <div style={statisticTitleStyle("#1890ff")}>
                    <ClockCircleOutlined style={statisticIconStyle("rgba(24,144,255,0.1)")} />
                    Total Training Hours
                  </div>
                }
                value={Math.round(stats.totalTrainingMinutes / 60 * 10) / 10}
                suffix="hrs"
                valueStyle={statisticValueStyle("#1890ff")}
              />
              <div style={statisticDescStyle}>
                <div style={dotStyle("#1890ff")} />
                Accumulated training time
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card 
              hoverable 
              className="stat-card"
            >
              <Statistic
                title={
                  <div style={statisticTitleStyle("#722ed1")}>
                    <CalendarOutlined style={statisticIconStyle("rgba(114,46,209,0.1)")} />
                    Upcoming Sessions
                  </div>
                }
                value={stats.upcomingAppointments}
                valueStyle={statisticValueStyle("#722ed1")}
              />
              <div style={statisticDescStyle}>
                <div style={dotStyle("#722ed1")} />
                Scheduled training appointments
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card 
              hoverable 
              className="stat-card"
            >
              <Statistic
                title={
                  <div style={statisticTitleStyle("#fa8c16")}>
                    <TrophyOutlined style={statisticIconStyle("rgba(250,140,22,0.1)")} />
                    Completed Sessions
                  </div>
                }
                value={stats.completedTrainings}
                valueStyle={statisticValueStyle("#fa8c16")}
              />
              <div style={statisticDescStyle}>
                <div style={dotStyle("#fa8c16")} />
                Finished training sessions
              </div>
            </Card>
          </Col>
        </Row>

        {/* Navigation cards */}
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={8}>
            <Link href="/member/appointment" style={{ textDecoration: 'none' }}>
              <Card 
                hoverable 
                className="nav-card nav-card-blue"
              >
                <div style={navCardIconStyle}>
                  <CalendarOutlined />
                </div>
                <Statistic
                  title={
                    <span style={navCardTitleStyle}>
                      Appointment Management
                    </span>
                  }
                  value="Schedule Training"
                  valueStyle={navCardValueStyle}
                />
                <div style={navCardDescStyle}>
                  <div style={navCardDotStyle} />
                  Click to schedule your next session
                </div>
              </Card>
            </Link>
          </Col>
          <Col xs={24} sm={8}>
            <Link href="/member/history" style={{ textDecoration: 'none' }}>
              <Card 
                hoverable 
                className="nav-card nav-card-purple"
              >
                <div style={navCardIconStyle}>
                  <HistoryOutlined />
                </div>
                <Statistic
                  title={
                    <span style={navCardTitleStyle}>
                      Training History
                    </span>
                  }
                  value="View Records"
                  valueStyle={navCardValueStyle}
                />
                <div style={navCardDescStyle}>
                  <div style={navCardDotStyle} />
                  Track your progress
                </div>
              </Card>
            </Link>
          </Col>
          <Col xs={24} sm={8}>
            <Link href="/member/map" style={{ textDecoration: 'none' }}>
              <Card 
                hoverable 
                className="nav-card nav-card-green"
              >
                <div style={navCardIconStyle}>
                  <EnvironmentOutlined />
                </div>
                <Statistic
                  title={
                    <span style={navCardTitleStyle}>
                      Fitness Centers
                    </span>
                  }
                  value="View Map"
                  valueStyle={navCardValueStyle}
                />
                <div style={navCardDescStyle}>
                  <div style={navCardDotStyle} />
                  Find nearby fitness centers
                </div>
              </Card>
            </Link>
          </Col>
        </Row>

        {/* Test Appointment Button */}
        <Row style={{ marginTop: "24px" }}>
          <Col span={24} style={{ textAlign: 'center' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={createTestAppointment}
              style={{
                height: '40px',
                padding: '0 24px',
                borderRadius: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                background: 'linear-gradient(45deg, #1890ff, #096dd9)',
                border: 'none'
              }}
            >
              Create Test Appointment
            </Button>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default withAuth(DashboardPage, { requiredRole: 'member' });
