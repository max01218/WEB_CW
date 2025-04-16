import { Popover, Badge, List, Button, Typography, Spin } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';

const { Text } = Typography;

interface Notification {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'appointment' | 'training' | 'system';
  read: boolean;
}

export default function NotificationPopover() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { memberData } = useAuth();

  useEffect(() => {
    if (!memberData?.email) return;

    const notificationsRef = ref(database, `notifications/${memberData.email}`);
    
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const notificationsList = Object.entries(data).map(([id, notification]: [string, any]) => ({
          id,
          ...notification,
        }));
        setNotifications(notificationsList.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ));
      } else {
        setNotifications([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [memberData?.email]);

  const markAsRead = async (notificationId: string) => {
    if (!memberData?.email) return;

    try {
      const notificationRef = ref(database, `notifications/${memberData.email}/${notificationId}`);
      await update(notificationRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return '📅';
      case 'training':
        return '💪';
      case 'system':
        return '🔔';
      default:
        return '📌';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'appointment':
        return '#1890ff';
      case 'training':
        return '#52c41a';
      case 'system':
        return '#faad14';
      default:
        return '#666';
    }
  };

  const content = (
    <div style={{ width: 300, maxHeight: 400, overflow: 'auto' }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin />
        </div>
      ) : notifications.length > 0 ? (
        <List
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item
              style={{
                padding: '12px',
                borderBottom: '1px solid #f0f0f0',
                backgroundColor: item.read ? 'transparent' : '#f6ffed',
                transition: 'all 0.3s'
              }}
            >
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>{getNotificationIcon(item.type)}</span>
                    <Text strong>{item.title}</Text>
                  </div>
                  {!item.read && (
                    <Button
                      type="text"
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={() => markAsRead(item.id)}
                    >
                      标记已读
                    </Button>
                  )}
                </div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {new Date(item.date).toLocaleString()}
                </Text>
                <div style={{ marginTop: '4px' }}>
                  <Text>{item.description}</Text>
                </div>
              </div>
            </List.Item>
          )}
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          暂无通知
        </div>
      )}
    </div>
  );

  return (
    <Popover
      content={content}
      title="通知中心"
      trigger="click"
      placement="bottomRight"
      overlayStyle={{ width: 300 }}
    >
      <Badge count={notifications.filter(n => !n.read).length} offset={[-2, 2]}>
        <Button
          type="text"
          icon={<BellOutlined style={{ fontSize: '20px' }} />}
          style={{ marginLeft: '8px' }}
        />
      </Badge>
    </Popover>
  );
} 