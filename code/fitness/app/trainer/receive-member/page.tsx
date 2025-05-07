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
      // Find the corresponding trainer in the trainer collection based on email
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
        // If no corresponding trainer record is found, use memberId as fallback
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
      
      // Simplify query - directly get requests assigned to current trainer
      const allRequestsQuery = query(
        collection(db, 'requests'),
        where('trainerId', '==', trainerIdQuery)
      );
      
      console.log("Executing simple query to fetch all trainer requests");
      
      // Get all requests
      const requestsSnapshot = await getDocs(allRequestsQuery);
      console.log(`Found ${requestsSnapshot.docs.length} total requests for trainer ${trainerIdQuery}`);
      
      if (requestsSnapshot.docs.length > 0) {
        // Map to Request objects, filter pending status and undefined status requests
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
      
      // Provide some demo data so users can use the interface
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
      console.log("Starting to fetch other trainer information...");
      
      // Get current trainer ID
      const currentTrainerId = await getTrainerId();
      console.log("Current trainer ID:", currentTrainerId);
      
      if (!currentTrainerId) {
        console.error("Failed to get current trainer ID");
        setAlternativeTrainers([]);
        return;
      }
      
      // First try to get other trainers from the trainer collection
      console.log("Querying all trainers from trainer collection...");
      const trainersSnapshot = await getDocs(collection(db, 'trainer'));
      console.log(`Found ${trainersSnapshot.docs.length} trainer documents in trainer collection`);
      
      if (trainersSnapshot.docs.length > 0) {
        // Print all found trainer data for debugging
        trainersSnapshot.docs.forEach(doc => {
          console.log(`Trainer document ${doc.id}:`, doc.data());
        });
        
        const trainersList = trainersSnapshot.docs
          .map(doc => {
            const data = doc.data();
            // Ensure trainerId field exists
            const trainerId = data.trainerId || doc.id;
            const name = data.name || 'Unnamed Trainer';
            
            console.log(`Processing trainer: ID=${trainerId}, Name=${name}`);
            
            return {
              id: doc.id,
              trainerId: trainerId,
              name: name,
              email: data.email || ''
            } as Trainer;
          })
          .filter(trainer => {
            // Filter out current trainer
            const isCurrentTrainer = trainer.trainerId === currentTrainerId;
            if (isCurrentTrainer) {
              console.log(`Excluding current trainer: ${trainer.name} (${trainer.trainerId})`);
            }
            return !isCurrentTrainer;
          });
        
        console.log("Filtered list of other trainers:", trainersList);
        
        if (trainersList.length > 0) {
          setAlternativeTrainers(trainersList);
          return;
        } else {
          console.log("no more alternative trainers");
        }
      }
      
      // If no other trainers found in trainer collection, try to get from other collections
      console.log("Trying to find users with role 'trainer' from members collection");
      const trainersFromMembersQuery = query(
        collection(db, 'members'),
        where('role', '==', 'trainer'),
        where('trainerId', '!=', currentTrainerId)
      );
      
      const trainersMembersSnapshot = await getDocs(trainersFromMembersQuery);
      console.log(`Found ${trainersMembersSnapshot.docs.length} users with trainer role in members collection`);
      
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
        
        console.log("Other trainers found from members collection:", trainersFromMembers);
        
        if (trainersFromMembers.length > 0) {
          setAlternativeTrainers(trainersFromMembers);
          return;
        }
      }
      
      // If still no other trainers found, manually add Tom as alternative trainer
      console.log("No other trainers found, adding default trainer 'Tom (T002)'");
      const defaultTrainer: Trainer = {
        id: 'default-tom',
        trainerId: 'T002',
        name: 'Tom',
        email: 'tom1990@outlook.com'
      };
      
      setAlternativeTrainers([defaultTrainer]);
    } catch (error) {
      console.error('Error fetching other trainers:', error);
      
      // Provide a default trainer in case of error
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
      
      // Ensure request has ID
      if (!request.id) {
        message.error('Request ID is missing');
        return;
      }
      
      const currentTrainerId = await getTrainerId();
      if (!currentTrainerId) {
        message.error('Trainer ID is missing');
        return;
      }
      
      // Direct update method
      try {
        // 1. Update request status to accepted
        console.log("Updating request status to accepted");
        const requestRef = doc(db, 'requests', request.id);
        await updateDoc(requestRef, {
          status: 'accepted',
          updatedAt: Timestamp.now()
        });
        
        console.log("Request status updated to 'accepted'");
        
        // 2. Create notification for member
        console.log("Creating notification for member");
        await addDoc(collection(db, 'notifications'), {
          email: request.memberName,
          requestedAt: request.requestedAt,
          status: 'accepted',
          read: false,
          description: `Your training request with ${request.trainerName || 'Default Trainer'} has been accepted.`
        });
        
        console.log("Notification created successfully");
        
        // 3. Update UI - Remove accepted request from list
        setRequests(prev => prev.filter(r => r.id !== request.id));
        message.success('Request accepted successfully');
      } catch (error: any) {
        console.error("Error updating database:", error);
        
        // If database update fails, at least update UI, so users can continue working
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
    // Before showing modal, refresh list of available trainers
    fetchAlternativeTrainers().then(() => {
      console.log("Modal opened, trainers list refreshed");
      setRejectionModalVisible(true);
    }).catch(error => {
      console.error("Error getting trainers list:", error);
      // Even if getting fails, show modal, will use previous list or default trainer
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
      
      // Get selected trainer details
      const selectedTrainerData = alternativeTrainers.find(t => t.trainerId === selectedTrainer);
      if (!selectedTrainerData) {
        throw new Error('Selected trainer not found');
      }

      // Direct update to database
      try {
        // 1. Update original request status to rejected
        console.log("Updating original request as rejected");
        const requestRef = doc(db, 'requests', currentRequest.id);
        await updateDoc(requestRef, {
          status: 'rejected',
          alternativeTrainerId: selectedTrainer,
          alternativeTrainerName: selectedTrainerData.name || 'Alternative Trainer',
          updatedAt: Timestamp.now()
        });
        
        console.log("Original request updated as rejected");
        
        // 2. Create notification for member
        console.log("Creating notification for member");
        const notificationData = {
          email: currentRequest.memberName,
          requestedAt: currentRequest.requestedAt,
          status: 'rejected',
          read: false,
          description: `Your request with ${currentRequest.trainerName || 'current trainer'} has been rejected with recommendation to ${selectedTrainerData.name || 'alternative trainer'}.`
        };
        
        await addDoc(collection(db, 'notifications'), notificationData);
        console.log("Rejection notification created successfully");
        
        // 3. Update UI
        setRequests(prev => prev.filter(r => r.id !== currentRequest.id));
        setRejectionModalVisible(false);
        setCurrentRequest(null);
        setSelectedTrainer('');
        message.success('Request rejected successfully');
      } catch (error: any) {
        console.error("Error updating database:", error);
        
        // If database update fails, at least update UI
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