'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { List, Button, Tag, Typography, message, Spin, Card } from 'antd';
import { LogoutOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { collection, query, getDocs, doc, updateDoc, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface Member {
  id: string;
  name: string;
  email: string;
  birthdate: string;
  appointmentStatus: boolean;
  role: string;
}

const AdminDashboard = () => {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
    position: 'relative' as const,
  };

  const logoutButtonStyle = {
    position: 'absolute' as const,
    top: '24px',
    right: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/home');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const membersQuery = query(
        collection(db, 'members'),
        where('role', '==', 'member'),
        where('appointmentStatus', '==', false)
      );
      const querySnapshot = await getDocs(membersQuery);
      const membersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Member[];
      setMembers(membersData);
    } catch (error) {
      console.error('Error fetching members:', error);
      message.error('Failed to load member applications');
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentUpdate = async (memberId: string, approved: boolean) => {
    try {
      await updateDoc(doc(db, 'members', memberId), {
        appointmentStatus: approved,
      });
      message.success(approved ? 'Appointment approved' : 'Appointment rejected');
      fetchMembers(); // 刷新列表
    } catch (error) {
      console.error('Error updating appointment status:', error);
      message.error('Failed to update appointment status');
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  return (
    <div style={containerStyle}>
      <Button 
        type="text" 
        icon={<LogoutOutlined />} 
        onClick={handleLogout}
        style={logoutButtonStyle}
        danger
      >
        Logout
      </Button>
      
      <Title level={2} style={{ marginBottom: '24px' }}>Appointment Applications</Title>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <List
          grid={{ gutter: 16, column: 2 }}
          dataSource={members}
          renderItem={(member: Member) => (
            <List.Item>
              <Card>
                <div style={{ marginBottom: '16px' }}>
                  <Title level={4}>{member.name}</Title>
                  <Text type="secondary">Email: {member.email}</Text>
                  <br />
                  <Text type="secondary">
                    Birth Date: {dayjs(member.birthdate).format('YYYY-MM-DD')}
                  </Text>
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleAppointmentUpdate(member.id, true)}
                    style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                  >
                    Approve
                  </Button>
                  <Button
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={() => handleAppointmentUpdate(member.id, false)}
                  >
                    Reject
                  </Button>
                </div>
              </Card>
            </List.Item>
          )}
          locale={{ emptyText: 'No pending appointments' }}
        />
      )}
    </div>
  );
};

export default AdminDashboard; 