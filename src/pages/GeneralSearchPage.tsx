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
  Descriptions,
} from "antd";
import { usePage } from "../contexts/PageContext";
import { useTranslation } from "react-i18next";

const { Option } = Select;

const GeneralSearchPage: React.FC = () => {
  const { setPageTitle } = usePage();
  const [form] = Form.useForm();
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    setPageTitle("General Search");
  }, [setPageTitle]);

  const onFinish = (values: Record<string, any>) => {
    console.log("Form values:", values);

    // Example mock data
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
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={16}>
            <Col xs={24} sm={6}>
              <Form.Item
                name="plateSource"
                label={t("form.plateSource")}
                rules={[{ required: true, message: "Please select a plate source" }]}
              >
                <Select placeholder={t("placeholders.plateSource")}>
                  <Option value="dubai">Dubai</Option>
                  <Option value="sharjah">Sharjah</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={6}>
              <Form.Item
                name="plateCategory"
                label={t("form.plateCategory")}
                rules={[{ required: true, message: "Please select a category" }]}
              >
                <Select placeholder={t("placeholders.plateCategory")}>
                  <Option value="private">Private</Option>
                  <Option value="commercial">Commercial</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={6}>
              <Form.Item
                name="plateCode"
                label={t("form.plateCode")}
                rules={[{ required: true, message: "Please select a code" }]}
              >
                <Select placeholder={t("placeholders.plateCode")}>
                 
                  <Option value="a">A</Option>
                  <Option value="b">B</Option>
                  <Option value="c">C</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={6}>
              <Form.Item
                name="plateNumber"
                label={t("form.plateNumber")}
                rules={[{ required: true, message: "Please enter plate number" }]}
              >
                <Input placeholder={t("placeholders.plateNumber")} />
              </Form.Item>
            </Col>

            <Col xs={24} style={{ textAlign: "right", marginTop: 30 }}>
              <Space>
                <Button onClick={() => { form.resetFields(); setSearchResult(null); }}>
                  Reset
                </Button>
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
