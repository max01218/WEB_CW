'use client';

import React from 'react';
import { Card, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import Link from 'next/link';
import FitnessMap from '@/app/components/FitnessMap';
import { withAuth } from '@/app/components/withAuth';

const MapPage = () => {
  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '24px' 
    }}>
      <Link href="/member/dashboard">
        <Button 
          icon={<ArrowLeftOutlined />} 
          style={{ marginBottom: '16px' }}
        >
          Back to Dashboard
        </Button>
      </Link>

      <Card 
        title="Fitness Centres" 
        style={{ height: '80vh' }}
        className="map-card"
      >
        <FitnessMap />
      </Card>
    </div>
  );
};

export default withAuth(MapPage, { requiredRole: 'member' }); 