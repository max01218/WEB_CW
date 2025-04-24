// app/(user)/trainer/page.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Input, Button, Card, Row, Col, Spin, message } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "@/lib/firebase";
import { useLoginModal } from "@/app/components/LoginModalContext";

interface Trainer {
  id: string;            // Firestore 文档 ID
  name: string;
  trainerId: string;
  intro?: string;
  email?: string;
  telephone?: string;
  image?: string;
}

export default function TrainerPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Trainer[]>([]);
  const [user, setUser] = useState<null | { uid: string; email?: string }>(null);
  const { showLogin } = useLoginModal();

  // 监听登录状态
  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, (u) => {
      if (u) setUser({ uid: u.uid, email: u.email ?? undefined });
      else setUser(null);
    });
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      message.warning("Enter the name or ID of the Trainer");
      return;
    }

    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "trainer"));
      const list = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      setResults(list.filter(t => t.name.includes(searchTerm) || t.trainerId.includes(searchTerm)));
    } catch (e) {
      message.error("The query failed. Please try again later");
    } finally {
      setLoading(false);
    }
  };

   // 真正发送请求 目前只发送了教练id 请求的uid 和请求时间
   const actuallySendRequest = useCallback(
    async (trainer: Trainer) => {
      try {
        await addDoc(collection(db, "requests"), {
          trainerId: trainer.trainerId,
          requesterUid: user!.uid,
          requestedAt: serverTimestamp(),
        });
        message.success("The training request has been sent!");
      } catch {
        message.error("The sending failed. Please try again");
      }
    },
    [user]
  );
  
  const sendRequest = async (trainer: Trainer) => {
    console.log("sendRequest click, user =", user);
    if (!user) {
      showLogin();
      return;
    }
    actuallySendRequest(trainer);
  };

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 20px" }}>
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col flex="auto">
          <Input
            placeholder="Enter the name or ID of the Trainer"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onPressEnter={handleSearch}
            suffix={<SearchOutlined onClick={handleSearch} style={{ cursor: "pointer" }} />}
          />
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
            loading={loading}
          >
            Search
          </Button>
        </Col>
      </Row>

      <Spin spinning={loading} tip="Loading...">
        {results.map(trainer => (
          <Card key={trainer.id} style={{ marginBottom: 20 }}>
            <Row>
              <Col span={6}>
                <img src={trainer.image || "@/public/images/trainer.jpg"} style={{ width: "100%" }} />
              </Col>
              <Col span={18} style={{ padding: 16 }}>
                <h3>{trainer.name}</h3>
                <p><strong>Trainer ID:</strong>{trainer.trainerId}</p>
                {trainer.intro && (
                  <p><strong>Introduction:</strong>{trainer.intro}</p>
                )}
                {trainer.email && (
                  <p><strong>Email:</strong>{trainer.email}</p>
                )}
                {trainer.telephone && (
                  <p><strong>telephone:</strong>{trainer.telephone}</p>
                )}
                <Button
                  type="primary"
                  onClick={() => sendRequest(trainer)}
                  style={{ marginTop: 12 }}
                >
                  {user ? "Send the training request" : "Login to send request"}
                </Button>
              </Col>
            </Row>
          </Card>
        ))}
      </Spin>

      {!loading && results.length === 0 && (
        <p>There is no matching Trainer for the time being.</p>
      )}
    </div>
  );
}