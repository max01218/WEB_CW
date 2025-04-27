"use client";

import { Table, Button, message, Spin, Tag } from "antd";
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useState, useEffect } from "react";
import { collection, getDocs, doc, query, where, Timestamp, updateDoc, addDoc, onSnapshot } from "firebase/firestore";
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
        where("status", "==", "scheduled")
      );

      const querySnapshot = await getDocs(appointmentsQuery);
      const appointmentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        appointmentDate: doc.data().appointmentDate,
        createdAt: doc.data().createdAt,
        updatedAt: doc.data().updatedAt
      })) as Appointment[];

      // 只顯示 scheduled 狀態
      setAppointments(appointmentsData.filter(item => item.status === "scheduled"));
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
      // 计算5分钟后的时间
      const fiveMinutesLater = new Date();
      fiveMinutesLater.setMinutes(fiveMinutesLater.getMinutes() + 5);
      
      const testAppointment = {
        email: memberData.email,
        trainerId: "trainer123",
        appointmentDate: Timestamp.fromDate(fiveMinutesLater),
        status: "scheduled" as const,
        remarks: "Test appointment (5 minutes later)",
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
        appointmentDate: Timestamp.fromDate(fiveMinutesLater),
        status: "scheduled",
        remarks: "Test appointment",
      };
      setAppointments(prevAppointments => [...prevAppointments, newAppointment]);
      
      // Create notification for the new appointment
      const notification = {
        email: memberData.email,
        title: "New Appointment Reminder",
        description: `You have successfully scheduled a training session for ${fiveMinutesLater.toLocaleString()}`,
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

  // 添加定时检查预约的函数
  const checkAndUpdateAppointments = async () => {
    console.log("checking appointments...");
    try {
      if (!user || !memberData) return;

      const now = Timestamp.now();
      const appointmentsQuery = query(
        collection(db, "appointments"),
        where("email", "==", memberData.email),
        where("status", "==", "scheduled")
      );

      const querySnapshot = await getDocs(appointmentsQuery);
      
      for (const doc of querySnapshot.docs) {
        const appointment = doc.data();
        
        // 创建训练记录
        const trainingRecord = {
          email: appointment.email,
          trainerId: appointment.trainerId,
          sessionDate: appointment.appointmentDate,
          status: 'completed',
          duration: 60, // 默认训练时长为60分钟
          createdAt: now,
          updatedAt: now
        };

        // 添加训练记录
        await addDoc(collection(db, "trainingRecords"), trainingRecord);

        // 更新预约状态为已完成
        await updateDoc(doc.ref, {
          status: "completed",
          updatedAt: now
        });

        // 创建通知
        const notification = {
          email: appointment.email,
          title: "Training Session Completed",
          description: `Your training session on ${appointment.appointmentDate.toDate().toLocaleString()} has been completed and recorded.`,
          date: now,
          type: "training",
          read: false,
          createdAt: now
        };

        await addDoc(collection(db, "notifications"), notification);
      }
    } catch (error) {
      console.error("Error checking appointments:", error);
    }
  };

  // 添加定时器
  useEffect(() => {
    // 立即执行一次检查
    checkAndUpdateAppointments();
    
    // 每分钟检查一次
    const interval = setInterval(checkAndUpdateAppointments, 60000);
    
    return () => clearInterval(interval);
  }, [user, memberData]);

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
