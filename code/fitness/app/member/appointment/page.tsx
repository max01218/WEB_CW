"use client";

import { Table, Button, message, Spin, Tag } from "antd";
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useState, useEffect } from "react";
import { collection, getDocs, doc, query, where, Timestamp, updateDoc, addDoc } from "firebase/firestore";
import { ref, push } from 'firebase/database';
import { db, database } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { useRouter } from 'next/navigation';

interface Appointment {
  id: string;
  email: string;
  trainerId: string;
  appointmentDate: string | Timestamp;
  status: 'scheduled' | 'cancelled' | 'completed';
  remarks?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

const encodeEmail = (email: string) => {
  return email.replace(/[.@]/g, '_');
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, memberData, loading: authLoading } = useAuth();
  const router = useRouter();

  const fetchAppointments = async () => {
    try {
      if (!user || !memberData) return;

      const appointmentsQuery = query(
        collection(db, "appointments"),
        where("email", "==", memberData.email),
        where("status", "in", ["scheduled", "completed"])
      );

      const querySnapshot = await getDocs(appointmentsQuery);
      const appointmentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        appointmentDate: doc.data().appointmentDate,
        createdAt: doc.data().createdAt,
        updatedAt: doc.data().updatedAt
      })) as Appointment[];

      // 按日期排序
      appointmentsData.sort((a, b) => {
        const dateA = a.appointmentDate instanceof Timestamp ? 
          a.appointmentDate.toDate() : new Date(a.appointmentDate);
        const dateB = b.appointmentDate instanceof Timestamp ? 
          b.appointmentDate.toDate() : new Date(b.appointmentDate);
        return dateA.getTime() - dateB.getTime();
      });

      setAppointments(appointmentsData);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      message.error("Failed to fetch appointment data.");
    } finally {
      setLoading(false);
    }
  };

  const addTestAppointment = async () => {
    if (!memberData) {
      message.error('Please log in first.');
      return;
    }
    
    try {
      // 计算两週後的日期
      const twoWeeksLater = new Date();
      twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
      
      // 設置時間為上午 10:00
      twoWeeksLater.setHours(10, 0, 0, 0);
      
      const testAppointment = {
        email: memberData.email,
        trainerId: "trainer123",
        appointmentDate: Timestamp.fromDate(twoWeeksLater),
        status: "scheduled" as const,
        remarks: "Test appointment",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // Add appointment
      const appointmentRef = await addDoc(collection(db, "appointments"), testAppointment);
      
      // 立即更新本地状态
      const newAppointment: Appointment = {
        id: appointmentRef.id,
        email: memberData.email,
        trainerId: "trainer123",
        appointmentDate: Timestamp.fromDate(twoWeeksLater),
        status: "scheduled",
        remarks: "Test appointment",
      };
      setAppointments(prevAppointments => [...prevAppointments, newAppointment]);
      
      // Create notification for the new appointment
      const notification = {
        email: memberData.email,
        title: "New Appointment Reminder",
        description: `You have successfully scheduled a training session for ${twoWeeksLater.toLocaleString()}`,
        date: new Date().toISOString(),
        type: "appointment",
        read: false,
        appointmentId: appointmentRef.id,
        createdAt: Timestamp.now()
      };

      // 使用 Firestore 存储通知
      await addDoc(collection(db, "notifications"), notification);
      
      message.success("Test appointment created.");
      // 强制刷新 Dashboard 页面
      router.refresh();
    } catch (error) {
      console.error("Error creating test appointment:", error);
      message.error("Failed to create test appointment.");
      // 如果发生错误，重新获取数据
      fetchAppointments();
    }
  };

  const onCancelAppointment = async (record: Appointment) => {
    try {
      const appointmentRef = doc(db, "appointments", record.id);
      await updateDoc(appointmentRef, {
        status: "cancelled",
        updatedAt: Timestamp.now()
      });
      
      // 立即更新本地状态
      setAppointments(prevAppointments => 
        prevAppointments.filter(appointment => appointment.id !== record.id)
      );
      
      // Create notification for the cancelled appointment
      if (!memberData) {
        throw new Error('Member data is required');
      }

      const notification = {
        email: memberData.email,
        title: "Appointment Cancellation Notice",
        description: `You have cancelled the training session scheduled for ${record.appointmentDate instanceof Timestamp 
          ? record.appointmentDate.toDate().toLocaleString()
          : new Date(record.appointmentDate).toLocaleString()}`,
        date: new Date().toISOString(),
        type: "appointment",
        read: false,
        appointmentId: record.id,
        createdAt: Timestamp.now()
      };

      // 使用 Firestore 存储通知
      await addDoc(collection(db, "notifications"), notification);
      
      message.success("Appointment cancelled.");
      // 强制刷新 Dashboard 页面
      router.refresh();
    } catch (error) {
      console.error("Error canceling appointment:", error);
      message.error("Failed to cancel appointment.");
      // 如果发生错误，重新获取数据
      fetchAppointments();
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }

      if (memberData) {
        fetchAppointments();
      } else {
        setLoading(true);
      }
    }
  }, [user, memberData, authLoading]);

  const statusColors = {
    scheduled: "processing",
    cancelled: "error",
    completed: "success"
  };

  const statusText = {
    scheduled: "Scheduled",
    cancelled: "Cancelled",
    completed: "Completed"
  };

  const columns = [
    { 
      title: "Appointment Time",
      dataIndex: "appointmentDate",
      key: "appointmentDate",
      render: (date: string | Timestamp) => {
        const dateObj = date instanceof Timestamp ? date.toDate() : new Date(date);
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
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: keyof typeof statusColors) => (
        <Tag color={statusColors[status]}>
          {statusText[status] || status}
        </Tag>
      )
    },
    { 
      title: "Remarks",
      dataIndex: "remarks",
      key: "remarks",
      ellipsis: true
    },
    {
      title: "Action",
      key: "action",
      render: (_: unknown, record: Appointment) => (
        <Button 
          type="link" 
          danger
          onClick={() => onCancelAppointment(record)}
          disabled={record.status !== 'scheduled'}
        >
          Cancel Appointment
        </Button>
      ),
    },
  ];

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
        <h2>Please log in first</h2>
        <Button type="primary" onClick={() => router.push('/login')}>
          Go to Login
        </Button>
      </div>
    );
  }

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
            <h1 style={{ margin: 0 }}>Appointment Management</h1>
          </div>
          <Button 
            type="primary"
            onClick={addTestAppointment}
          >
            Add Test Appointment
          </Button>
        </div>
        <Table 
          columns={columns} 
          dataSource={appointments}
          rowKey="id"
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} appointments`
          }}
          locale={{
            emptyText: "No appointment records found"
          }}
        />
      </div>
    </div>
  );
}
