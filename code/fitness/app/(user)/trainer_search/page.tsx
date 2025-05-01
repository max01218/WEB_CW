"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Input, Button, Card, Row, Col, Spin, message, Pagination, Empty, Modal, Space, Popover, Badge, List } from "antd";
import { AppstoreOutlined, UserOutlined, BellOutlined, CheckOutlined } from "@ant-design/icons";
import { collection, getDocs, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { db } from "@/lib/firebase";
import { useLoginModal } from "@/app/components/LoginModalContext";
import { Avatar, Dropdown, Typography } from "antd";
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

  // Control pop-up window
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTrainer, setCurrentTrainer] = useState<Trainer | null>(null);
  const [trainingGoal, setTrainingGoal] = useState("");
  const [notifications, setNotifications] = useState<
  Array<{ id: string; description: string; read: boolean; type: string }>>([]);


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
    console.log(user)
    try {
      // Query whether the current user has any "uncompleted" requests.
      const q = query(
        collection(db, "requests"),
        where("memberId", "==", user.uid),
        where("status", "in", ["pending", "accepted"])
      );
      console.log('q='+q)
      const snap = await getDocs(q);
      console.log("snap"+snap)
  
      if (!snap.empty) {
        message.warning("You already have a pending request. Please wait for the coach's reply.");
        return;
      }
  
      // submit new requests
      await addDoc(collection(db, "requests"), {
        memberId: user.uid,
        memberName: user.email,
        requesterUid: user.uid,
        trainerId: currentTrainer.trainerId,
        trainerName: currentTrainer.name,
        trainingGoal: trainingGoal.trim(),
        requestedAt: serverTimestamp(),
        status: "pending",
      });
  
      message.success("Training request sent successfully!");
      setIsModalOpen(false);
      setTrainingGoal("");
    } catch (error) {
      console.error("Error submitting request:", error);
      message.error("Failed to send request.");
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
        where("memberId", "==", user.uid),
        orderBy("requestedAt", "desc") // Sort by date in descending order
      );
      const snap = await getDocs(q);
  
      if (snap.empty) {
        message.info("You have not submitted any request yet.");
        return;
      }
  
      const latestRequest = snap.docs[0].data(); // newest one
      const status = latestRequest.status;
  
      if (status === "accepted") {
        router.push("/member/dashboard");
      } else if (status === "pending") {
        message.info("You already have a pending request. Please wait for the coach's reply.");
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
  
  
  
  useEffect(() => {
    if (!user?.email) return;
    const q = query(
      collection(db, 'notifications'),
      where('email', '==', user.email),
      where('type', '==', 'rejected')
    );
    console.log((q as any)._query?.filters);
   // onSnapshot push updates, additions and modifications in real time.
   const unsubscribe = onSnapshot(q, (snap) => {
    const arr: any[] = [];
    snap.docs.forEach((d) => arr.push({ id: d.id, ...(d.data() as any) }));
    setNotifications(arr);

    // A prompt pops up when a new notice arrives.
    const newUnread = arr.filter((n) => !n.read);
    if (newUnread.length > 0) {
      message.info(`You have ${newUnread.length} new notification(s)`);
    }
  });

    return () => unsubscribe();
  }, [user?.email]);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  const markAsRead = async (notifId: string) => {
    await updateDoc(doc(db, 'notifications', notifId), { read: true });
  };
  const popoverContent = (
    <List
      size="small"
      dataSource={notifications}
      locale={{ emptyText: 'No notifications' }}
      renderItem={item => (
        <List.Item onClick={() => markAsRead(item.id)} style={{ cursor: 'pointer' }}>
          <Typography.Text strong={!item.read}>{item.description}</Typography.Text>
        </List.Item>
      )}
    />
  );
  return (
    <div>
      {/* Header */}
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
          </a>
            <Link href="/trainer_search" className="nav-link" style={{ color: "#555", fontWeight: 500 }}>
              🏋️ Trainer
            </Link>
          </div>
        </div>
        <nav style={navStyle}>
            <Popover
              content={popoverContent}
              title={
                <div style={{
                  padding: '8px 4px',
                  fontSize: '16px',
                  fontWeight: 600,
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  Notifications
                </div>
              }
              trigger="click"
              placement="bottomRight"
              overlayStyle={{ 
                width: 350,
                padding: 0
              }}
              overlayInnerStyle={{
                borderRadius: '12px',
                boxShadow: '0 6px 16px rgba(0,0,0,0.08)'
              }}
            >
              <Badge 
                count={unreadCount} 
                offset={[-2, 2]}
                style={{
                  backgroundColor: '#ff4d4f'
                }}
              >
                <Button
                  type="text"
                  icon={<BellOutlined style={{ 
                    fontSize: '22px',
                    color: 'rgba(0, 0, 0, 0.65)'
                  }} />}
                />
              </Badge>
            </Popover>

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
        title="Submit your training goal and expected time"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSubmitRequest}
        okText="Submit Request"
        cancelText="Cancel"
      >
        <Input.TextArea
          value={trainingGoal}
          onChange={e => setTrainingGoal(e.target.value)}
          placeholder="Describe your training goal and expected time..."
          rows={4}
        />
      </Modal>
    </div>
  );
}