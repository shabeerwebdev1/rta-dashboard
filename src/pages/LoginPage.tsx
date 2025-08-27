import React, { useState } from "react";
import { Form, Input, Button, Checkbox, Card, Row, Col, Space, Divider } from "antd";
import {
  UserOutlined,
  LockOutlined,
  FacebookOutlined,
  YoutubeOutlined,
  LinkedinOutlined,
  InstagramOutlined,
  TwitterOutlined,
} from "@ant-design/icons";
import "../styles/login.css";
import { useNavigate } from "react-router-dom";
import { FULL_PATHS } from "../constants/paths";

const LoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate(); // ✅ useNavigate hook

  const onFinish = async (values: any) => {
    setLoading(true);
    console.log("Login values:", values);
    navigate(FULL_PATHS.SPLASH, { replace: true }); // ✅ navigate programmatically
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="login-container">
      {/* Header */}
      <div className="login-header">
        <div className="header-content">
          <img
            src="https://www.intesolgroup.com/wp-content/uploads/2025/04/9187ca73db1c542a46817cc6d00ce15c-removebg-preview.png"
            alt="Government of Dubai"
            className="header-logo-left"
          />
          <img
            src="https://upload.wikimedia.org/wikipedia/en/d/dd/RTA_Dubai_logo.png"
            alt="RTA Dubai"
            className="header-logo-right"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="login-content ">
        <div className="login-title">
          <h2>Login</h2>
          <p>Login with your RTA Account</p>
        </div>
        <Card className="login-card">
          <div className="login-form-container">
            <Form form={form} name="login" onFinish={onFinish} size="large" layout="vertical">
              <Form.Item
                label="Username"
                name="username"
                // rules={[{ required: true, message: "Please input your username!" }]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: "#EE3941" }} />}
                  placeholder="Username"
                  className="login-input"
                />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                // rules={[{ required: true, message: "Please input your password!" }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: "#EE3941" }} />}
                  placeholder="Password"
                  className="login-input"
                />
              </Form.Item>

              <Form.Item className="login-options">
                <Row justify="space-between" align="middle">
                  <Col>
                    <Form.Item name="remember" valuePropName="checked" noStyle>
                      <Checkbox>Remember Me</Checkbox>
                    </Form.Item>
                  </Col>
                  <Col>
                    <a href="#" className="forgot-password">
                      Forgot Password
                    </a>
                  </Col>
                </Row>
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" className="login-button" loading={loading} block>
                  Login
                </Button>
              </Form.Item>
            </Form>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <div className="login-footer">
        <div className="footer-content">
          <div className="footer-left">
            <Space size="large" className="social-icons">
              <FacebookOutlined />
              <YoutubeOutlined />
              <LinkedinOutlined />
              <InstagramOutlined />
              <TwitterOutlined />
            </Space>
          </div>

          <div className="footer-right">
            <div className="footer-logos">
              <img
                src="https://mir-s3-cdn-cf.behance.net/project_modules/max_1200_webp/1d285a96162913.5ea841691f08c.png"
                alt="Bayanat UAE"
                className="footer-logo1"
              />
              <img
                src="https://www.digitaldubai.ae/ResourcePackages/Theme/assets/dist/images/logo.png"
                alt="Digital Dubai"
                className="footer-logo2"
              />
            </div>
            <p className="footer-text">
              The site is best viewed using IE10 and above, Mozilla Firefox, Safari and Chrome.
            </p>
          </div>
        </div>

        <Divider className="footer-divider" />

        <div className="footer-content">
          <div className="footer-center" style={{ textAlign: "center", width: "100%" }}>
            <p className="footer-text" style={{ fontWeight: "bold" }}>
              Government.ae - The Official Portal of the UAE Government
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
