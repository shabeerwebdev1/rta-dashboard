import React, { useEffect, useState } from "react";
import { Form, Input, Select, DatePicker, Button, Row, Col, Space, Card, Table, Spin, Empty, Tabs } from "antd";
import { useSearchPermitsQuery } from "../services/rtkApiFactory";
import { usePage } from "../contexts/PageContext";
import dayjs from "dayjs";

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const GeneralSearchPage: React.FC = () => {
  const { setPageTitle } = usePage();
  const [activeTab, setActiveTab] = useState("permits");
  const [form] = Form.useForm();

  const { data, isLoading, isFetching } = useSearchPermitsQuery({
    refetchOnMountOrArgChange: true,
  });

  // dummy data
  const dummyPlate = [
    {
      key: "1",
      plateNumber: "1234",
      plateCode: "ABCD",
      vehicleType: "Car",
      ownerName: "John Doe",
      phoneNumber: "1234567890",
    },
  ];

  const dummyTrade = [
    {
      key: "2",
      tradeLicense: "TL123456",
      companyName: "Example Company",
      ownerName: "Jane Smith",
      phoneNumber: "0987654321",
    },
  ];

  const dummyEtraffic = [
    {
      key: "3",
      plateNumber: "5678",
      plateCode: "EFGH",
      violationType: "Speeding",
      fineAmount: 500,
      violationDate: "2023-10-01",
    },
  ];

  useEffect(() => {
    if (activeTab === "permits") {
      setPageTitle("Permit Search");
    } else if (activeTab === "plate") {
      setPageTitle("Plate Search");
    } else if (activeTab === "e-traffic") {
      setPageTitle("E-Traffic Search");
    } else if (activeTab === "trade") {
      setPageTitle("Trade License Search");
    }
  }, [activeTab, setPageTitle]);

  const onFinish = (values: Record<string, any>) => {
    if (activeTab === "permits") {
      const params: Record<string, any> = {
        ...values,
        dateFrom: values.dateRange ? values.dateRange[0].toISOString() : undefined,
        dateTo: values.dateRange ? values.dateRange[1].toISOString() : undefined,
      };
      delete params.dateRange;

      // remove null/undefined values
      Object.keys(params).forEach((key) => params[key] == null && delete params[key]);
    }
  };

  const permitColumns = [
    { title: "Permit Number", dataIndex: "permitNumber", key: "permitNumber" },
    { title: "Permit Type", dataIndex: "permitType", key: "permitType" },
    { title: "Plate Number", dataIndex: "plateNumber", key: "plateNumber" },
    { title: "Phone Number", dataIndex: "phoneNumber", key: "phoneNumber" },
    {
      title: "From Date",
      dataIndex: "validFrom",
      key: "validFrom",
      render: (text: string) => (text ? dayjs(text).format("YYYY-MM-DD") : "-"),
    },
    {
      title: "To Date",
      dataIndex: "validTo",
      key: "validTo",
      render: (text: string) => (text ? dayjs(text).format("YYYY-MM-DD") : "-"),
    },
    {
      title: "Authorized Areas",
      dataIndex: "authorizedAreas",
      key: "authorizedAreas",
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card bordered={false}>
        {/* Tabs above form fields */}
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            form.resetFields();
          }}
          type="card"
        >
          <TabPane tab="Permits" key="permits" />
          <TabPane tab="Plate" key="plate" />
          <TabPane tab="E-Traffic" key="e-traffic" />
          <TabPane tab="Trade" key="trade" />
        </Tabs>

        {/* Form */}
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={24}>
            {activeTab === "permits" && (
              <>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="permitType" label="Permit Type">
                    <Select placeholder="Select Permit Type" allowClear>
                      <Option value="VIP">VIP</Option>
                      <Option value="Residential">Residential</Option>
                      <Option value="People of Determination">People of Determination</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="permitNumber" label="Permit Number">
                    <Input placeholder="Permit Number" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="plateNumber" label="Plate Number">
                    <Input placeholder="Plate Number" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="phoneNumber" label="Phone Number">
                    <Input placeholder="Phone Number" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="dateRange" label="Date Range">
                    <RangePicker style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </>
            )}

            {activeTab === "plate" && (
              <>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="plateNumber" label="Plate Number">
                    <Input placeholder="Enter Plate Number" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="plateCode" label="Plate Code">
                    <Input placeholder="Enter Plate Code" />
                  </Form.Item>
                </Col>
              </>
            )}

            {activeTab === "trade" && (
              <>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="tradeLicense" label="Trade License">
                    <Input placeholder="Enter Trade License" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="companyName" label="Company Name">
                    <Input placeholder="Enter Company Name" />
                  </Form.Item>
                </Col>
              </>
            )}

            {/* Buttons at end */}
            <Col xs={24} style={{ textAlign: "right", marginTop: 30 }}>
              <Space>
                <Button onClick={() => form.resetFields()}>Reset</Button>
                <Button type="primary" htmlType="submit" loading={activeTab === "permits" && isFetching}>
                  Search
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Table */}
      <Card bordered={false} bodyStyle={{ padding: "5px 5px 0 5px" }}>
        <Spin spinning={activeTab === "permits" && (isLoading || isFetching)}>
          <Table
            rowSelection={{ type: "checkbox" }}
            columns={permitColumns}
            dataSource={
              activeTab === "permits"
                ? data?.data || []
                : activeTab === "plate"
                  ? dummyPlate
                  : activeTab === "trade"
                    ? dummyTrade
                    : dummyEtraffic
            }
            rowKey="key"
            locale={{ emptyText: <Empty description="No Data" /> }}
            pagination={{
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            }}
          />
        </Spin>
      </Card>
    </Space>
  );
};

export default GeneralSearchPage;
