// app/member/view/dashboard/page.js
"use client";

import { Card, Row, Col, Statistic, Button, Typography, Badge } from "antd";
import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ClockCircleOutlined, 
  HistoryOutlined, 
  CalendarOutlined, 
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  TrophyOutlined 
} from "@ant-design/icons";
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

const { Title } = Typography;

interface DashboardStats {
  totalTrainingMinutes: number;
  upcomingAppointments: number;
  completedTrainings: number;
  unreadNotifications: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTrainingMinutes: 0,
    upcomingAppointments: 0,
    completedTrainings: 0,
    unreadNotifications: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user, memberData, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      if (!user || !memberData) return;

      try {
        const trainingQuery = query(
          collection(db, 'trainingRecords'),
          where('email', '==', memberData.email),
          where('status', '==', 'completed')
        );
        const trainingSnapshot = await getDocs(trainingQuery);
        const completedTrainings = trainingSnapshot.docs.length;
        const totalMinutes = trainingSnapshot.docs.reduce(
          (total, doc) => total + (doc.data().duration || 0), 
          0
        );

        const now = new Date();
        const appointmentQuery = query(
          collection(db, 'appointments'),
          where('email', '==', memberData.email),
          where('status', '==', 'scheduled')
        );
        const appointmentSnapshot = await getDocs(appointmentQuery);
        const upcomingAppointments = appointmentSnapshot.docs.filter(doc => {
          const appointmentDate = doc.data().appointmentDate;
          if (appointmentDate instanceof Timestamp) {
            return appointmentDate.toDate() > now;
          }
          return new Date(appointmentDate) > now;
        }).length;

        const notificationsQuery = query(
          collection(db, 'notifications'),
          where('email', '==', memberData.email),
          where('read', '==', false)
        );
        const notificationsSnapshot = await getDocs(notificationsQuery);
        const unreadNotifications = notificationsSnapshot.docs.length;

        setStats({
          totalTrainingMinutes: totalMinutes,
          upcomingAppointments,
          completedTrainings,
          unreadNotifications,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, memberData]);

  return (
    <div style={{ 
      padding: "24px",
      background: "linear-gradient(135deg, #f0f2f5 0%, #e6e9f0 100%)",
      minHeight: "100vh"
    }}>
      <div style={{ 
        maxWidth: "1200px", 
        margin: "0 auto",
        padding: "24px",
        background: "rgba(255, 255, 255, 0.95)",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        backdropFilter: "blur(10px)"
      }}>
        <div style={{ 
          marginBottom: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 8px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "24px",
              background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <UserOutlined style={{ fontSize: "24px", color: "#fff" }} />
            </div>
            <div>
              <Title level={2} style={{ margin: 0, fontSize: "28px" }}>
                Member Dashboard
              </Title>
              <span style={{ color: "#666", fontSize: "16px" }}>
                Welcome back, {memberData?.name || 'Member'}!
              </span>
            </div>
          </div>
          <Button 
            type="primary" 
            danger 
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            size="large"
            style={{
              height: "40px",
              borderRadius: "20px",
              padding: "0 24px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            Logout
          </Button>
        </div>
        
        {/* Statistics cards */}
        <Row gutter={[24, 24]} style={{ marginBottom: "32px" }}>
          <Col xs={24} sm={8}>
            <Card 
              hoverable 
              style={{ 
                height: "100%",
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
              }}
            >
              <Statistic
                title={
                  <div style={{ 
                    fontSize: "16px", 
                    color: "#1890ff",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <ClockCircleOutlined style={{ fontSize: "20px" }} />
                    Total Training Hours
                  </div>
                }
                value={Math.round(stats.totalTrainingMinutes / 60 * 10) / 10}
                suffix="hrs"
                valueStyle={{ 
                  color: "#1890ff", 
                  fontSize: "28px",
                  fontWeight: "bold" 
                }}
              />
              <div style={{ marginTop: "12px", color: "#666" }}>
                Accumulated training time
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card 
              hoverable 
              style={{ 
                height: "100%",
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
              }}
            >
              <Statistic
                title={
                  <div style={{ 
                    fontSize: "16px", 
                    color: "#722ed1",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <CalendarOutlined style={{ fontSize: "20px" }} />
                    Upcoming Sessions
                  </div>
                }
                value={stats.upcomingAppointments}
                valueStyle={{ 
                  color: "#722ed1", 
                  fontSize: "28px",
                  fontWeight: "bold" 
                }}
              />
              <div style={{ marginTop: "12px", color: "#666" }}>
                Scheduled training appointments
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card 
              hoverable 
              style={{ 
                height: "100%",
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
              }}
            >
              <Statistic
                title={
                  <div style={{ 
                    fontSize: "16px", 
                    color: "#fa8c16",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <TrophyOutlined style={{ fontSize: "20px" }} />
                    Completed Sessions
                  </div>
                }
                value={stats.completedTrainings}
                valueStyle={{ 
                  color: "#fa8c16", 
                  fontSize: "28px",
                  fontWeight: "bold" 
                }}
              />
              <div style={{ marginTop: "12px", color: "#666" }}>
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
                style={{ 
                  height: "180px",
                  borderRadius: "16px",
                  border: "none",
                  background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                  color: "#fff",
                  overflow: "hidden",
                  position: "relative"
                }}
              >
                <div style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  fontSize: "64px",
                  opacity: "0.1"
                }}>
                  <CalendarOutlined />
                </div>
                <Statistic
                  title={
                    <span style={{ 
                      color: "#fff", 
                      fontSize: "20px",
                      fontWeight: "bold" 
                    }}>
                      Appointment Management
                    </span>
                  }
                  value="Schedule Training"
                  valueStyle={{ 
                    color: "#fff", 
                    fontSize: '18px',
                    marginTop: "8px"
                  }}
                />
                <div style={{ 
                  marginTop: "16px", 
                  fontSize: "14px", 
                  opacity: 0.8,
                  position: "relative",
                  zIndex: 1
                }}>
                  Click to schedule your next session
                </div>
              </Card>
            </Link>
          </Col>
          <Col xs={24} sm={8}>
            <Link href="/member/history" style={{ textDecoration: 'none' }}>
              <Card 
                hoverable 
                style={{ 
                  height: "180px",
                  borderRadius: "16px",
                  border: "none",
                  background: "linear-gradient(135deg, #722ed1 0%, #531dab 100%)",
                  color: "#fff",
                  overflow: "hidden",
                  position: "relative"
                }}
              >
                <div style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  fontSize: "64px",
                  opacity: "0.1"
                }}>
                  <HistoryOutlined />
                </div>
                <Statistic
                  title={
                    <span style={{ 
                      color: "#fff", 
                      fontSize: "20px",
                      fontWeight: "bold" 
                    }}>
                      Training History
                    </span>
                  }
                  value="View Records"
                  valueStyle={{ 
                    color: "#fff", 
                    fontSize: '18px',
                    marginTop: "8px"
                  }}
                />
                <div style={{ 
                  marginTop: "16px", 
                  fontSize: "14px", 
                  opacity: 0.8,
                  position: "relative",
                  zIndex: 1
                }}>
                  Track your progress
                </div>
              </Card>
            </Link>
          </Col>
          <Col xs={24} sm={8}>
            <Link href="/member/notification" style={{ textDecoration: 'none' }}>
              <Badge count={stats.unreadNotifications} offset={[-30, 30]}>
                <Card 
                  hoverable 
                  style={{ 
                    height: "180px",
                    borderRadius: "16px",
                    border: "none",
                    background: "linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)",
                    color: "#fff",
                    overflow: "hidden",
                    position: "relative"
                  }}
                >
                  <div style={{
                    position: "absolute",
                    top: "20px",
                    right: "20px",
                    fontSize: "64px",
                    opacity: "0.1"
                  }}>
                    <BellOutlined />
                  </div>
                  <Statistic
                    title={
                      <span style={{ 
                        color: "#fff", 
                        fontSize: "20px",
                        fontWeight: "bold" 
                      }}>
                        Notifications
                      </span>
                    }
                    value={stats.unreadNotifications > 0 ? `${stats.unreadNotifications} unread` : "All caught up"}
                    valueStyle={{ 
                      color: "#fff", 
                      fontSize: '18px',
                      marginTop: "8px"
                    }}
                  />
                  <div style={{ 
                    marginTop: "16px", 
                    fontSize: "14px", 
                    opacity: 0.8,
                    position: "relative",
                    zIndex: 1
                  }}>
                    View your notifications
                  </div>
                </Card>
              </Badge>
            </Link>
          </Col>
        </Row>
      </div>
    </div>
  );
}
