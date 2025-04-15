// app/member/view/history/page.js
"use client";

import { Table, Button, message, Spin, Tag } from "antd";
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useState, useEffect } from "react";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { useRouter } from 'next/navigation';

interface TrainingRecord {
  id: string;
  duration: number;  // 訓練時長（分鐘）
  email: string;
  memberId: string;
  sessionDate: string | Timestamp;  // 訓練日期
  status: 'completed' | 'cancelled' | 'pending';
  trainerId: string;
}

export default function HistoryPage() {
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, memberData, loading: authLoading } = useAuth();
  const router = useRouter();

  // 獲取訓練記錄
  const fetchTrainingRecords = async () => {
    try {
      if (!user || !memberData) {
        console.log('Missing required data:', { hasUser: !!user, hasMemberData: !!memberData });
        return;
      }

      console.log('Fetching training records for:', memberData.email);
      
      const recordsQuery = query(
        collection(db, "trainingRecords"),
        where("email", "==", memberData.email)
      );

      const querySnapshot = await getDocs(recordsQuery);
      const recordsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TrainingRecord[];

      console.log('Fetched records:', recordsData.length);
      setRecords(recordsData);
    } catch (error) {
      console.error("Error fetching training records:", error);
      message.error("Failed to fetch training records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        console.log('No user, redirecting to login');
        router.push('/login');
        return;
      }

      if (memberData) {
        console.log('Member data available, fetching training records');
        fetchTrainingRecords();
      } else {
        console.log('Waiting for member data...');
        setLoading(true);
      }
    }
  }, [user, memberData, authLoading]);

  // Status tag color mapping
  const statusColors = {
    completed: "success",
    cancelled: "error",
    pending: "warning"
  };

  // Status text mapping
  const statusText = {
    completed: "Completed",
    cancelled: "Cancelled",
    pending: "Pending"
  };

  const columns = [
    { 
      title: "Training Time",
      dataIndex: "sessionDate",
      key: "sessionDate",
      render: (date: string | Timestamp) => {
        if (date instanceof Timestamp) {
          const dateObj = date.toDate();
          return (
            <div>
              <div>{dateObj.toLocaleDateString('zh-TW')}</div>
              <div style={{ color: '#666', fontSize: '12px' }}>
                {dateObj.toLocaleTimeString('zh-TW', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          );
        }
        const dateObj = new Date(date);
        return (
          <div>
            <div>{dateObj.toLocaleDateString('zh-TW')}</div>
            <div style={{ color: '#666', fontSize: '12px' }}>
              {dateObj.toLocaleTimeString('zh-TW', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        );
      }
    },
    {
      title: "Duration",
      dataIndex: "duration",
      key: "duration",
      render: (duration: number) => `${duration} minutes`
    },
    { 
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: keyof typeof statusColors) => (
        <Tag color={statusColors[status] || 'default'}>
          {statusText[status] || status}
        </Tag>
      )
    }
  ];

  // 顯示載入中
  if (authLoading || loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f0f2f5'
      }}>
        <Spin size="large" tip="載入中..." />
      </div>
    );
  }

  // 未登入時顯示
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

  // 等待會員資料
  if (!memberData) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f0f2f5'
      }}>
        <Spin size="large" tip="Loading member data..." />
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
              Return to Dashboard
            </Button>
            <h1 style={{ margin: 0 }}>Reservation History</h1>
          </div>
        </div>
        <Table 
          columns={columns} 
          dataSource={records}
          rowKey="id"
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} records`
          }}
          locale={{
            emptyText: "No historical record"
          }}
        />
      </div>
    </div>
  );
}
