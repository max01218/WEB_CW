'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { List, Button, Tag, Typography, message, Spin } from 'antd';
import { LogoutOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { collection, query, getDocs, doc, updateDoc, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';

const { Title } = Typography;

interface Member {
  id: string;
  name: string;
  email: string;
  status: string;
  [key: string]: any;
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
        where('status', '==', 'pending')
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

  const handleStatusUpdate = async (memberId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'members', memberId), {
        status: newStatus,
      });
      message.success(newStatus === 'approved' ? 'Application approved' : 'Application rejected');
      fetchMembers(); // Refresh the list
    } catch (error) {
      console.error('Error updating status:', error);
      message.error('Failed to update application status');
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
      
      <Title level={2} style={{ marginBottom: '24px' }}>Member Applications</Title>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={members}
          renderItem={(member: Member) => (
            <List.Item
              actions={[
                <Button
                  key="approve"
                  type="text"
                  icon={<CheckCircleOutlined />}
                  style={{ color: '#52c41a' }}
                  onClick={() => handleStatusUpdate(member.id, 'approved')}
                >
                  Approve
                </Button>,
                <Button
                  key="reject"
                  type="text"
                  icon={<CloseCircleOutlined />}
                  danger
                  onClick={() => handleStatusUpdate(member.id, 'rejected')}
                >
                  Reject
                </Button>
              ]}
            >
              <List.Item.Meta
                title={member.name}
                description={member.email}
              />
              <Tag color={
                member.status === 'approved' ? 'success' :
                member.status === 'rejected' ? 'error' :
                'processing'
              }>
                {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
              </Tag>
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default AdminDashboard; 