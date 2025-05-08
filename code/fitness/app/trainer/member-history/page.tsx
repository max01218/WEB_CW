'use client';
import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Progress, message, Spin, Tag, Typography, Select, DatePicker } from 'antd';
import { ArrowLeftOutlined, HistoryOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, Timestamp, getDoc, doc, orderBy, DocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { withAuth } from '@/app/components/withAuth';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

interface TrainingRecord {
  id: string;
  memberEmail: string;
  memberName: string;
  trainerId: string;
  trainerName: string;
  courseType: string;
  date: Date;
  timeStart: string;
  timeEnd: string;
  duration: number;
  status: string;
  notes: string;
}

interface Member {
  id: string;
  email: string;
  name: string;
}

interface CourseProgress {
  courseType: string;
  completedSessions: number;
  totalSessionsRequired: number;
  progressPercentage: number;
}

const MemberHistoryPage = () => {
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [courseProgress, setCourseProgress] = useState<Record<string, CourseProgress>>({});
  const [loading, setLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [dateRange, setDateRange] = useState<[any, any]>([null, null]);
  const { memberData } = useAuth();
  const router = useRouter();

  const getTrainerId = async () => {
    if (!memberData) {
      console.error("No memberData available");
      message.error("Authentication error: User data not available");
      return null;
    }

    // Prioritize trainerId from memberData, if not available try to query from trainer collection
    if (memberData.trainerId) {
      console.log("Using trainerId from memberData:", memberData.trainerId);
      return memberData.trainerId;
    }

    // If no trainerId in memberData, try to query from trainer collection
    try {
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
        // If still not found, use memberId as fallback
        return memberData?.memberId || null;
      }
    } catch (error) {
      console.error("Error finding trainer by email:", error);
      return null;
    }
  };

  // Fetch all accepted members for this trainer and their training history
  const fetchAcceptedMembers = async () => {
    if (!memberData) return;
    
    try {
      setLoading(true);
      let trainerIdQuery = await getTrainerId();
      console.log("Fetching accepted members for trainer:", trainerIdQuery);
      
      // Get all accepted requests for this trainer from the requests collection
      const acceptedRequestsQuery = query(
        collection(db, 'requests'),
        where('trainerId', '==', trainerIdQuery),
        where('status', '==', 'accepted')
      );
      
      const acceptedRequestsSnapshot = await getDocs(acceptedRequestsQuery);
      console.log(`Found ${acceptedRequestsSnapshot.docs.length} accepted requests`);
      
      // Store all members in this map
      const membersMap = new Map<string, Member>();
      const allTrainingRecords: TrainingRecord[] = [];
      
      // Process each accepted request to get member details
      for (const requestDoc of acceptedRequestsSnapshot.docs) {
        const requestData = requestDoc.data();
        if (requestData.memberId) {
          try {
            // Get member details from members collection
            const memberDoc = await getDoc(doc(db, 'members', requestData.memberId));
            if (memberDoc.exists()) {
              const memberData = memberDoc.data();
              const memberEmail = memberData.email || requestData.memberEmail;
              
              membersMap.set(requestData.memberId, {
                id: requestData.memberId,
                email: memberEmail,
                name: memberData.name || requestData.memberName
              });
              
              // Fetch training records for this member
              if (memberEmail) {
                // Use simpler query that doesn't require complex index
                const memberAppointmentsQuery = query(
                  collection(db, 'appointments'),
                  where('trainerId', '==', trainerIdQuery),
                  where('memberEmail', '==', memberEmail)
                );
                
                const appointmentsSnapshot = await getDocs(memberAppointmentsQuery);
                console.log(`Found ${appointmentsSnapshot.docs.length} appointments for member ${memberEmail}`);
                
                // Process appointments into training records
                appointmentsSnapshot.docs.forEach(doc => {
                  const data = doc.data();
                  const appointmentDate = data.date?.toDate ? data.date.toDate() : new Date();
                  let status = data.status || 'pending';
                  
                  // If date has passed and status is still scheduled, treat it as completed
                  if (appointmentDate < new Date() && status === 'scheduled') {
                    status = 'completed';
                  }
                  
                  allTrainingRecords.push({
                    id: doc.id,
                    memberEmail: memberEmail,
                    memberName: memberData.name || requestData.memberName || 'Unknown Member',
                    trainerId: trainerIdQuery,
                    trainerName: memberData?.name || 'Current Trainer',
                    date: appointmentDate,
                    timeStart: data.timeStart || '00:00',
                    timeEnd: data.timeEnd || '00:00',
                    duration: data.duration || 0,
                    status: status,
                    courseType: data.courseType || 'General Training',
                    notes: data.notes || ''
                  });
                });
              }
            }
          } catch (error) {
            console.error('Error fetching member details:', error);
          }
        }
      }
      
      // Sort all training records by date (newest first)
      allTrainingRecords.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      console.log(`Successfully loaded ${membersMap.size} accepted member details and ${allTrainingRecords.length} training records`);
      setMembers(Array.from(membersMap.values()));
      setTrainingRecords(allTrainingRecords);
      calculateCourseProgress(allTrainingRecords);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching accepted members:', error);
      message.error('Failed to load accepted members');
      setLoading(false);
    }
  };

  // Fetch training records for a specific member
  const fetchMemberTrainingRecords = async (memberId: string) => {
    if (!memberData) {
      console.error('No memberData, cannot fetch training records.');
      setTrainingRecords([]);
      setCourseProgress({});
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Prioritize trainerId from memberData, if not available try to query from trainer collection
      let trainerIdQuery = await getTrainerId();

      console.log("Fetching training records for trainer:", trainerIdQuery, `member: ${memberId}`);
      
      // Get member's email first
      const memberDoc = await getDoc(doc(db, 'members', memberId));
      if (!memberDoc.exists()) {
        throw new Error('Member not found');
      }
      
      const memberEmail = memberDoc.data().email;
      
      // Get all appointments for this specific member with this trainer
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('trainerId', '==', trainerIdQuery),
        where('memberEmail', '==', memberEmail)
      );
      
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      console.log(`Found ${appointmentsSnapshot.docs.length} appointments for member ${memberId}`);
      
      const records = await Promise.all(appointmentsSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const appointmentDate = data.date?.toDate ? data.date.toDate() : new Date();
        let status = data.status || 'pending';
        
        // If date has passed and status is still scheduled, treat it as completed
        if (appointmentDate < new Date() && status === 'scheduled') {
          status = 'completed';
        }
        
        return {
          id: doc.id,
          memberEmail: data.memberEmail || 'Unknown Email',
          memberName: memberDoc.data().name || 'Unknown Member',
          trainerId: trainerIdQuery,
          trainerName: memberData?.name || 'Current Trainer',
          date: appointmentDate,
          timeStart: data.timeStart || '00:00',
          timeEnd: data.timeEnd || '00:00',
          duration: data.duration || 0,
          status: status,
          courseType: data.courseType || 'General Training',
          notes: data.notes || ''
        } as TrainingRecord;
      }));
      
      // Sort records by date descending
      records.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      console.log(`Successfully processed ${records.length} training records`);
      setTrainingRecords(records);
      calculateCourseProgress(records);
    } catch (error) {
      console.error('Error fetching training records:', error);
      message.error('Failed to load training records');
      setTrainingRecords([]);
      setCourseProgress({});
    } finally {
      setLoading(false);
    }
  };

  const calculateCourseProgress = (records: TrainingRecord[]) => {
    try {
      // Filter out records with missing courseType
      const validRecords = records.filter(record => record.courseType);
      console.log(`Calculating progress for ${validRecords.length} valid records`);
      
      const courseGroups = validRecords.reduce<Record<string, TrainingRecord[]>>((acc, record) => {
        try {
          const { courseType } = record;
          if (!courseType) return acc;
          
          if (!acc[courseType]) {
            acc[courseType] = [];
          }
          
          if (record.status === 'completed') {
            acc[courseType].push(record);
          }
          return acc;
        } catch (error) {
          console.error("Error processing record for course progress:", error, record);
          return acc;
        }
      }, {});
      
      const progress: Record<string, CourseProgress> = {};
      for (const [courseType, courseRecords] of Object.entries(courseGroups)) {
        const totalSessionsRequired = 10;
        const completedSessions = courseRecords.length;
        const progressPercentage = Math.min(Math.round((completedSessions / totalSessionsRequired) * 100), 100);
        
        progress[courseType] = {
          courseType,
          completedSessions,
          totalSessionsRequired,
          progressPercentage
        };
      }
      
      console.log("Course progress calculated:", progress);
      setCourseProgress(progress);
    } catch (error) {
      console.error("Error calculating course progress:", error);
      setCourseProgress({});
    }
  };

  useEffect(() => {
    // Use fetchAcceptedMembers to get all accepted members and their training history
    fetchAcceptedMembers();
  }, [memberData]);

  useEffect(() => {
    if (selectedMember) {
      fetchMemberTrainingRecords(selectedMember);
    }
  }, [selectedMember]);

  const handleMemberChange = (value: string) => {
    setSelectedMember(value);
  };

  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
  };

  const resetFilters = () => {
    setSelectedMember('');
    setDateRange([null, null]);
    // Fetch all members' training history again
    fetchAcceptedMembers();
  };

  const progressColumns = [
    {
      title: 'Course Type',
      dataIndex: 'courseType',
      key: 'courseType',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_: any, record: CourseProgress) => (
        <div>
          <Progress 
            percent={record.progressPercentage} 
            status={record.progressPercentage === 100 ? 'success' : 'active'} 
          />
          <Text>{record.completedSessions} / {record.totalSessionsRequired} sessions completed</Text>
        </div>
      ),
    },
  ];

  const recordColumns = [
    {
      title: 'Member',
      key: 'member',
      render: (_: any, record: TrainingRecord) => (
        <div>
          <div>{record.memberName}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.memberEmail}</Text>
        </div>
      ),
    },
    {
      title: 'Course Type',
      dataIndex: 'courseType',
      key: 'courseType',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Session Date',
      key: 'sessionDate',
      render: (_: any, record: TrainingRecord) => (
        <div>
          <div>
            {record.date.toLocaleDateString()}
          </div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.timeStart} - {record.timeEnd}
          </Text>
        </div>
      ),
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_: any, record: TrainingRecord) => (
        <span>{record.duration} minutes</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'completed') color = 'success';
        if (status === 'cancelled') color = 'error';
        if (status === 'pending') color = 'warning';
        
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
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
            <Title level={3} style={{ margin: 0 }}>Training History</Title>
          </div>
        </div>

        <Card style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
            <div>
              <Text strong>Member:</Text>
              <Select
                placeholder="Select a member"
                style={{ width: 200, marginLeft: '8px' }}
                value={selectedMember || undefined}
                onChange={handleMemberChange}
                allowClear
              >
                {members.map(member => (
                  <Option key={member.id} value={member.id}>
                    {member.name}
                  </Option>
                ))}
              </Select>
            </div>
            <div>
              <Text strong>Date Range:</Text>
              <DatePicker.RangePicker 
                style={{ marginLeft: '8px' }}
                value={dateRange}
                onChange={handleDateRangeChange}
              />
            </div>
            <Button onClick={resetFilters}>Reset Filters</Button>
          </div>
        </Card>

        {selectedMember && Object.keys(courseProgress).length > 0 && (
          <Card title="Course Progress" style={{ marginBottom: '24px' }}>
            <Table 
              dataSource={Object.values(courseProgress)} 
              columns={progressColumns}
              rowKey="courseType"
              pagination={false}
            />
          </Card>
        )}

        <Card title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <HistoryOutlined style={{ marginRight: '8px' }} />
            <span>Training Records</span>
          </div>
        }>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
              <div style={{ marginTop: '16px' }}>Loading records...</div>
            </div>
          ) : (
            <Table 
              dataSource={trainingRecords} 
              columns={recordColumns}
              rowKey="id"
              pagination={{
                defaultPageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
                showTotal: (total) => `Total ${total} records`,
              }}
              locale={{ emptyText: 'No training records found' }}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default withAuth(MemberHistoryPage, { requiredRole: 'trainer' }); 