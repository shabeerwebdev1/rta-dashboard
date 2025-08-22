import React, { useEffect, useState } from "react";
import { Form, Input, Select, DatePicker, Button, Row, Col, Space, Card, Table, Spin, Empty, Dropdown } from "antd";
import { useTranslation } from "react-i18next";
import { usePage } from "../contexts/PageContext";
import { MoreOutlined, EyeOutlined, EnvironmentOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import dayjs from "dayjs";
import { useLazySearchFinesQuery } from "../services/rtkApiFactory";
import FinesViewDrawer from "../components/fines/FinesViewDrawer";

const { Option } = Select;
const { RangePicker } = DatePicker;

const FinesPage: React.FC = () => {
  const { t } = useTranslation();
  const { setPageTitle } = usePage();
  const [form] = Form.useForm();

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedFine, setSelectedFine] = useState<any>(null);
  const [focusSection, setFocusSection] = useState<"details" | "photos" | "location" | null>(null);

  // lazy query usage
  const [searchFines, { data: searchResults = [], isFetching }] = useLazySearchFinesQuery();

  useEffect(() => {
    setPageTitle(t("page.title.fines"));
  }, [setPageTitle, t]);

  const disablePastDates = (current: dayjs.Dayjs) => current && current < dayjs().startOf("day");

  const onFinish = (values: Record<string, unknown>) => {
    const params: Record<string, unknown> = {
      ...values,
      dateFrom: values.dateRange ? (values.dateRange as any)[0].toISOString() : undefined,
      dateTo: values.dateRange ? (values.dateRange as any)[1].toISOString() : undefined,
    };
    delete params.dateRange;

    searchFines(params);
  };

  const handleView = (record: any, section: "details" | "photos" | "location" = "details") => {
    setSelectedFine(record);
    setFocusSection(section);
    setDrawerVisible(true);
  };

  const columns = [
    { title: t("form.fineNumber"), dataIndex: "fineNo", key: "fineNo" },
    { title: t("form.supervisorName"), dataIndex: "supervisor", key: "supervisor" },
    {
      title: t("form.amount"),
      dataIndex: "fineAmount",
      key: "fineAmount",
      render: (amount: number) => (amount != null ? `${amount} AED` : t("common.noData")),
    },
    {
      title: t("form.date"),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => (date ? dayjs(date).format("YYYY-MM-DD ") : t("common.noData")),
    },

    // Action column with location icon
    {
      title: "",
      key: "action",
      align: "center",
      width: 100,
      render: (_: any, record: any) => {
        const menuItems: MenuProps["items"] = [
          {
            key: "view",
            label: t("common.view"),
            icon: <EyeOutlined />,
            onClick: () => handleView(record),
          },
        ];
        return (
          <Space>
            {record.latitude && record.longitude && (
              <Button type="text" icon={<EnvironmentOutlined />} onClick={() => handleView(record, "location")} />
            )}
            <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* Search Form */}
      <Card bordered={false}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={24}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="fineNo" label={t("form.fineNumber")}>
                <Input placeholder={t("form.fineNumber")} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="supervisor" label={t("form.supervisorName")}>
                <Select placeholder={t("form.supervisorName")} allowClear>
                  <Option value="admin">admin</Option>
                  <Option value="user">User</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="createdBy" label={t("form.issuer")}>
                <Select placeholder={t("form.issuer")} allowClear>
                  <Option value="issuer1">Issuer 1</Option>
                  <Option value="issuer2">Issuer 2</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="inspectionType" label={t("form.fineType")}>
                <Input placeholder={t("form.fineType")} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="section" label={t("form.section")}>
                <Input placeholder={t("form.section")} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="dateRange" label={t("form.dateRange")}>
                <RangePicker style={{ width: "100%" }} disabledDate={disablePastDates} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={12} style={{ textAlign: "right", marginTop: 30 }}>
              <Space>
                <Button onClick={() => form.resetFields()}>{t("common.reset")}</Button>
                <Button type="primary" htmlType="submit" loading={isFetching}>
                  {t("common.search")}
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Results Table */}
      <Card bordered={false} bodyStyle={{ padding: "5px 5px 0 5px" }}>
        <Spin spinning={isFetching}>
          <Table
            rowSelection={{ type: "checkbox" }}
            columns={columns}
            dataSource={searchResults}
            rowKey="id"
            locale={{
              emptyText: <Empty description={t("common.noData")} />,
            }}
            pagination={{
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} ${t("common.items")}`,
            }}
          />
        </Spin>
      </Card>

      {/* View Drawer */}
      <FinesViewDrawer
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        fine={selectedFine}
        focusSection={focusSection}
      />
    </Space>
  );
};

export default FinesPage;
