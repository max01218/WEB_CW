'use client';
import { useState, useEffect } from 'react';
import { Form, Input, Button, message, Card, DatePicker } from 'antd';
import { UserOutlined, MailOutlined, CalendarOutlined, HomeOutlined } from '@ant-design/icons';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { withAuth } from '@/app/components/withAuth';
import { useAuth } from '@/lib/auth';
import dayjs from 'dayjs';

const ProfilePage = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { user, memberData } = useAuth();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !memberData) return;
      
      form.setFieldsValue({
        name: memberData.name,
        email: memberData.email,
        birthday: memberData.birthdate ? dayjs(memberData.birthdate) : null,
        address: memberData.address || '',
      });
    };
    
    fetchUserData();
  }, [form, user, memberData]);

  const handleSubmit = async (values: any) => {
    if (!user) {
      message.error('Please login first');
      return;
    }

    try {
      setLoading(true);
      
      const updateData = {
        name: values.name,
        birthday: values.birthday ? values.birthday.toDate() : null,
        address: values.address || '',
        updatedAt: new Date()
      };

      await updateDoc(doc(db, 'members', user.uid), updateData);
      message.success('Profile updated successfully!');
      router.push('/member/dashboard');
    } catch (error: any) {
      message.error('Update failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/member/dashboard');
  };

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '40px auto', 
      padding: '0 20px',
      minHeight: 'calc(100vh - 80px)'
    }}>
      <Card 
        title="Edit Profile" 
        bordered={false}
        className="profile-card"
        style={{
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ remember: true }}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter your name!' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Name"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
          >
            <Input 
              prefix={<MailOutlined />} 
              disabled 
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="birthday"
            label="Birthday"
          >
            <DatePicker 
              style={{ width: '100%' }}
              size="large"
              placeholder="Select birthday"
              format="YYYY-MM-DD"
              prefix={<CalendarOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true, message: 'Please enter your address!' }]}
          >
            <Input.TextArea 
              placeholder="Enter your address"
              size="large"
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
          </Form.Item>

          <Form.Item>
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              justifyContent: 'flex-end' 
            }}>
              <Button 
                onClick={handleCancel}
                size="large"
              >
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                size="large"
              >
                Save Changes
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default withAuth(ProfilePage, { requiredRole: 'member' }); 