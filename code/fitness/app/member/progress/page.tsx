"use client";

import { Card, Row, Col, Statistic, Button, Spin, Select, Empty } from "antd";
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useState, useEffect } from "react";
import { collection, query, where, Timestamp, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { useRouter } from 'next/navigation';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// 注册 ChartJS 组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface TrainingRecord {
  id: string;
  duration: number;
  email: string;
  sessionDate: Timestamp;
  status: 'completed' | 'cancelled' | 'pending';
  session?: string;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    fill?: boolean;
  }[];
}

export default function ProgressPage() {
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, memberData, loading: authLoading } = useAuth();
  const router = useRouter();

  // 获取训练记录
  const fetchTrainingRecords = async () => {
    try {
      if (!user || !memberData) return;

      const now = new Date();
      const startDate = new Date();
      if (timeRange === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else {
        startDate.setMonth(now.getMonth() - 1);
      }

      const recordsQuery = query(
        collection(db, "trainingRecords"),
        where("email", "==", memberData.email),
        where("status", "==", "completed"),
        where("sessionDate", ">=", Timestamp.fromDate(startDate))
      );

      const querySnapshot = await getDocs(recordsQuery);
      const recordsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TrainingRecord[];

      setRecords(recordsData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching training records:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && memberData) {
      fetchTrainingRecords();
    }
  }, [user, memberData, timeRange, authLoading]);

  // 处理图表数据
  const getChartData = (): ChartData => {
    const dateLabels: string[] = [];
    const durationData: number[] = [];
    const sessionData: { [key: string]: number } = {};

    if (timeRange === 'week') {
      // 生成过去7天的标签
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dateLabels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        durationData.push(0);
      }

      // 填充数据
      records.forEach(record => {
        const date = record.sessionDate.toDate();
        const dayIndex = 6 - Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (dayIndex >= 0 && dayIndex < 7) {
          durationData[dayIndex] += record.duration;
        }
        // 统计课程类型
        const sessionType = record.session || 'Regular Training';
        sessionData[sessionType] = (sessionData[sessionType] || 0) + 1;
      });
    } else {
      // 生成过去30天的周标签
      for (let i = 4; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7));
        dateLabels.push(`Week ${5-i}`);
        durationData.push(0);
      }

      // 填充数据
      records.forEach(record => {
        const date = record.sessionDate.toDate();
        const weekIndex = 4 - Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 7));
        if (weekIndex >= 0 && weekIndex < 5) {
          durationData[weekIndex] += record.duration;
        }
        // 统计课程类型
        const sessionType = record.session || 'Regular Training';
        sessionData[sessionType] = (sessionData[sessionType] || 0) + 1;
      });
    }

    return {
      labels: dateLabels,
      datasets: [{
        label: 'Training Duration (minutes)',
        data: durationData,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        fill: true
      }]
    };
  };

  // 获取训练类型分布数据
  const getSessionDistributionData = () => {
    const sessionTypes: { [key: string]: number } = {};
    records.forEach(record => {
      const type = record.session || 'Regular Training';
      sessionTypes[type] = (sessionTypes[type] || 0) + 1;
    });

    return {
      labels: Object.keys(sessionTypes),
      datasets: [{
        data: Object.values(sessionTypes),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
        ],
      }]
    };
  };

  // 计算总计数据
  const getTotalStats = () => {
    const totalDuration = records.reduce((sum, record) => sum + record.duration, 0);
    const totalSessions = records.length;
    const averageDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;

    return {
      totalDuration,
      totalSessions,
      averageDuration
    };
  };

  if (authLoading || loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f0f2f5'
      }}>
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  if (!user || !memberData) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f0f2f5'
      }}>
        <h2>Please login first</h2>
        <Button type="primary" onClick={() => router.push('/login')}>
          Go to Login
        </Button>
      </div>
    );
  }

  const stats = getTotalStats();

  return (
    <div style={{ 
      padding: "24px",
      background: "#f5f5f5",
      minHeight: "100vh"
    }}>
      <div style={{ 
        maxWidth: "1200px", 
        margin: "0 auto",
        padding: "24px",
        background: "#fff",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: "24px"
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Button 
              onClick={() => router.push('/member/dashboard')}
              icon={<ArrowLeftOutlined />}
            >
              Back to Dashboard
            </Button>
            <h1 style={{ margin: 0 }}>Training Progress</h1>
          </div>
          <Select
            value={timeRange}
            onChange={setTimeRange}
            style={{ width: 120 }}
            options={[
              { value: 'week', label: 'Last Week' },
              { value: 'month', label: 'Last Month' }
            ]}
          />
        </div>

        {/* Statistics Cards */}
        <Row gutter={[24, 24]} style={{ marginBottom: "32px" }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Total Training Time"
                value={stats.totalDuration}
                suffix="minutes"
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Total Sessions"
                value={stats.totalSessions}
                suffix="sessions"
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Average Duration"
                value={stats.averageDuration}
                suffix="min/session"
              />
            </Card>
          </Col>
        </Row>

        {/* Charts */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card title="Training Duration Trend">
              {records.length > 0 ? (
                <Line
                  data={getChartData()}
                  options={{
                    responsive: true,
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Duration (minutes)'
                        }
                      }
                    }
                  }}
                />
              ) : (
                <Empty description="No training records found" />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="Session Type Distribution">
              {records.length > 0 ? (
                <Doughnut
                  data={getSessionDistributionData()}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              ) : (
                <Empty description="No training records found" />
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
} 