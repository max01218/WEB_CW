'use client';
import React, { useState, useEffect } from 'react';
import { Card, Calendar, Badge, Button, Modal, Form, Select, TimePicker, Input, message, Spin, Typography, Table, Tag } from 'antd';
import { ArrowLeftOutlined, CalendarOutlined, PlusOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, addDoc, Timestamp, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { withAuth } from '@/app/components/withAuth';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface Appointment {
  id: string;
  memberEmail: string;
  memberName?: string;
  trainerId: string;
  trainerName: string;
  courseType: string;
  date: Timestamp;
  timeStart: string;
  timeEnd: string;
  duration: number;
  status: 'scheduled' | 'cancelled' | 'completed';
  notes: string;
  createdAt: Timestamp;
}

interface Member {
  id: string;
  email: string;
  name: string;
}

interface CalendarEvent {
  type: 'success' | 'warning' | 'error' | 'default';
  content: string;
  time: string;
  appointment: Appointment;
}

const BookSessionPage = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDailyModalVisible, setIsDailyModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [dailyAppointments, setDailyAppointments] = useState<Appointment[]>([]);
  const [timeConflict, setTimeConflict] = useState(false);
  const [calendarMode, setCalendarMode] = useState<'month' | 'year'>('month');
  const [form] = Form.useForm();
  const { memberData } = useAuth();
  const router = useRouter();

  // Course types
  const courseTypes = ['General Fitness', 'Yoga', 'Pilates', 'Strength Training', 'Cardio', 'Flexibility', 'Balance'];

  // Fetch trainer's members (accepted requests)
  const fetchMembers = async () => {
    if (!memberData) return;
    
    try {
      let trainerIdQuery: string;

      // 直接从trainer集合中查询trainerId
      const trainersQuery = query(
        collection(db, 'trainer'),
        where('email', '==', memberData.email)
      );
      
      const trainerSnapshot = await getDocs(trainersQuery);
      if (!trainerSnapshot.empty) {
        const trainerData = trainerSnapshot.docs[0].data();
        trainerIdQuery = trainerData.trainerId || trainerSnapshot.docs[0].id;
      } else {
        // 如果没有找到，则使用memberId作为fallback
        console.warn("No trainer found, using memberId as fallback");
        trainerIdQuery = memberData.memberId || 'T001';
      }
      
      console.log("Current trainer ID:", trainerIdQuery);
      
      // Store all members here
      const memberMap = new Map<string, Member>();
      
      // Method 1: Get members directly from members collection who have this trainer assigned
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
      
      
      
      // Method 2: Get members from accepted requests as backup
      if (memberMap.size === 0) {
        console.log("Trying to get members from accepted requests");
        const requestsQuery = query(
          collection(db, 'requests'),
          where('trainerId', '==', trainerIdQuery),
          where('status', '==', 'accepted')
        );
        
        const querySnapshot = await getDocs(requestsQuery);
        console.log(`Found ${querySnapshot.docs.length} accepted requests`);
        
        // Extract unique members from the requests
        querySnapshot.docs.forEach(doc => {
          const request = doc.data();
          const memberId = request.memberId;
          
          if (!memberMap.has(memberId)) {
            memberMap.set(memberId, {
              id: memberId,
              email: request.memberName, // Assuming memberName contains email
              name: request.memberName
            });
          }
        });
      }
      
      // Method 3: If still no members found, fetch all active members as fallback
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

  // Fetch trainer's appointments
  const fetchAppointments = async () => {
    if (!memberData) return;
    
    setLoading(true);
    try {
      let trainerIdQuery: string;
      
      // Get trainerId directly from trainer collection
      const trainersQuery = query(
        collection(db, 'trainer'),
        where('email', '==', memberData.email)
      );
      
      const trainerSnapshot = await getDocs(trainersQuery);
      if (!trainerSnapshot.empty) {
        const trainerData = trainerSnapshot.docs[0].data();
        trainerIdQuery = trainerData.trainerId || trainerSnapshot.docs[0].id;
      } else {
        // If not found, use memberId as fallback
        console.warn("No trainer found for appointments, using memberId as fallback");
        trainerIdQuery = memberData.memberId || 'T001';
      }
      
      // Get all scheduled and completed appointments
      const scheduledQuery = query(
        collection(db, 'appointments'),
        where('trainerId', '==', trainerIdQuery),
        where('status', 'in', ['scheduled', 'completed'])
      );
      
      const querySnapshot = await getDocs(scheduledQuery);
      const appointmentsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Appointment[];
      
      console.log(`Found ${appointmentsList.length} scheduled/completed appointments`);
      setAppointments(appointmentsList);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      message.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchAppointments();
  }, [memberData]);

  // Check if the selected time conflicts with existing appointments
  const checkTimeConflict = (date: Dayjs, startTime: string, endTime: string) => {
    // Convert date to Timestamp format for comparison
    const selectedDateObj = date.startOf('day').toDate();
    
    // Find appointments on the same day
    const sameDay = appointments.filter(appointment => {
      const appDate = appointment.date.toDate();
      return (
        appDate.getDate() === selectedDateObj.getDate() &&
        appDate.getMonth() === selectedDateObj.getMonth() &&
        appDate.getFullYear() === selectedDateObj.getFullYear() &&
        appointment.status === 'scheduled'
      );
    });
    
    if (sameDay.length === 0) return false;
    
    // Convert times to comparable format (minutes since midnight)
    const convertToMinutes = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const newStart = convertToMinutes(startTime);
    const newEnd = convertToMinutes(endTime);
    
    // Check for overlaps
    return sameDay.some(appointment => {
      const existingStart = convertToMinutes(appointment.timeStart);
      const existingEnd = convertToMinutes(appointment.timeEnd);
      
      // Check if the new appointment overlaps with existing one
      return (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      );
    });
  };

  const handleBookingSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log("Form values:", values);
      
      // Format time values
      const timeStart = values.timeRange?.[0]?.format('HH:mm') || '09:00';
      const timeEnd = values.timeRange?.[1]?.format('HH:mm') || '10:00';
      
      // Check for time conflicts
      const hasConflict = checkTimeConflict(selectedDate, timeStart, timeEnd);
      if (hasConflict) {
        setTimeConflict(true);
        return;
      }
      
      // Calculate duration in minutes
      const startMinutes = dayjs(timeStart, 'HH:mm');
      const endMinutes = dayjs(timeEnd, 'HH:mm');
      const durationMinutes = endMinutes.diff(startMinutes, 'minute');
      
      // Find member by email
      const selectedMember = members.find(m => m.email === values.memberEmail);
      if (!selectedMember) {
        message.error('Selected member not found');
        return;
      }
      
      // Get trainer ID
      let trainerId: string = '';
      let trainerName: string = '';
      
      try {
        if (memberData?.email) {
          const trainersQuery = query(
            collection(db, 'trainer'),
            where('email', '==', memberData.email)
          );
          
          const trainerSnapshot = await getDocs(trainersQuery);
          if (!trainerSnapshot.empty) {
            const trainerDoc = trainerSnapshot.docs[0];
            const trainerData = trainerDoc.data();
            trainerId = trainerData.trainerId || trainerDoc.id;
            trainerName = trainerData.name || memberData.name || 'Default Trainer';
          } else {
            // Fallback
            trainerId = memberData.memberId || '';
            trainerName = memberData.name || 'Default Trainer';
          }
        }
        
        if (!trainerId) {
          message.error('Unable to determine trainer ID. Please try again.');
          return;
        }
      } catch (err) {
        console.error('Error finding trainerId:', err);
        message.error('Error finding trainer information');
        return;
      }
      
      // Create appointment data with all required fields
      const appointmentData = {
        memberEmail: values.memberEmail || '',
        memberId: selectedMember.id || '',
        trainerId: trainerId,
        trainerName: trainerName,
        courseType: values.courseType || 'General Fitness',
        date: Timestamp.fromDate(selectedDate.toDate()),
        timeStart,
        timeEnd,
        duration: durationMinutes || 60,
        status: 'scheduled',
        notes: values.notes || '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      console.log("Saving appointment:", appointmentData);
      
      // Add to Firestore appointments collection
      let appointmentRef;
      try {
        appointmentRef = await addDoc(collection(db, 'appointments'), appointmentData);
        console.log("Appointment saved with ID:", appointmentRef.id);
        message.success('Appointment booked successfully');
      } catch (error) {
        console.error('Error creating appointment document:', error);
        message.error('Failed to create appointment');
        return;
      }
      
      // Update local state
      setAppointments([...appointments, { ...appointmentData, id: appointmentRef.id } as Appointment]);
      
      // Try to create notification
      try {
        const notification = {
          email: values.memberEmail || '',
          title: 'New Training Session Scheduled',
          description: `You have a new ${values.courseType || 'training'} session on ${selectedDate.format('YYYY-MM-DD')} from ${timeStart} to ${timeEnd}.`,
          date: Timestamp.now(),
          type: 'appointment',
          read: false,
          appointmentId: appointmentRef.id,
          trainerId: trainerId,
          createdAt: Timestamp.now()
        };
        
        await addDoc(collection(db, 'notifications'), notification);
      } catch (error) {
        console.error('Error creating notification:', error);
        // Continue even if notification creation fails
      }
      
      setIsModalVisible(false);
      form.resetFields();
      
      // Refresh appointments list
      fetchAppointments();
      
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      message.error(`Failed to book appointment: ${error.message || 'Unknown error'}`);
    }
  };

  const showBookingModal = (date: Dayjs) => {
    setSelectedDate(date);
    setTimeConflict(false);
    form.resetFields();
    form.setFieldsValue({
      date: date,
      timeRange: [dayjs('09:00', 'HH:mm'), dayjs('10:00', 'HH:mm')]
    });
    setIsModalVisible(true);
  };

  // Show all appointments for the selected day
  const showDailyAppointments = (date: Dayjs) => {
    setSelectedDate(date);
    // Filter appointments for this date
    const filteredAppointments = appointments.filter(appointment => {
      const appDate = appointment.date.toDate();
      return (
        appDate.getDate() === date.date() &&
        appDate.getMonth() === date.month() &&
        appDate.getFullYear() === date.year() &&
        (appointment.status === 'scheduled' || appointment.status === 'completed')
      );
    });
    
    setDailyAppointments(filteredAppointments);
    setIsDailyModalVisible(true);
  };

  const handleDateSelect = (date: Dayjs) => {
    if (calendarMode === 'month') {
      showDailyAppointments(date);
    }
  };

  const dateCellRender = (date: Dayjs) => {
    // Filter appointments for this date
    const dayEvents = appointments.filter(appointment => {
      const appDate = appointment.date.toDate();
      return (
        appDate.getDate() === date.date() &&
        appDate.getMonth() === date.month() &&
        appDate.getFullYear() === date.year() &&
        (appointment.status === 'scheduled' || appointment.status === 'completed')
      );
    });
    
    if (dayEvents.length === 0) return null;
    
    // Map appointments to calendar events
    const events: CalendarEvent[] = dayEvents.map(appointment => {
      let type: 'success' | 'warning' | 'error' | 'default' = 'default';
      
      if (appointment.status === 'completed') type = 'success';
      else if (appointment.status === 'scheduled') type = 'warning';
      else if (appointment.status === 'cancelled') type = 'error';
      
      return {
        type,
        content: `${appointment.memberEmail} - ${appointment.courseType}`,
        time: `${appointment.timeStart} - ${appointment.timeEnd}`,
        appointment
      };
    });
    
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {events.slice(0, 2).map((event, index) => (
          <li key={index} style={{ marginBottom: '4px' }}>
            <Badge status={event.type} text={
              <div style={{ fontSize: '10px', lineHeight: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {event.time} - {event.content}
              </div>
            } />
          </li>
        ))}
        {events.length > 2 && (
          <li>
            <Text type="secondary" style={{ fontSize: '10px' }}>
              +{events.length - 2} more
            </Text>
          </li>
        )}
      </ul>
    );
  };

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
            <Title level={3} style={{ margin: 0 }}>Session Booking</Title>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => showBookingModal(dayjs())}
          >
            Book New Session
          </Button>
        </div>

        <Card>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
              <div style={{ marginTop: '16px' }}>Loading calendar...</div>
            </div>
          ) : (
            <Calendar 
              cellRender={dateCellRender}
              onSelect={handleDateSelect}
              mode={calendarMode}
              onPanelChange={(date, mode) => setCalendarMode(mode as 'month' | 'year')}
            />
          )}
        </Card>
      </div>

      {/* Daily Appointments Modal */}
      <Modal
        title={`Appointments for ${selectedDate?.format('YYYY-MM-DD')}`}
        open={isDailyModalVisible}
        onCancel={() => setIsDailyModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDailyModalVisible(false)}>
            Close
          </Button>,
          <Button key="add" type="primary" onClick={() => {
            setIsDailyModalVisible(false);
            showBookingModal(selectedDate);
          }}>
            Add Appointment
          </Button>
        ]}
        width={700}
      >
        {dailyAppointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p>No appointments scheduled for this day.</p>
          </div>
        ) : (
          <Table
            dataSource={dailyAppointments}
            rowKey="id"
            pagination={false}
            columns={[
              {
                title: 'Member Email',
                dataIndex: 'memberEmail',
                key: 'memberEmail',
              },
              {
                title: 'Course Type',
                dataIndex: 'courseType',
                key: 'courseType',
                render: (text: string) => <Tag color="blue">{text}</Tag>
              },
              {
                title: 'Time',
                key: 'time',
                render: (_, record: Appointment) => (
                  <span>{record.timeStart} - {record.timeEnd}</span>
                )
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (status: string) => {
                  let color = 'default';
                  if (status === 'completed') color = 'green';
                  else if (status === 'scheduled') color = 'orange';
                  else if (status === 'cancelled') color = 'red';
                  
                  return <Tag color={color}>{status.toUpperCase()}</Tag>;
                }
              }
            ]}
          />
        )}
      </Modal>

      {/* Existing Booking Modal */}
      <Modal
        title={`Book Session for ${selectedDate?.format('YYYY-MM-DD')}`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleBookingSubmit}>
            Book Session
          </Button>
        ]}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="memberEmail"
            label="Member"
            rules={[{ required: true, message: 'Please select a member' }]}
          >
            <Select placeholder="Select a member">
              {members.map(member => (
                <Option key={member.id} value={member.email}>
                  {member.name || member.email} (ID: {member.id.substring(0, 8)}...)
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="courseType"
            label="Course Type"
            rules={[{ required: true, message: 'Please select a course type' }]}
          >
            <Select placeholder="Select a course type">
              {courseTypes.map(course => (
                <Option key={course} value={course}>
                  {course}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="timeRange"
            label="Time Range"
            rules={[{ required: true, message: 'Please select a time range' }]}
          >
            <TimePicker.RangePicker 
              format="HH:mm"
              style={{ width: '100%' }}
              minuteStep={15}
            />
          </Form.Item>

          {timeConflict && (
            <div style={{ color: 'red', marginBottom: '16px' }}>
              Time conflict detected. Please select a different time.
            </div>
          )}

          <Form.Item
            name="notes"
            label="Notes"
          >
            <TextArea rows={4} placeholder="Session details, equipment needed, or special instructions" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default withAuth(BookSessionPage, { requiredRole: 'trainer' }); 