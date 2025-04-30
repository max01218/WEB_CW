"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Input, Button, Card, Row, Col, Spin, message, Pagination, Empty, Modal, Space } from "antd";
import { AppstoreOutlined, UserOutlined } from "@ant-design/icons";
import { collection, getDocs, addDoc, serverTimestamp, query, where, doc, setDoc, getDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { db } from "@/lib/firebase";
import { useLoginModal } from "@/app/components/LoginModalContext";
import { Avatar, Dropdown, MenuProps } from "antd";
import { useRouter } from "next/navigation";


interface Trainer {
  id: string;
  name: string;
  trainerId: string;
  intro?: string;
  email?: string;
  telephone?: string;
  image?: string;
}

const PAGE_SIZE = 5;

const headerStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  padding: "10px 30px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
  marginBottom: "30px",
  position: "sticky",
  top: 0,
  zIndex: 1000,
};

const logoStyle: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: "bold",
  color: "#1890ff",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const navStyle: React.CSSProperties = {
  display: "flex",
  gap: "15px",
};

export default function TrainerPage() {
  const [searchNamePrefix, setSearchNamePrefix] = useState("");
  const [searchTrainerId, setSearchTrainerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [allTrainers, setAllTrainers] = useState<Trainer[]>([]);
  const [filteredTrainers, setFilteredTrainers] = useState<Trainer[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [user, setUser] = useState<null | { uid: string; email?: string; name?: string }>(null);
  const { showLogin } = useLoginModal();
  const router = useRouter();

  // 控制弹窗
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTrainer, setCurrentTrainer] = useState<Trainer | null>(null);
  const [trainingGoal, setTrainingGoal] = useState("");

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, (u) => {
      if (u) setUser({ uid: u.uid, email: u.email ?? undefined, name: u.displayName ?? undefined });
      else setUser(null);
    });
  }, []);

  useEffect(() => {
    const fetchTrainers = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "trainer"));
        const list = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
        setAllTrainers(list);
        setFilteredTrainers(list);
      } catch (e) {
        message.error("Failed to load trainers.");
      } finally {
        setLoading(false);
      }
    };
    fetchTrainers();
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  if (isSubmitting) return;


  const handleAdvancedSearch = () => {
    const namePrefix = searchNamePrefix.trim().toLowerCase();
    const trainerIdKeyword = searchTrainerId.trim().toLowerCase();

    const filtered = allTrainers.filter(t => {
      const nameMatches = namePrefix ? t.name.toLowerCase().startsWith(namePrefix) : true;
      const idMatches = trainerIdKeyword ? t.trainerId.toLowerCase().includes(trainerIdKeyword) : true;
      return nameMatches && idMatches;
    });

    setFilteredTrainers(filtered);
    setCurrentPage(1);
  };

  const openRequestModal = (trainer: Trainer) => {
    if (!user) {
      showLogin();
      return;
    }
    setCurrentTrainer(trainer);
    setIsModalOpen(true);
  };
  
  const handleSubmitRequest = async () => {
    if (!trainingGoal.trim()) {
      message.warning("Please enter your training goal.");
      return;
    }
  
    if (!user || !currentTrainer) {
      message.error("Error: Missing user or trainer information.");
      return;
    }
  
    try {
      setIsSubmitting(true);

      console.log('User info:', { uid: user.uid, email: user.email });
      console.log('Trainer info:', currentTrainer);
  
      // 查询当前用户是否已有"未完成"的请求
      const q = query(
        collection(db, "requests"),
        where("memberId", "==", user.uid),
        where("status", "in", ["pending", "accepted"])
      );
  
      const snap = await getDocs(q);
      console.log('Existing requests:', snap.docs.map(d => d.data()));
  
      if (!snap.empty) {
        message.warning("You already have a pending request. Please wait for the coach's reply.");
        return;
      }
  
      // 提交新请求
      const requestData = {
        memberId: user.uid,
        memberName: user.email,
        requesterUid: user.uid,
        trainerId: currentTrainer.trainerId,
        trainerName: currentTrainer.name,
        trainingGoal: trainingGoal.trim(),
        requestedAt: serverTimestamp(),
        status: "pending"
      };

      console.log('Submitting request:', requestData);
      
      const requestRef = await addDoc(collection(db, "requests"), requestData);
      console.log('Request created with ID:', requestRef.id);
  
      message.success("Training request sent successfully!");
      setIsModalOpen(false);
      setTrainingGoal("");
    } catch (error) {
      console.error("Error submitting request:", error);
      message.error("Failed to send request: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsSubmitting(false); 
    }
  };  

  const currentPageData = filteredTrainers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = "/images/trainer.jpg";
  };

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      message.success("You have successfully logged out");
      router.push("/home");
    } catch (err) {
      message.error("Logout failed. Please try again.");
    }
  };

  const handleCheckStatus = async () => {
    if (!user) {
      message.warning("Please login first.");
      router.push("/login");
      return;
    }
  
    try {
      const q = query(
        collection(db, "requests"),
        where("memberId", "==", user.uid)
      );
      const snap = await getDocs(q);
  
      if (snap.empty) {
        message.info("You have not submitted any request yet.");
        return;
      }
  
      const requestData = snap.docs[0].data();
      const status = requestData.status;
  
      if (status === "accepted") {
        router.push("/member/dashboard");
      } else if (status === "pending") {
        message.info("The request is still under review.");
      } else if (status === "rejected") {
        message.error("You have been rejected. Please choose again.");
      } else {
        message.warning("Unknown request status.");
      }
    } catch (err) {
      console.error("Error checking request status:", err);
      message.error("Failed to check request status.");
    }
  };
  
  
  
  return (
    <div>
      {/* 顶部 Header */}
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={logoStyle}>
            <AppstoreOutlined /> Fitness Tracker
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
          <a
            onClick={handleCheckStatus}
            className="nav-link"
            style={{ color: "#555", fontWeight: 500, cursor: "pointer" }}
          >
            <UserOutlined /> Classes
          </a >
            <Link href="/trainer_search" className="nav-link" style={{ color: "#555", fontWeight: 500 }}>
              🏋️ Trainer
            </Link>
          </div>
        </div>
        <nav style={navStyle}>
          {user ? (
            <Dropdown
              menu={{
                items: [
                  {
                    key: "1",
                    label: <span>Logout</span>,
                    onClick: handleLogout,
                  }, 
                  // { key: "2", label: <span>Profile</span> },
                ],
              }}
              placement="bottomRight"
            >
              <Avatar
                style={{
                  backgroundColor: "#1890ff",
                  verticalAlign: "middle",
                  cursor: "pointer",
                }}
                size="large"
              >
                {(user.name || user.email || "U").charAt(0).toUpperCase()}
              </Avatar>
            </Dropdown>
          ) : (
            <Space>
              <Link href="/login">
                <Button type="primary" ghost>
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button type="primary">
                  Register
                </Button>
              </Link>
            </Space>
          )}
        </nav>
      </header>

      {/* 页面主体内容 */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px" }}>
        <Space direction="vertical" style={{ width: "100%", marginBottom: 20 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Input
                placeholder="Filter by Name Prefix (e.g., A)"
                value={searchNamePrefix}
                onChange={e => setSearchNamePrefix(e.target.value)}
                allowClear
              />
            </Col>
            <Col span={8}>
              <Input
                placeholder="Filter by Trainer ID Keyword"
                value={searchTrainerId}
                onChange={e => setSearchTrainerId(e.target.value)}
                allowClear
              />
            </Col>
            <Col span={8}>
              <Button
                type="primary"
                icon={<UserOutlined />}
                onClick={handleAdvancedSearch}
                loading={loading}
                block
              >
                Advanced Search
              </Button>
            </Col>
          </Row>
        </Space>

        <Spin spinning={loading} tip="Loading..." size="large">
          {currentPageData.length > 0 ? (
            currentPageData.map(trainer => (
              <Card key={trainer.id} style={{ marginBottom: 20 }}>
                <Row>
                <Col span={6} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <img
                      src={trainer.image || "/images/trainer.jpg"} 
                      style={{
                        width: "180px",   
                        height: "240px",  
                        objectFit: "cover",  
                        borderRadius: "8px", 
                        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)"
                      }}
                      alt="Trainer"
                    />
                  </Col>
                  <Col span={18} style={{ padding: 16 }}>
                    <h3>{trainer.name}</h3>
                    <p><strong>Trainer ID:</strong> {trainer.trainerId}</p >
                    {trainer.intro && <p><strong>Introduction:</strong> {trainer.intro}</p >}
                    {trainer.email && <p><strong>Email:</strong> {trainer.email}</p >}
                    {trainer.telephone && <p><strong>Telephone:</strong> {trainer.telephone}</p >}
                    <Button
                      type="primary"
                      onClick={() => openRequestModal(trainer)}
                      style={{ marginTop: 12 }}
                    >
                      {user ? "Send the training request" : "Login to send request"}
                    </Button>
                  </Col>
                </Row>
              </Card>
            ))
          ) : (
            !loading && (
              <Empty
                description="No matching trainers found."
                style={{ marginTop: 50 }}
              />
            )
          )}
        </Spin>

        {filteredTrainers.length > 0 && (
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <Pagination
              current={currentPage}
              pageSize={PAGE_SIZE}
              total={filteredTrainers.length}
              onChange={(page) => setCurrentPage(page)}
              showSizeChanger={false}
            />
          </div>
        )}
      </div>

      {/* 输入训练目标的 Modal */}
      <Modal
        title="Submit your training goal"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSubmitRequest}
        okText="Submit Request"
        cancelText="Cancel"
      >
        <Input.TextArea
          value={trainingGoal}
          onChange={e => setTrainingGoal(e.target.value)}
          placeholder="Describe your training goal..."
          rows={4}
        />
      </Modal>
    </div>
  );
}