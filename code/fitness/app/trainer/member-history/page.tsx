'use client';
import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Progress, message, Spin, Tag, Typography, Select, DatePicker } from 'antd';
import { ArrowLeftOutlined, HistoryOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, Timestamp, getDoc, doc } from 'firebase/firestore';
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
  sessionDate: any;
  timeStart: string;
  timeEnd: string;
  duration: number;
  status: 'completed' | 'cancelled' | 'pending';
  notes: string;
  createdAt: any;
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

  const fetchMembers = async () => {
    if (!memberData) return;
    
    try {
      // 优先使用memberData中的trainerId，如果没有则尝试从trainer集合中查询
      let trainerIdQuery = memberData.trainerId;

      // 如果memberData中没有trainerId，尝试从trainer集合中查询
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
          // 如果仍然没有找到，则使用memberId作为fallback
          console.warn("No trainer found, using memberId as fallback");
          trainerIdQuery = memberData.memberId;
        }
      }
      
      console.log("Current trainer ID:", trainerIdQuery);
      
      // Store all members in this map
      const memberMap = new Map<string, Member>();
      
      // Method 1: Get members directly from members collection who have this trainer assigned
      console.log("Trying to get members with trainerId field");
      const membersQuery = query(
        collection(db, 'members'),
        where('trainerId', '==', trainerIdQuery)
      );
      
      const membersSnapshot = await getDocs(membersQuery);
      console.log(`Found ${membersSnapshot.docs.length} members with trainerId=${trainerIdQuery}`);
      
      // Add members to the map
      membersSnapshot.docs.forEach(doc => {
        const memberData = doc.data();
        const memberId = doc.id;
        
        memberMap.set(memberId, {
          id: memberId,
          email: memberData.email || "Unknown",
          name: memberData.name || memberData.email || "Unknown Member"
        });
      });
      
      // Method 2: Check trainer document for trainees field
      try {
        console.log("Checking trainer document for trainees field");
        // Query trainers collection for the specific trainer
        const trainerQuery = query(
          collection(db, 'trainer'),
          where('trainerId', '==', trainerIdQuery)
        );
        
        const trainerSnapshot = await getDocs(trainerQuery);
        
        for (const trainerDoc of trainerSnapshot.docs) {
          const trainerData = trainerDoc.data();
          console.log("Trainer data:", trainerData);
          
          // Check if trainees field exists and is an array or object
          if (trainerData.trainees) {
            console.log("Found trainees in trainer document:", trainerData.trainees);
            
            // Handle trainees as array
            if (Array.isArray(trainerData.trainees)) {
              for (const traineeId of trainerData.trainees) {
                if (typeof traineeId === 'string') {
                  // Fetch member data for this trainee
                  try {
                    const memberDoc = await getDoc(doc(db, 'members', traineeId));
                    if (memberDoc.exists()) {
                      const memberData = memberDoc.data();
                      memberMap.set(traineeId, {
                        id: traineeId,
                        email: memberData.email || "Unknown",
                        name: memberData.name || memberData.email || "Unknown Member"
                      });
                    }
                  } catch (err) {
                    console.error("Error fetching trainee details:", err);
                  }
                }
              }
            } 
            // Handle trainees as object with key-value pairs
            else if (typeof trainerData.trainees === 'object') {
              for (const [traineeId, traineeValue] of Object.entries(trainerData.trainees)) {
                try {
                  const memberDoc = await getDoc(doc(db, 'members', traineeId));
                  if (memberDoc.exists()) {
                    const memberData = memberDoc.data();
                    memberMap.set(traineeId, {
                      id: traineeId,
                      email: memberData.email || "Unknown",
                      name: memberData.name || memberData.email || "Unknown Member"
                    });
                  }
                } catch (err) {
                  console.error("Error fetching trainee details:", err);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error checking trainer document:", error);
      }
      
      // Method 3: Get members from accepted requests
      if (memberMap.size === 0) {
        console.log("Trying to get members from accepted requests");
        const requestsQuery = query(
          collection(db, 'requests'),
          where('trainerId', '==', trainerIdQuery),
          where('status', '==', 'accepted')
        );
        
        const querySnapshot = await getDocs(requestsQuery);
        console.log(`Found ${querySnapshot.docs.length} accepted requests`);
        
        querySnapshot.docs.forEach(doc => {
          const request = doc.data();
          const memberId = request.memberId;
          
          if (!memberMap.has(memberId)) {
            memberMap.set(memberId, {
              id: memberId,
              email: request.memberName,
              name: request.memberName
            });
          }
        });
      }
      
      // Method 4: If still no members found, fetch all active members as fallback
      if (memberMap.size === 0) {
        console.log("Trying to get all active members as fallback");
        const allMembersQuery = query(
          collection(db, 'members'),
          where('role', '==', 'member'),
          where('status', '==', 'active')
        );
        
        const allMembersSnapshot = await getDocs(allMembersQuery);
        console.log(`Found ${allMembersSnapshot.docs.length} active members`);
        
        allMembersSnapshot.docs.forEach(doc => {
          const memberData = doc.data();
          const memberId = doc.id;
          
          memberMap.set(memberId, {
            id: memberId,
            email: memberData.email || "Unknown",
            name: memberData.name || memberData.email || "Unknown Member"
          });
        });
      }
      
      const membersList = Array.from(memberMap.values());
      console.log("Final members list:", membersList);
      setMembers(membersList);
      
      if (membersList.length === 0) {
        message.warning('No members found for this trainer. Please accept member requests first.');
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      message.error('Failed to load members');
    }
  };

  const fetchTrainingRecords = async (memberId?: string, dateStart?: any, dateEnd?: any) => {
    if (!memberData) return;
    
    setLoading(true);
    try {
      // 优先使用memberData中的trainerId，如果没有则尝试从trainer集合中查询
      let trainerIdQuery = memberData.trainerId;

      // 如果memberData中没有trainerId，尝试从trainer集合中查询
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
          // 如果仍然没有找到，则使用memberId作为fallback
          console.warn("No trainer found, using memberId as fallback");
          trainerIdQuery = memberData.memberId;
        }
      }
      
      console.log("Fetching training records for trainer:", trainerIdQuery, "member:", memberId);
      
      // First try looking in the appointments collection as this may be what's being used
      console.log("Trying to fetch from appointments collection first");
      let appointmentsQuery;
      
      if (memberId) {
        appointmentsQuery = query(
          collection(db, 'appointments'),
          where('trainerId', '==', trainerIdQuery),
          where('memberEmail', '==', memberId)
        );
      } else {
        appointmentsQuery = query(
          collection(db, 'appointments'),
          where('trainerId', '==', trainerIdQuery)
        );
      }
      
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      console.log(`Found ${appointmentsSnapshot.docs.length} appointments`);
      
      // Convert appointments to training records format
      let records: TrainingRecord[] = appointmentsSnapshot.docs.map(doc => {
        const data = doc.data();
        const appointmentDate = data.date?.toDate() || new Date();
        let status = data.status || 'pending';
        
        // 如果日期已过且状态仍为scheduled，将其视为completed
        if (status === 'scheduled' && appointmentDate < new Date()) {
          status = 'completed';
        } else if (status === 'scheduled') {
          status = 'pending';
        }
        
        return {
          id: doc.id,
          memberEmail: data.memberEmail || '',
          memberName: data.trainerName || 'Unknown Trainer',
          trainerId: data.trainerId || trainerIdQuery,
          trainerName: data.trainerName || 'Unknown Trainer',
          courseType: data.courseType || 'General Training',
          sessionDate: data.date || Timestamp.now(),
          timeStart: data.timeStart || '00:00',
          timeEnd: data.timeEnd || '00:00',
          duration: data.duration || 0,
          status: status,
          notes: data.notes || '',
          createdAt: data.createdAt || Timestamp.now()
        } as TrainingRecord;
      });
      
      // If no appointments found, try training records
      if (records.length === 0) {
        console.log("No appointments found, trying trainingRecords collection");
        let trainingQuery;
        
        if (memberId) {
          trainingQuery = query(
            collection(db, 'trainingRecords'),
            where('trainerId', '==', trainerIdQuery),
            where('memberEmail', '==', memberId)
          );
        } else {
          trainingQuery = query(
            collection(db, 'trainingRecords'),
            where('trainerId', '==', trainerIdQuery)
          );
        }
        
        const querySnapshot = await getDocs(trainingQuery);
        console.log(`Found ${querySnapshot.docs.length} training records`);
        
        records = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            memberEmail: data.memberEmail || '',
            memberName: data.trainerName || 'Unknown Trainer',
            trainerId: data.trainerId || trainerIdQuery,
            trainerName: data.trainerName || 'Unknown Trainer',
            courseType: data.courseType || 'General Training',
            sessionDate: data.sessionDate || Timestamp.now(),
            timeStart: data.timeStart || '00:00',
            timeEnd: data.timeEnd || '00:00',
            duration: data.duration || 0,
            status: data.status || 'pending',
            notes: data.notes || '',
            createdAt: data.createdAt || Timestamp.now()
          } as TrainingRecord;
        });
      }
      
      // Filter by date if provided
      if (dateStart && dateEnd) {
        console.log("Filtering by date range:", dateStart, dateEnd);
        const startTimestamp = Timestamp.fromDate(dateStart.toDate());
        const endTimestamp = Timestamp.fromDate(dateEnd.toDate());
        
        records = records.filter(record => {
          try {
            const recordDate = record.sessionDate;
            if (!recordDate) return false;
            
            // Handle comparison differently based on the type
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
          return b.sessionDate.seconds - a.sessionDate.seconds;
        } catch (error) {
          return 0;
        }
      });
      
      console.log("Final training records:", records);
      setTrainingRecords(records);
      
      calculateCourseProgress(records);
    } catch (error) {
      console.error('Error fetching training records:', error);
      message.error('Failed to load training records');
      // Set empty arrays to prevent UI errors
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
    fetchMembers();
  }, [memberData]);

  useEffect(() => {
    fetchTrainingRecords(
      selectedMember || undefined, 
      dateRange[0] || undefined, 
      dateRange[1] || undefined
    );
  }, [selectedMember, dateRange, memberData]);

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
            {record.sessionDate.toDate().toLocaleDateString()}
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