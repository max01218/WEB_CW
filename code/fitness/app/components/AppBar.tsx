import { Layout, Button, Avatar, Space } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import NotificationPopover from './NotificationPopover';

const { Header } = Layout;

export default function AppBar() {
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

  return (
    <Header style={{ 
      background: '#fff', 
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: '16px'
      }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>健身管理系统</h1>
      </div>
      
      <Space size="middle">
        {user && memberData && (
          <>
            <NotificationPopover />
            <Space>
              <Avatar 
                icon={<UserOutlined />} 
                style={{ 
                  backgroundColor: '#1890ff',
                  cursor: 'pointer'
                }}
              />
              <span>{memberData.name}</span>
            </Space>
            <Button 
              type="text" 
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              登出
            </Button>
          </>
        )}
      </Space>
    </Header>
  );
} 