import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Space,
  Card,
  Tabs,
  Descriptions,
} from "antd";
import { usePage } from "../contexts/PageContext";
import { useTranslation } from "react-i18next";

const { Option } = Select;
const { TabPane } = Tabs;

const GeneralSearchPage: React.FC = () => {
  const { setPageTitle } = usePage();
  const [activeTab, setActiveTab] = useState("car-Plate");
  const [form] = Form.useForm();
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    setPageTitle("General Search");
  }, [activeTab, setPageTitle]);

  const onFinish = (values: Record<string, any>) => {
    console.log("Form values:", values);

    // Hardcoded result (mock data)
    setSearchResult({
      vehicleBrand: "Toyota",
      vehicleType: "SUV",
      vehicleColor: "White",
      manufacturerYear: "2020",
      ownerName: "John Doe",
      ownerContact: "+971 55 123 4567",
    });
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card bordered={false}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            form.resetFields();
            setSearchResult(null); // Clear results when switching tabs
          }}
          type="card"
        >
          <TabPane tab={t("tabs.carPlate")} key="car-Plate" />
          <TabPane tab={t("tabs.tradeLicense")} key="trade-license" />
        </Tabs>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={16}>
            {activeTab === "car-Plate" && (
              <Col xs={24}>
                <Row gutter={16}>
                  <Col xs={24} sm={6}>
                    <Form.Item name="plateSource" label={t("form.plateSource")}>
                      <Select placeholder={t("placeholders.plateSource")}>
                        <Option value="source1">source1</Option>
                        <Option value="source2">source2</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Form.Item name="plateCategory" label={t("form.plateCategory")}>
                      <Select placeholder={t("placeholders.plateCategory")}>
                        <Option value="cat1">Category 1</Option>
                        <Option value="cat2">Category 2</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Form.Item name="plateCode" label={t("form.plateCode")}>
                      <Select placeholder={t("placeholders.plateCode")}>
                        <Option value="code1">Code 1</Option>
                        <Option value="code2">Code 2</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Form.Item name="plateNumber" label={t("form.plateNumber")}>
                      <Input placeholder={t("placeholders.plateNumber")} />
                    </Form.Item>
                  </Col>
                </Row>
              </Col>
            )}

            {activeTab === "trade-license" && (
              <>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="zone" label="Zone">
                    <Input placeholder="Enter Zone" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="area" label="Area">
                    <Input placeholder="Enter Area" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="licenseNumber" label="License Number">
                    <Input placeholder="Enter License Number" />
                  </Form.Item>
                </Col>
              </>
            )}

            <Col xs={24} style={{ textAlign: "right", marginTop: 30 }}>
              <Space>
                <Button onClick={() => form.resetFields()}>Reset</Button>
                <Button type="primary" htmlType="submit">
                  Search
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Search Result Section */}
      {searchResult && (
        <Card title="Search Result" bordered>
          <Descriptions bordered column={1} size="middle">
            <Descriptions.Item label="Vehicle Brand">
              {searchResult.vehicleBrand}
            </Descriptions.Item>
            <Descriptions.Item label="Vehicle Type">
              {searchResult.vehicleType}
            </Descriptions.Item>
            <Descriptions.Item label="Vehicle Color">
              {searchResult.vehicleColor}
            </Descriptions.Item>
            <Descriptions.Item label="Manufacturer Year">
              {searchResult.manufacturerYear}
            </Descriptions.Item>
            <Descriptions.Item label="Owner Name">
              {searchResult.ownerName}
            </Descriptions.Item>
            <Descriptions.Item label="Owner Contact">
              {searchResult.ownerContact}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </Space>
  );
};

export default GeneralSearchPage;
