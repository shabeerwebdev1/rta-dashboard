import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Checkbox,
  Card,
  Row,
  Col,
  Space,
  Divider,
  Typography,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  FacebookOutlined,
  YoutubeOutlined,
  LinkedinOutlined,
  InstagramOutlined,
  TwitterOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { FULL_PATHS } from "../constants/paths";

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    setLoading(true);
    console.log("Login values:", values);
    navigate(FULL_PATHS.SPLASH, { replace: true });
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <Row style={{ minHeight: "100vh" }} justify="center" align="middle">
      <Col span={22}>
        {/* Header */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 32 }}>
          <Col>
            <img
              src="https://www.intesolgroup.com/wp-content/uploads/2025/04/9187ca73db1c542a46817cc6d00ce15c-removebg-preview.png"
              alt="Government of Dubai"
              style={{ height: 80 }}
            />
          </Col>
          <Col>
            <img
              src="https://upload.wikimedia.org/wikipedia/en/d/dd/RTA_Dubai_logo.png"
              alt="RTA Dubai"
              style={{ height: 80 }}
            />
          </Col>
        </Row>

        {/* Content */}
        <Row justify="center">
          <Col xs={24} sm={20} md={14} lg={10} xl={8}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <Title level={2}>Login</Title>
              <Text type="secondary">Login with your RTA Account</Text>
            </div>

            <Card>
              <Form
                form={form}
                name="login"
                onFinish={onFinish}
                size="large"
                layout="vertical"
              >
                <Form.Item label="Username" name="username">
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="Username"
                  />
                </Form.Item>

                <Form.Item label="Password" name="password">
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Password"
                  />
                </Form.Item>

                <Form.Item>
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Form.Item name="remember" valuePropName="checked" noStyle>
                        <Checkbox>Remember Me</Checkbox>
                      </Form.Item>
                    </Col>
                    <Col>
                      <a href="#">Forgot Password</a>
                    </Col>
                  </Row>
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                  >
                    Login
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>

        {/* Footer */}
        <div style={{ marginTop: 48 }}>
          <Row justify="space-between" align="top">
            <Col>
              <Space size="large">
                <FacebookOutlined style={{ fontSize: 24 }} />
                <YoutubeOutlined style={{ fontSize: 24 }} />
                <LinkedinOutlined style={{ fontSize: 24 }} />
                <InstagramOutlined style={{ fontSize: 24 }} />
                <TwitterOutlined style={{ fontSize: 24 }} />
              </Space>
            </Col>
            <Col>
              <Space size="large">
                <img
                  src="https://mir-s3-cdn-cf.behance.net/project_modules/max_1200_webp/1d285a96162913.5ea841691f08c.png"
                  alt="Bayanat UAE"
                  style={{ height: 60 }}
                />
                <img
                  src="https://www.digitaldubai.ae/ResourcePackages/Theme/assets/dist/images/logo.png"
                  alt="Digital Dubai"
                  style={{ height: 50 }}
                />
              </Space>
              <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
                The site is best viewed using IE10 and above, Mozilla Firefox, Safari and Chrome.
              </Text>
            </Col>
          </Row>

          <Divider />

          <Row justify="center">
            <Text strong>
              Government.ae - The Official Portal of the UAE Government
            </Text>
          </Row>
        </div>
      </Col>
    </Row>
  );
};

export default LoginPage;