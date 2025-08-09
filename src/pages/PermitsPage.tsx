import React, { useEffect } from "react";
import {
  Input,
  Button,
  Space,
  Card,
  DatePicker,
  Select,
  Row,
  Col,
  Form,
} from "antd";
import { usePage } from "../contexts/PageContext";
import usePageLoader from "../hooks/usePageLoader";
import PageLoader from "../components/common/PageLoader";

const { Option } = Select;
const { RangePicker } = DatePicker;

const PermitsPage: React.FC = () => {
  // Assuming you have the page title and loading context set up
  const { setPageTitle } = usePage();
  const pageLoading = usePageLoader();

  useEffect(() => {
    setPageTitle("Permits Management");
  }, [setPageTitle]);

  if (pageLoading) return <PageLoader />;

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card
        style={{
          borderRadius: 8,
        }}
      >
        <Form layout="vertical">
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="permitType"
                label="Permit Type"
                rules={[
                  { required: true, message: "Please select permit type" },
                ]}
              >
                <Select size="large" placeholder="Select Type">
                  <Option value="residential">Residential</Option>
                  <Option value="commercial">Commercial</Option>
                  <Option value="visitor">Visitor</Option>
                  <Option value="special">Special Event</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="permitNumber"
                label="Permit Number"
                rules={[
                  { required: true, message: "Please enter permit number" },
                ]}
              >
                <Input size="large" placeholder="Enter Permit Number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="plateNumber"
                label="Plate Number"
                rules={[
                  { required: true, message: "Please enter plate number" },
                ]}
              >
                <Input size="large" placeholder="Enter Plate Number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phoneNumber"
                label="Phone Number"
                rules={[
                  { required: true, message: "Please enter phone number" },
                ]}
              >
                <Input size="large" placeholder="Enter Phone Number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="dateRange"
                label="Date Range"
                rules={[
                  { required: true, message: "Please select date range" },
                ]}
              >
                <RangePicker style={{ width: "100%" }} size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row justify="end" gutter={12}>
            <Col>
              <Button type="default">Reset</Button>
            </Col>
            <Col>
              <Button type="primary">Search</Button>
            </Col>
          </Row>
        </Form>
      </Card>
    </Space>
  );
};

export default PermitsPage;
