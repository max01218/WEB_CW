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
  duration: number;  // Training duration (minutes)
  email: string;
  memberId: string;
  sessionDate: string | Timestamp;  // Training date
  status: 'completed' | 'cancelled' | 'pending';
  trainerId: string;
  session?: string;  // Training course type
}

export default function HistoryPage() {
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, memberData, loading: authLoading } = useAuth();
  const router = useRouter();

  // Get training records
  const fetchTrainingRecords = async () => {
    try {
      if (!user || !memberData) {
        console.log('Missing required data:', { hasUser: !!user, hasMemberData: !!memberData });
        return;
      }

      console.log('Fetching training records for:', memberData.email);
      
      const recordsQuery = query(
        collection(db, "appointments"),
        where("memberEmail", "==", memberData.email),
        where("status", "==", "completed")
      );

      const querySnapshot = await getDocs(recordsQuery);
      const recordsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        duration: doc.data().duration,
        email: doc.data().memberEmail,
        memberId: doc.data().memberId,
        sessionDate: doc.data().date,
        status: doc.data().status,
        trainerId: doc.data().trainerId,
        session: doc.data().courseType
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
              <div>{dateObj.toLocaleDateString('en-US')}</div>
              <div style={{ color: '#666', fontSize: '12px' }}>
                {dateObj.toLocaleTimeString('en-US', { 
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
            <div>{dateObj.toLocaleDateString('en-US')}</div>
            <div style={{ color: '#666', fontSize: '12px' }}>
              {dateObj.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        );
      }
    },
    {
      title: "Session Type",
      dataIndex: "session",
      key: "session",
      render: (session: string) => session || "Regular Training"
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

  // Show loading
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

  // Show when not logged in
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

  // Waiting for member data
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
              Back to Dashboard
            </Button>
            <h1 style={{ margin: 0 }}>Training History</h1>
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
            emptyText: "No training records found"
          }}
        />
      </div>
    </div>
  );
}
