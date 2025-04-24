'use client'
import React from 'react';
import Link from 'next/link';
import { UserOutlined, LoginOutlined, AppstoreOutlined, TrophyOutlined, TeamOutlined, CalendarOutlined, TeamOutlined as TrainerOutlined } from '@ant-design/icons';
import {
  containerStyle,
  headerStyle,
  logoStyle,
  navStyle,
  heroSectionStyle,
  heroContentStyle,
  heroTitleStyle,
  heroSubtitleStyle,
  buttonContainerStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  featureSectionStyle,
  featureGridStyle,
  featureCardStyle,
  featureIconStyle,
  featureTitleStyle,
  featureDescStyle,
  footerStyle,
} from './styles';
import './styles.css';

const HomePage = () => {
  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={logoStyle}>
            <AppstoreOutlined /> Fitness Tracker
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link href="/course" className="nav-link">
              <UserOutlined /> Classes
            </Link>
            <Link href="/trainer_search" className="nav-link">
              <TrainerOutlined /> Trainer
            </Link>
          </div>
        </div>
        <nav style={navStyle}>
          <Link href="/login" className="nav-link">
            Login
          </Link>
          <Link href="/register" className="nav-link">
            Register
          </Link>
        </nav>
      </header>

      <section style={heroSectionStyle}>
        <div style={heroContentStyle}>
          <h1 style={heroTitleStyle}>Transform Your Fitness Journey</h1>
          <p style={heroSubtitleStyle}>
            Track your progress, connect with trainers, and achieve your fitness goals with our comprehensive platform.
          </p>
          <div style={buttonContainerStyle}>
            <Link href="/register" style={primaryButtonStyle} className="primary-button">
              Get Started
            </Link>
            <Link href="/login" style={secondaryButtonStyle} className="secondary-button">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <section style={featureSectionStyle}>
        <div style={featureGridStyle}>
          <div style={featureCardStyle} className="feature-card">
            <div style={featureIconStyle}>
              <TrophyOutlined />
            </div>
            <h3 style={featureTitleStyle}>Track Progress</h3>
            <p style={featureDescStyle}>
              Monitor your fitness journey with detailed analytics and milestone tracking.
            </p>
          </div>
          <div style={featureCardStyle} className="feature-card">
            <div style={featureIconStyle}>
              <TeamOutlined />
            </div>
            <h3 style={featureTitleStyle}>Expert Training</h3>
            <p style={featureDescStyle}>
              Connect with professional trainers for personalized workout plans.
            </p>
          </div>
          <div style={featureCardStyle} className="feature-card">
            <div style={featureIconStyle}>
              <CalendarOutlined />
            </div>
            <h3 style={featureTitleStyle}>Smart Scheduling</h3>
            <p style={featureDescStyle}>
              Easily manage your appointments and training sessions.
            </p>
          </div>
        </div>
      </section>

      <footer style={footerStyle}>
        © {new Date().getFullYear()} Fitness Tracker. All rights reserved.
      </footer>
    </div>
  );
};

export default HomePage;
