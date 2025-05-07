'use client';
import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Progress, message, Spin, Tag, Typography, Select, DatePicker } from 'antd';
import { ArrowLeftOutlined, HistoryOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, Timestamp, getDoc, doc, orderBy } from 'firebase/firestore';
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
  const [loading, setLoading] = useState(true);
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

  const fetchMembers = async () => {
    if (!memberData) return;
    
    try {
<<<<<<< HEAD
      // Prioritize using trainerId from memberData, if not available try to query from trainer collection
      let trainerIdQuery = memberData.trainerId;

      // If there's no trainerId in memberData, try to query from trainer collection
      if (!trainerIdQuery) {
        const trainersQuery = query(
          collection(db, 'trainer'),
          where('email', '==', memberData.email)
        );
        
        const trainerSnapshot = await getDocs(trainersQuery);
        if (!trainerSnapshot.empty) {
          const trainerData = trainerSnapshot.docs[0].data();
          trainerIdQuery = trainerData.trainerId || trainerSnapshot.docs[0].id;
        } else {
          // If still not found, use memberId as fallback
          console.warn("No trainer found, using memberId as fallback");
          trainerIdQuery = memberData.memberId;
        }
      }
      
=======
      // Prioritize trainerId from memberData, if not available try to query from trainer collection
      let trainerIdQuery = await getTrainerId();

>>>>>>> 0227ff521ac7718de42c3e71b8e80bf151c87189
      console.log("Current trainer ID:", trainerIdQuery);
      
      // Store all members in this map
      const membersMap = new Map<string, Member>();
      
      // Get all appointments for this trainer
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('trainerId', '==', trainerIdQuery)
      );
      
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      console.log(`Found ${appointmentsSnapshot.docs.length} appointments`);
      
      // Get unique member emails from appointments
      const memberEmails = new Set<string>();
      appointmentsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.memberEmail) {
          memberEmails.add(data.memberEmail);
        }
      });
      
      console.log(`Found ${memberEmails.size} unique member emails`);
      
      // Get member details for each email
      for (const email of memberEmails) {
        const memberQuery = query(
          collection(db, 'members'),
          where('email', '==', email)
        );
        
        const memberSnapshot = await getDocs(memberQuery);
        if (!memberSnapshot.empty) {
          const memberDoc = memberSnapshot.docs[0];
          const memberData = memberDoc.data() as Member;
          membersMap.set(email, {
            ...memberData,
            id: memberDoc.id
          });
        }
      }
      
      console.log(`Successfully loaded ${membersMap.size} member details`);
      setMembers(Array.from(membersMap.values()));
    } catch (error) {
      console.error('Error fetching members:', error);
      message.error('Failed to load members');
    }
  };

  const fetchTrainingRecords = async (memberId: string) => {
    if (!memberData) return;
    
    try {
<<<<<<< HEAD
      // Prioritize using trainerId from memberData, if not available try to query from trainer collection
      let trainerIdQuery = memberData.trainerId;

      // If there's no trainerId in memberData, try to query from trainer collection
      if (!trainerIdQuery) {
        const trainersQuery = query(
          collection(db, 'trainer'),
          where('email', '==', memberData.email)
        );
        
        const trainerSnapshot = await getDocs(trainersQuery);
        if (!trainerSnapshot.empty) {
          const trainerData = trainerSnapshot.docs[0].data();
          trainerIdQuery = trainerData.trainerId || trainerSnapshot.docs[0].id;
        } else {
          // If still not found, use memberId as fallback
          console.warn("No trainer found, using memberId as fallback");
          trainerIdQuery = memberData.memberId;
        }
      }
      
      console.log("Fetching training records for trainer:", trainerIdQuery, "member:", memberId);
      
      // Create query conditions - only get data from appointments collection
      let appointmentsQuery;
      
      if (memberId) {
        // If a member is specified, filter by member email
        appointmentsQuery = query(
          collection(db, 'appointments'),
          where('trainerId', '==', trainerIdQuery),
          where('memberEmail', '==', memberId)
        );
      } else {
        // Otherwise get all appointments for this trainer
        appointmentsQuery = query(
          collection(db, 'appointments'),
          where('trainerId', '==', trainerIdQuery)
        );
=======
      // Prioritize trainerId from memberData, if not available try to query from trainer collection
      let trainerIdQuery = await getTrainerId();

      console.log("Fetching training records for trainer:", trainerIdQuery, "member:", memberId);
      
      // Get member's email first
      const memberDoc = await getDoc(doc(db, 'members', memberId));
      if (!memberDoc.exists()) {
        throw new Error('Member not found');
>>>>>>> 0227ff521ac7718de42c3e71b8e80bf151c87189
      }
      
      const memberEmail = memberDoc.data().email;
      
<<<<<<< HEAD
      // Convert appointments to training record format
      let records: TrainingRecord[] = appointmentsSnapshot.docs.map(doc => {
        const data = doc.data();
        const appointmentDate = data.date?.toDate() || new Date();
        let status: 'completed' | 'cancelled' | 'pending' = 'pending';
        
        // Determine record status based on appointment status and date
        if (data.status === 'cancelled') {
          status = 'cancelled';
        } else if (data.status === 'scheduled') {
          // If date has passed and status is still scheduled, consider it completed
          if (appointmentDate < new Date()) {
            status = 'completed';
          } else {
            status = 'pending';
          }
        } else if (data.status === 'completed') {
          status = 'completed';
=======
      // Get all appointments for this member with this trainer
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('trainerId', '==', trainerIdQuery),
        where('memberEmail', '==', memberEmail),
        orderBy('date', 'desc')
      );
      
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      console.log(`Found ${appointmentsSnapshot.docs.length} appointments for member ${memberId}`);
      
      const records = appointmentsSnapshot.docs.map(doc => {
        const data = doc.data();
        const appointmentDate = data.date.toDate();
        let status = data.status || 'pending';
        
        // If date has passed and status is still scheduled, treat it as completed
        if (appointmentDate < new Date() && status === 'scheduled') {
          status = 'completed';
        } else if (status === 'scheduled') {
          const now = new Date();
          const appointmentTime = new Date(appointmentDate);
          appointmentTime.setHours(
            parseInt(data.timeEnd.split(':')[0]),
            parseInt(data.timeEnd.split(':')[1])
          );
          if (now > appointmentTime) {
            status = 'completed';
          }
>>>>>>> 0227ff521ac7718de42c3e71b8e80bf151c87189
        }
        
        return {
          id: doc.id,
<<<<<<< HEAD
          memberEmail: data.memberEmail || '',
          memberName: data.trainerName || 'Unknown Trainer', // Use trainerName as display name
          trainerId: data.trainerId || trainerIdQuery,
          trainerName: data.trainerName || 'Unknown Trainer',
          courseType: data.courseType || 'General Training',
          sessionDate: data.date || Timestamp.now(),
=======
          memberEmail: memberEmail,
          memberName: memberDoc.data().name || 'Unknown Member',
          trainerId: trainerIdQuery,
          trainerName: memberData?.name || 'Current Trainer',
          date: appointmentDate,
>>>>>>> 0227ff521ac7718de42c3e71b8e80bf151c87189
          timeStart: data.timeStart || '00:00',
          timeEnd: data.timeEnd || '00:00',
          duration: data.duration || 0,
          status: status,
          courseType: data.courseType || 'General Training',
          notes: data.notes || ''
        } as TrainingRecord;
      });
      
<<<<<<< HEAD
      // Filter by date
      if (dateStart && dateEnd) {
        console.log("Filtering by date range:", dateStart, dateEnd);
        const startTimestamp = Timestamp.fromDate(dateStart.toDate());
        const endTimestamp = Timestamp.fromDate(dateEnd.toDate());
        
        records = records.filter(record => {
          try {
            const recordDate = record.sessionDate;
            if (!recordDate) return false;
            
            // Handle different types of recordDate
            if (recordDate.toDate) {
              return recordDate >= startTimestamp && recordDate <= endTimestamp;
            } else if (recordDate instanceof Date) {
              const recordTimestamp = Timestamp.fromDate(recordDate);
              return recordTimestamp >= startTimestamp && recordTimestamp <= endTimestamp;
            }
            return false;
          } catch (error) {
            console.error("Error filtering record by date:", error, record);
            return false;
          }
        });
      }
      
      // Sort by date (newest first)
      records.sort((a, b) => {
        try {
          if (a.sessionDate && b.sessionDate) {
            return b.sessionDate.seconds - a.sessionDate.seconds;
          }
          return 0;
        } catch (error) {
          return 0;
        }
      });
      
      console.log("Final training records:", records);
=======
      console.log(`Successfully processed ${records.length} training records`);
>>>>>>> 0227ff521ac7718de42c3e71b8e80bf151c87189
      setTrainingRecords(records);
    } catch (error) {
      console.error('Error fetching training records:', error);
      message.error('Failed to load training records');
<<<<<<< HEAD
      // Set empty array to prevent UI errors
      setTrainingRecords([]);
      setCourseProgress({});
    } finally {
      setLoading(false);
=======
>>>>>>> 0227ff521ac7718de42c3e71b8e80bf151c87189
    }
  };

  const calculateCourseProgress = (records: TrainingRecord[]) => {
    try {
      // Filter valid records (containing courseType field)
      const validRecords = records.filter(record => record.courseType);
      console.log(`Calculating progress for ${validRecords.length} valid records`);
      
      // Group by course type and only calculate completed courses
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
        // Number of sessions required to complete each course type (can be adjusted)
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
    fetchMembers();
  }, [memberData]);

  useEffect(() => {
    fetchTrainingRecords(selectedMember);
  }, [selectedMember, memberData]);

  const handleMemberChange = (value: string) => {
    setSelectedMember(value);
  };

  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
  };

  const resetFilters = () => {
    setSelectedMember('');
    setDateRange([null, null]);
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
                  <Option key={member.id} value={member.email}>
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