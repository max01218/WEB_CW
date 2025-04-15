// app/member/view/notifications/page.js
"use client";

import { List, Card, Button, Spin, message } from "antd";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy, Timestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { useRouter } from 'next/navigation';
import { ArrowLeftOutlined, CheckOutlined } from '@ant-design/icons';

interface Notification {
  id: string;
  content: string;
  email: string;
  memberId: string;
  type: string;
  read: boolean;
  updateTime: Timestamp;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, memberData, loading: authLoading } = useAuth();
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      if (!user || !memberData) return;

      const notificationsQuery = query(
        collection(db, "notifications"),
        where("email", "==", memberData.email),
        where("read", "==", false),
        orderBy("updateTime", "desc")
      );

      const querySnapshot = await getDocs(notificationsQuery);
      const notificationsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];

      setNotifications(notificationsData);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, "notifications", notificationId);
      await updateDoc(notificationRef, {
        read: true,
        updateTime: Timestamp.now()
      });
      
      // 從列表中移除已讀的通知
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      message.success("Marked as read");
    } catch (error) {
      console.error("Error marking notification as read:", error);
      message.error("Failed to mark as read");
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }

      if (memberData) {
        fetchNotifications();
      }
    }
  }, [user, memberData, authLoading]);

  if (authLoading || loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f0f2f5'
      }}>
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f0f2f5'
      }}>
        <h2>Please login first</h2>
        <Button type="primary" onClick={() => router.push('/login')}>
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: "24px",
      background: "#f5f5f5",
      minHeight: "100vh"
    }}>
      <div style={{ 
        maxWidth: "1200px", 
        margin: "0 auto",
        padding: "24px",
        background: "#fff",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: "24px"
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Button 
              onClick={() => router.push('/member/dashboard')}
              icon={<ArrowLeftOutlined />}
            >
              Back to Dashboard
            </Button>
            <h1 style={{ margin: 0 }}>Notifications</h1>
          </div>
        </div>

        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={notifications}
          renderItem={(item: Notification) => (
            <List.Item>
              <Card 
                style={{ 
                  borderLeft: `4px solid ${
                    item.type === 'appointment' ? '#1890ff' : 
                    item.type === 'trainingUpdate' ? '#52c41a' : 
                    '#faad14'
                  }`
                }}
                extra={
                  <Button
                    type="text"
                    icon={<CheckOutlined />}
                    onClick={() => markAsRead(item.id)}
                  >
                    Mark as read
                  </Button>
                }
              >
                <p>{item.content}</p>
                <p style={{ fontSize: "12px", color: "#888" }}>
                  {item.updateTime.toDate().toLocaleString()}
                </p>
              </Card>
            </List.Item>
          )}
          locale={{
            emptyText: "No unread notifications"
          }}
        />
      </div>
    </div>
  );
}
