"use client";

import { Table, Button, message, Spin, Tag } from "antd";
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useState, useEffect } from "react";
import { collection, getDocs, doc, query, where, Timestamp, updateDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { useRouter } from 'next/navigation';

interface Appointment {
  id: string;
  memberEmail: string;
  trainerId: string;
  trainerName: string;
  courseType: string;
  date: Timestamp;
  timeStart: string;
  timeEnd: string;
  status: 'scheduled' | 'cancelled' | 'completed';
  notes: string;
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
        where("memberEmail", "==", memberData.email),
        where("status", "==", "scheduled")
      );

      const querySnapshot = await getDocs(appointmentsQuery);
      const appointmentsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
      }) as Appointment[];

      // 只顯示 scheduled 狀態
      setAppointments(appointmentsData.filter(item => item.status === "scheduled"));
    } catch (error) {
      console.error("Error fetching appointments:", error);
      message.error("Failed to fetch appointment data.");
    } finally {
      setLoading(false);
    }
  };

  // const addTestAppointment = async () => {
  //   if (!memberData) {
  //     message.error('Please log in first.');
  //     return;
  //   }
    
  //   try {
  //     // 计算5分钟后的时间
  //     const fiveMinutesLater = new Date();
  //     fiveMinutesLater.setMinutes(fiveMinutesLater.getMinutes() + 5);
      
  //     const testAppointment = {
  //       memberEmail: memberData.email,
  //       memberName: memberData.name || 'Test Member',
  //       trainerId: "T001",
  //       trainerName: "Jiamu Li",
  //       courseType: "General Fitness",
  //       date: Timestamp.fromDate(fiveMinutesLater),
  //       timeStart: "11:00",
  //       timeEnd: "12:00",
  //       duration: 60,
  //       status: "scheduled" as const,
  //       notes: "Standard fitness routine including warm-up, cardio, and strength training",
  //       createdAt: Timestamp.now(),
  //       updatedAt: Timestamp.now()
  //     };

  //     // Add appointment
  //     const appointmentRef = await addDoc(collection(db, "appointments"), testAppointment);
      
  //     // 立即更新本地状态
  //     const newAppointment: Appointment = {
  //       id: appointmentRef.id,
  //       ...testAppointment
  //     };
  //     setAppointments(prevAppointments => [...prevAppointments, newAppointment]);
      
  //     // Create notification for the new appointment
  //     const notification = {
  //       email: memberData.email,
  //       title: "New Appointment Reminder",
  //       description: `You have successfully scheduled a ${testAppointment.courseType} training session with ${testAppointment.trainerName} for ${fiveMinutesLater.toLocaleDateString()} at ${testAppointment.timeStart}`,
  //       date: Timestamp.now(),
  //       type: "appointment",
  //       read: false,
  //       appointmentId: appointmentRef.id,
  //       trainerId: testAppointment.trainerId,
  //       createdAt: Timestamp.now()
  //     };

  //     // 使用 Firestore 存储通知
  //     await addDoc(collection(db, "notifications"), notification);
      
  //     message.success("Test appointment created.");
  //     // 强制刷新 Dashboard 页面
  //     router.refresh();
  //   } catch (error) {
  //     console.error("Error creating test appointment:", error);
  //     message.error("Failed to create test appointment.");
  //     // 如果发生错误，重新获取数据
  //     fetchAppointments();
  //   }
  // };

  const onCancelAppointment = async (record: Appointment) => {
    try {
      // 1. 更新appointment状态
      const appointmentRef = doc(db, "appointments", record.id);
      await updateDoc(appointmentRef, {
        status: "cancelled",
        updatedAt: Timestamp.now()
      });
      
      // 2. 查找并更新对应的training record
      const trainingRecordQuery = query(
        collection(db, "trainingRecords"),
        where("email", "==", record.memberEmail),
        where("sessionDate", "==", record.date)
      );
      
      const querySnapshot = await getDocs(trainingRecordQuery);
      if (!querySnapshot.empty) {
        const trainingRecordDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, "trainingRecords", trainingRecordDoc.id), {
          status: "cancelled",
          updatedAt: Timestamp.now()
        });
      }
      
      // 3. 立即更新本地状态
      setAppointments(prevAppointments => 
        prevAppointments.filter(appointment => appointment.id !== record.id)
      );
      
      // 4. 创建取消通知
      if (!memberData) {
        throw new Error('Member data is required');
      }

      const notification = {
        email: memberData.email,
        title: "Appointment Cancellation Notice",
        description: `You have cancelled the training session scheduled for ${record.date instanceof Timestamp 
          ? record.date.toDate().toLocaleString()
          : new Date(record.date).toLocaleString()}`,
        date: Timestamp.now(),
        type: "appointment",
        read: false,
        appointmentId: record.id,
        trainerId: record.trainerId,
        createdAt: Timestamp.now()
      };

      // 5. 存储通知
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

  // 添加自动检查和更新预约状态的函数
  const checkAndUpdateAppointments = async () => {
    if (!user || !memberData) return;

    try {
      const now = new Date();
      const appointmentQuery = query(
        collection(db, "appointments"),
        where("memberEmail", "==", memberData.email),
        where("status", "==", "scheduled")
      );

      const querySnapshot = await getDocs(appointmentQuery);
      
      for (const docSnapshot of querySnapshot.docs) {
        const appointment = docSnapshot.data();
        const appointmentDate = appointment.date;
        const appointmentEndTime = appointment.timeEnd;

        if (appointmentDate instanceof Timestamp) {
          const appointmentDateTime = appointmentDate.toDate();
          const [hours, minutes] = appointmentEndTime.split(':').map(Number);
          appointmentDateTime.setHours(hours, minutes, 0, 0);

          // 如果预约结束时间已过，且状态仍为 scheduled
          if (appointmentDateTime < now) {
            // 更新预约状态为已完成
            await updateDoc(docSnapshot.ref, {
              status: 'completed',
              updatedAt: Timestamp.now()
            });

            // 创建通知
            const notification = {
              email: appointment.memberEmail,
              title: "Training Session Completed",
              description: `Your ${appointment.courseType} training session with ${appointment.trainerName} has been completed.`,
              date: Timestamp.now(),
              type: "training",
              read: false,
              appointmentId: docSnapshot.id,
              trainerId: appointment.trainerId,
              createdAt: Timestamp.now()
            };

            await addDoc(collection(db, "notifications"), notification);

            // 更新本地状态
            setAppointments(prevAppointments => 
              prevAppointments.filter(apt => apt.id !== docSnapshot.id)
            );
          }
        }
      }
    } catch (error) {
      console.error("Error checking and updating appointments:", error);
    }
  };

  // 添加定时检查
  useEffect(() => {
    if (!user || !memberData) return;

    // 立即执行一次检查
    checkAndUpdateAppointments();

    // 设置定时器，每分钟检查一次
    const interval = setInterval(checkAndUpdateAppointments, 60000);

    return () => {
      clearInterval(interval);
    };
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
      title: "Course Type",
      dataIndex: "courseType",
      key: "courseType",
      render: (courseType: string) => (
        <Tag color="blue">{courseType}</Tag>
      )
    },
    { 
      title: "Appointment Time",
      key: "appointmentTime",
      render: (_: any, record: Appointment) => {
        const dateStr = record.date instanceof Timestamp 
          ? record.date.toDate().toLocaleDateString('en-US')
          : new Date(record.date).toLocaleDateString('en-US');
        
        return (
          <div>
            <div>{record.timeStart} - {record.timeEnd}</div>
            <div style={{ color: '#666', fontSize: '12px' }}>
              {dateStr}
            </div>
          </div>
        );
      }
    },
    { 
      title: "Trainer",
      dataIndex: "trainerName",
      key: "trainerName",
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
      title: "Exercise Details",
      dataIndex: "notes",
      key: "notes",
      ellipsis: true,
      render: (notes: string) => (
        <div style={{ 
          maxWidth: '300px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}>
          {notes || '-'}
        </div>
      )
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
