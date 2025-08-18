import React, { useEffect, useState } from "react";
import { Form, Input, Select, DatePicker, Button, Row, Col, Space, Card, Table, Empty, Dropdown } from "antd";
import { useTranslation } from "react-i18next";
import { usePage } from "../contexts/PageContext";
import { MoreOutlined, EyeOutlined, EnvironmentOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import dayjs from "dayjs";
import { useSearchFinesQuery } from "../services/rtkApiFactory";
import useTableParams from "../hooks/useTableParams";
import FinesViewDrawer from "../components/fines/FinesViewDrawer";

const { Option } = Select;
const { RangePicker } = DatePicker;

const FinesPage: React.FC = () => {
  const { t } = useTranslation();
  const { setPageTitle } = usePage();
  const [form] = Form.useForm();
  const { apiParams, handleTableChange, setSearchFilters } = useTableParams();

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedFine, setSelectedFine] = useState<any>(null);
  const [focusSection, setFocusSection] = useState<"details" | "photos" | "location" | null>(null);

  const { data, isFetching, isLoading } = useSearchFinesQuery(apiParams, {
    refetchOnMountOrArgChange: true,
  });

  const searchResults = data?.data || [];
  const totalRecords = data?.total || 0;

  useEffect(() => {
    setPageTitle(t("page.title.fines"));
  }, [setPageTitle, t]);

  const onFinish = (values: Record<string, unknown>) => {
    const params: Record<string, unknown> = {
      ...values,
      dateFrom: values.dateRange ? (values.dateRange as any)[0].toISOString() : undefined,
      dateTo: values.dateRange ? (values.dateRange as any)[1].toISOString() : undefined,
    };
    delete params.dateRange;

    setSearchFilters(params);
  };

  const handleView = (record: any, section: "details" | "photos" | "location" = "details") => {
    setSelectedFine(record);
    setFocusSection(section);
    setDrawerVisible(true);
  };

  const columns = [
    { title: t("form.fineNumber"), dataIndex: "fineNo", key: "fineNo", sorter: true },
    { title: t("form.supervisorName"), dataIndex: "supervisor", key: "supervisor", sorter: true },
    {
      title: t("form.amount"),
      dataIndex: "fineAmount",
      key: "fineAmount",
      sorter: true,
      render: (amount: number) => (amount != null ? `${amount} AED` : t("common.noData")),
    },
    {
      title: t("form.date"),
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: true,
      render: (date: string) => (date ? dayjs(date).format("YYYY-MM-DD ") : t("common.noData")),
    },
    {
      title: t("common.action"),
      key: "action",
      align: "center" as const,
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
      <Card bordered={false}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={24}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="FineNo" label={t("form.fineNumber")}>
                <Input placeholder={t("form.fineNumber")} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="Supervisor" label={t("form.supervisorName")}>
                <Input placeholder={t("form.supervisorName")} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="Issuer" label={t("form.issuer")}>
                <Input placeholder={t("form.issuer")} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="InspectionType" label={t("form.fineType")}>
                <Select placeholder={t("form.fineType")} allowClear>
                  <Option value={0}>Parking Violation</Option>
                  <Option value={1}>Over Speeding</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="Section" label={t("form.section")}>
                <Input placeholder={t("form.section")} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="dateRange" label={t("form.dateRange")}>
                <RangePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={12} style={{ textAlign: "right", alignSelf: "flex-end" }}>
              <Form.Item>
                <Space>
                  <Button
                    onClick={() => {
                      form.resetFields();
                      setSearchFilters({});
                    }}
                  >
                    {t("common.reset")}
                  </Button>
                  <Button type="primary" htmlType="submit" loading={isFetching}>
                    {t("common.search")}
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card bordered={false} bodyStyle={{ padding: "5px 5px 0 5px" }}>
        <Table
          rowSelection={{ type: "checkbox" }}
          columns={columns}
          dataSource={searchResults}
          rowKey="id"
          loading={isLoading || isFetching}
          onChange={handleTableChange}
          pagination={{
            current: apiParams.PageNumber,
            pageSize: apiParams.PageSize,
            total: totalRecords,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} ${t("common.items")}`,
          }}
          locale={{ emptyText: <Empty description={t("common.noData")} /> }}
        />
      </Card>

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