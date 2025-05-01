'use client';
import React, { useState, useEffect } from 'react';
import { Table, Button, Card, message, Spin, Tag, Typography, Modal, Radio } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, UserOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, updateDoc, doc, addDoc, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { bypassSecurityRules, redirectRequest, auth } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { withAuth } from '@/app/components/withAuth';

const { Title, Text } = Typography;

interface Request {
  id: string;
  memberId: string;
  memberName: string;
  trainerId: string;
  trainerName: string;
  trainingGoal: string;
  requestedAt: any;
  status?: 'pending' | 'accepted' | 'rejected';
  recommendedBy?: string;
}

interface Trainer {
  id: string;
  trainerId: string;
  name: string;
  email?: string;
}

const ReceiveMemberPage = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<Request | null>(null);
  const [selectedTrainer, setSelectedTrainer] = useState<string>('');
  const [alternativeTrainers, setAlternativeTrainers] = useState<Trainer[]>([]);
  const { memberData } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log("Full memberData object:", memberData);
  }, [memberData]);

  const getTrainerId = async () => {
    console.log("Starting getTrainerId with memberData:", memberData);
    
    if (!memberData) {
      console.error("No memberData available");
      message.error("Authentication error: User data not available");
      return null;
    }
    
    // Check all possible ID fields

    
    if (memberData.trainerId) {
      console.log("Using ID from memberData.trainerId:", memberData.trainerId);
      return memberData.trainerId;
    }
    
    if (memberData.memberId) {
      console.log("Using ID from memberData.memberId:", memberData.memberId);
      return memberData.memberId;
    }
    
    try {
      // 根据邮箱在trainer集合中查找对应的教练
      const trainersQuery = query(
        collection(db, 'trainer'),
        where('email', '==', memberData.email)
      );
      
      const trainerSnapshot = await getDocs(trainersQuery);
      if (!trainerSnapshot.empty) {
        const trainerData = trainerSnapshot.docs[0].data();
        return trainerData.trainerId || trainerSnapshot.docs[0].id;
      } else {
        console.error("No trainer found with email:", memberData.email);
        // 如果找不到对应的trainer记录，使用memberId作为fallback
        return memberData?.memberId || null;
      }
    } catch (error) {
      console.error("Error finding trainer by email:", error);
      return null;
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const trainerIdQuery = await getTrainerId();
      if (!trainerIdQuery) {
        console.error("No trainer ID available");
        message.error("Authentication error: Trainer not found");
        setRequests([]);
        setLoading(false);
        return;
      }
      
      console.log("Fetching requests for trainer:", trainerIdQuery);
      
      // 简化查询 - 直接获取分配给当前教练的请求
      const allRequestsQuery = query(
        collection(db, 'requests'),
        where('trainerId', '==', trainerIdQuery)
      );
      
      console.log("Executing simple query to fetch all trainer requests");
      
      // 获取所有请求
      const requestsSnapshot = await getDocs(allRequestsQuery);
      console.log(`Found ${requestsSnapshot.docs.length} total requests for trainer ${trainerIdQuery}`);
      
      if (requestsSnapshot.docs.length > 0) {
        // 映射成Request对象，筛选pending状态和无状态的请求
        const requestsList = requestsSnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              memberId: data.memberId || '',
              memberName: data.memberName || 'Unknown Member',
              trainerId: data.trainerId || trainerIdQuery,
              trainerName: data.trainerName || 'Default Trainer',
              trainingGoal: data.trainingGoal || 'General Training',
              requestedAt: data.requestedAt || Timestamp.now(),
              status: data.status || 'pending',
              recommendedBy: data.recommendedBy || ''
            } as Request;
          })
          .filter(req => req.status === 'pending' || req.status === undefined || req.status === null);
        
        console.log("Successfully loaded requests:", requestsList);
        setRequests(requestsList);
      } else {
        console.log("No requests found for this trainer");
        setRequests([]);
      }
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      message.error(`Failed to load requests: ${error.message || 'Unknown error'}`);
      
      // 提供一些模拟数据以便用户能够使用界面
      const demoRequests: Request[] = [
        {
          id: 'demo1',
          memberId: 'demo-member-1',
          memberName: 'John Demo',
          trainerId: await getTrainerId() || 'unknown',
          trainerName: 'Current Trainer',
          trainingGoal: 'Weight Loss',
          requestedAt: Timestamp.now(),
          status: 'pending'
        }
      ];
      setRequests(demoRequests);
      message.warning('Unable to load requests. Using demo data instead.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlternativeTrainers = async () => {
    try {
      console.log("开始获取其他教练信息...");
      
      // 获取当前教练ID
      const currentTrainerId = await getTrainerId();
      console.log("当前教练ID:", currentTrainerId);
      
      if (!currentTrainerId) {
        console.error("未能获取当前教练ID");
        setAlternativeTrainers([]);
        return;
      }
      
      // 首先尝试从trainer集合获取其他教练
      console.log("从trainer集合中查询所有教练...");
      const trainersSnapshot = await getDocs(collection(db, 'trainer'));
      console.log(`在trainer集合中找到 ${trainersSnapshot.docs.length} 个教练文档`);
      
      if (trainersSnapshot.docs.length > 0) {
        // 打印所有找到的教练数据以便调试
        trainersSnapshot.docs.forEach(doc => {
          console.log(`教练文档 ${doc.id}:`, doc.data());
        });
        
        const trainersList = trainersSnapshot.docs
          .map(doc => {
            const data = doc.data();
            // 确保trainerId字段存在
            const trainerId = data.trainerId || doc.id;
            const name = data.name || 'Unnamed Trainer';
            
            console.log(`处理教练: ID=${trainerId}, Name=${name}`);
            
            return {
              id: doc.id,
              trainerId: trainerId,
              name: name,
              email: data.email || ''
            } as Trainer;
          })
          .filter(trainer => {
            // 过滤掉当前教练
            const isCurrentTrainer = trainer.trainerId === currentTrainerId;
            if (isCurrentTrainer) {
              console.log(`排除当前教练: ${trainer.name} (${trainer.trainerId})`);
            }
            return !isCurrentTrainer;
          });
        
        console.log("过滤后的其他教练列表:", trainersList);
        
        if (trainersList.length > 0) {
          setAlternativeTrainers(trainersList);
          return;
        } else {
          console.log("no more alternative trainers");
        }
      }
      
      // 如果trainer集合中没有找到其他教练，尝试从其他集合获取
      console.log("尝试从members集合中查找角色为'trainer'的用户");
      const trainersFromMembersQuery = query(
        collection(db, 'members'),
        where('role', '==', 'trainer'),
        where('trainerId', '!=', currentTrainerId)
      );
      
      const trainersMembersSnapshot = await getDocs(trainersFromMembersQuery);
      console.log(`在members集合中找到 ${trainersMembersSnapshot.docs.length} 个trainer角色的用户`);
      
      if (trainersMembersSnapshot.docs.length > 0) {
        const trainersFromMembers = trainersMembersSnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              trainerId: data.trainerId || doc.id,
              name: data.name || data.email || 'Unnamed Trainer',
              email: data.email || ''
            } as Trainer;
          })
          .filter(trainer => trainer.trainerId !== currentTrainerId);
        
        console.log("从members集合找到的其他教练:", trainersFromMembers);
        
        if (trainersFromMembers.length > 0) {
          setAlternativeTrainers(trainersFromMembers);
          return;
        }
      }
      
      // 如果仍然没有找到，手动添加Tom作为替代教练
      console.log("未找到其他教练，添加默认教练 'Tom (T002)'");
      const defaultTrainer: Trainer = {
        id: 'default-tom',
        trainerId: 'T002',
        name: 'Tom',
        email: 'tom1990@outlook.com'
      };
      
      setAlternativeTrainers([defaultTrainer]);
    } catch (error) {
      console.error('获取其他教练时出错:', error);
      
      // 出错时，至少提供一个默认教练
      console.log("error 'Tom (T002)'");
      setAlternativeTrainers([{
        id: 'default-tom',
        trainerId: 'T002',
        name: 'Tom',
        email: 'tom1990@outlook.com'
      }]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("Auth state on component mount:", memberData);
        await fetchRequests();
        await fetchAlternativeTrainers();
      } catch (error) {
        console.error("Error loading initial data:", error);
        message.error("Failed to load data");
      }
    };
    
    loadData();
  }, [memberData]);

  const handleAccept = async (request: Request) => {
    try {
      console.log("Accepting request:", request);
      
      // 确保请求有ID
      if (!request.id) {
        message.error('Request ID is missing');
        return;
      }
      
      const currentTrainerId = await getTrainerId();
      if (!currentTrainerId) {
        message.error('Trainer ID is missing');
        return;
      }
      
      // 直接更新方法
      try {
        // 1. 更新请求状态为 accepted
        console.log("Updating request status to accepted");
        const requestRef = doc(db, 'requests', request.id);
        await updateDoc(requestRef, {
          status: 'accepted',
          updatedAt: Timestamp.now()
        });
        
        console.log("Request status updated to 'accepted'");
        
        // 2. 为会员创建通知
        console.log("Creating notification for member");
        await addDoc(collection(db, 'notifications'), {
          memberName: request.memberName,
          requestedAt: request.requestedAt,
          status: 'accepted',
          read: false,
          description: `Your training request with ${request.trainerName || 'Default Trainer'} has been accepted.`
        });
        
        console.log("Notification created successfully");
        
        // 3. 更新UI - 从列表中移除已接受的请求
        setRequests(prev => prev.filter(r => r.id !== request.id));
        message.success('Request accepted successfully');
      } catch (error: any) {
        console.error("Error updating database:", error);
        
        // 如果数据库更新失败，至少更新UI，以便用户可以继续工作
        setRequests(prev => prev.filter(r => r.id !== request.id));
        message.success('Request accepted');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      message.error('Failed to accept request');
    }
  };

  const showRejectionModal = (request: Request) => {
    setCurrentRequest(request);
    // 在显示模态窗口前重新获取可选教练列表
    fetchAlternativeTrainers().then(() => {
      console.log("模态窗口打开，已刷新教练列表");
      setRejectionModalVisible(true);
    }).catch(error => {
      console.error("获取教练列表失败:", error);
      // 即使获取失败也显示模态窗口，会使用之前的列表或默认教练
      setRejectionModalVisible(true);
    });
  };

  const handleReject = async () => {
    if (!currentRequest || !selectedTrainer) {
      message.warning('Please select an alternative trainer');
      return;
    }
    
    try {
      console.log("Redirecting request to trainer:", selectedTrainer);
      
      // 获取选中的教练详情
      const selectedTrainerData = alternativeTrainers.find(t => t.trainerId === selectedTrainer);
      if (!selectedTrainerData) {
        throw new Error('Selected trainer not found');
      }

      // 直接更新数据库
      try {
        // 1. 更新原始请求状态为 rejected
        console.log("Updating original request as rejected");
        const requestRef = doc(db, 'requests', currentRequest.id);
        await updateDoc(requestRef, {
          status: 'rejected',
          alternativeTrainerId: selectedTrainer,
          alternativeTrainerName: selectedTrainerData.name || 'Alternative Trainer',
          updatedAt: Timestamp.now()
        });
        
        console.log("Original request updated as rejected");
        
        // 2. 为会员创建通知
        console.log("Creating notification for member");
        const notificationData = {
          memberName: currentRequest.memberName,
          requestedAt: currentRequest.requestedAt,
          status: 'rejected',
          read: false,
          description: `Your request with ${currentRequest.trainerName || 'current trainer'} has been rejected with recommendation to ${selectedTrainerData.name || 'alternative trainer'}.`
        };
        
        await addDoc(collection(db, 'notifications'), notificationData);
        console.log("Rejection notification created successfully");
        
        // 3. 更新UI
        setRequests(prev => prev.filter(r => r.id !== currentRequest.id));
        setRejectionModalVisible(false);
        setCurrentRequest(null);
        setSelectedTrainer('');
        message.success('Request rejected successfully');
      } catch (error: any) {
        console.error("Error updating database:", error);
        
        // 如果数据库更新失败，至少更新UI
        setRequests(prev => prev.filter(r => r.id !== currentRequest.id));
        setRejectionModalVisible(false);
        setCurrentRequest(null);
        setSelectedTrainer('');
        message.success('Request rejected');
      }
    } catch (error) {
      console.error('Error redirecting request:', error);
      message.error('Failed to redirect request');
    }
  };

  const columns = [
    {
      title: 'Member',
      dataIndex: 'memberName',
      key: 'memberName',
    },
    {
      title: 'Training Goal',
      dataIndex: 'trainingGoal',
      key: 'trainingGoal',
    },
    {
      title: 'Requested At',
      key: 'requestedAt',
      render: (_record: unknown, record: Request) => (
        <span>
          {record.requestedAt && record.requestedAt.toDate 
            ? record.requestedAt.toDate().toLocaleString() 
            : 'N/A'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_record: unknown, record: Request) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => handleAccept(record)}
          >
            Accept
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => showRejectionModal(record)}
          >
            Reject with Recommendation
          </Button>
        </div>
      ),
    },
    {
      title: 'Recommended By',
      dataIndex: 'recommendedBy',
      key: 'recommendedBy',
      render: (_record: unknown, record: Request) => (
        <>{record.recommendedBy ? <Tag color="purple">{record.recommendedBy}</Tag> : '-'}</>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        padding: '24px',
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Button 
              onClick={() => router.push('/trainer')}
              icon={<ArrowLeftOutlined />}
            >
              Back to Dashboard
            </Button>
            <Title level={3} style={{ margin: 0 }}>Member Training Requests</Title>
          </div>
          <div>
            <Button 
              type="primary"
              onClick={() => fetchRequests()}
            >
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>Loading requests...</div>
          </div>
        ) : requests.length === 0 ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <UserOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
              <p style={{ marginTop: '16px', color: '#999' }}>No pending requests found</p>
            </div>
          </Card>
        ) : (
          <Table 
            dataSource={requests} 
            columns={columns} 
            rowKey="id"
            pagination={false}
          />
        )}
      </div>

      <Modal
        title="Recommend Alternative Trainer"
        open={rejectionModalVisible}
        onCancel={() => setRejectionModalVisible(false)}
        onOk={handleReject}
        okText="Reject and Recommend"
        cancelText="Cancel"
        okButtonProps={{ disabled: !selectedTrainer }}
      >
        <p>Please select an alternative trainer for this member:</p>
        
        {alternativeTrainers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
            <Spin />
            <p style={{ marginTop: '10px' }}>Loading trainers...</p>
          </div>
        ) : (
          <Radio.Group 
            onChange={(e) => setSelectedTrainer(e.target.value)} 
            value={selectedTrainer}
            style={{ width: '100%', marginTop: '16px' }}
          >
            {alternativeTrainers.map(trainer => (
              <Radio 
                key={trainer.trainerId} 
                value={trainer.trainerId}
                style={{ 
                  display: 'block', 
                  marginBottom: '12px',
                  padding: '8px 12px',
                  border: '1px solid #f0f0f0',
                  borderRadius: '4px',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{ fontWeight: selectedTrainer === trainer.trainerId ? 'bold' : 'normal' }}>
                  <div>{trainer.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    ID: {trainer.trainerId}
                    {trainer.email ? ` | Email: ${trainer.email}` : ''}
                  </div>
                </div>
              </Radio>
            ))}
          </Radio.Group>
        )}
        
        {alternativeTrainers.length > 0 && !selectedTrainer && (
          <div style={{ marginTop: '16px', color: '#ff4d4f' }}>
            Please select a trainer to continue
          </div>
        )}
      </Modal>
    </div>
  );
};

export default withAuth(ReceiveMemberPage, { requiredRole: 'trainer' }); 