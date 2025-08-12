import React, { useEffect, useState } from "react";
import { Form, Input, Select, DatePicker, Button, Row, Col, Space, Card, Table, Spin, Empty } from "antd";
import { useTranslation } from "react-i18next";
import { usePage } from "../contexts/PageContext";
import dayjs from "dayjs";

const { Option } = Select;
const { RangePicker } = DatePicker;

const FinesPage: React.FC = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const { setPageTitle } = usePage();
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    setPageTitle(t("page.title.fines"));
  }, [setPageTitle, t]);

  const disablePastDates = (current: dayjs.Dayjs) => {
    return current && current < dayjs().startOf("day");
  };

  const onFinish = (values: Record<string, unknown>) => {
    setIsLoading(true);

    const params: Record<string, unknown> = {
      ...values,
      dateFrom: values.dateRange
        ? (values.dateRange as [{ toISOString(): string }, { toISOString(): string }])[0].toISOString()
        : undefined,
      dateTo: values.dateRange
        ? (values.dateRange as [{ toISOString(): string }, { toISOString(): string }])[1].toISOString()
        : undefined,
    };
    delete params.dateRange;

    // Simulate API call
    setTimeout(() => {
      const mockData = [
        {
          id: 1,
          fineNumber: "FN-1001",
          supervisorName: "John Doe",
          issuer: "Issuer 1",
          fineType: "Parking Violation",
          section: "A1",
          date: "2025-08-10",
        },
        {
          id: 2,
          fineNumber: "FN-1002",
          supervisorName: "Jane Smith",
          issuer: "Issuer 2",
          fineType: "Speeding",
          section: "B3",
          date: "2025-08-11",
        },
      ];

      setSearchResults(mockData);
      setIsLoading(false);
    }, 800);
  };

  const columns = [
    { title: t("form.fineNumber"), dataIndex: "fineNumber", key: "fineNumber" },
    { title: t("form.supervisorName"), dataIndex: "supervisorName", key: "supervisorName" },
    { title: t("form.issuer"), dataIndex: "issuer", key: "issuer" },
    { title: t("form.fineType"), dataIndex: "fineType", key: "fineType" },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card bordered={false}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={24}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="fineNumber" label={t("form.fineNumber")}>
                <Input placeholder={t("form.fineNumber")} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item name="supervisorName" label={t("form.supervisorName")}>
                <Select placeholder={t("form.supervisorName")} allowClear>
                  <Option value="sup1">{t("supervisors.sup1")}</Option>
                  <Option value="sup2">{t("supervisors.sup2")}</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item name="issuer" label={t("form.issuer")}>
                <Select placeholder={t("form.issuer")} allowClear>
                  <Option value="issuer1">{t("issuers.issuer1")}</Option>
                  <Option value="issuer2">{t("issuers.issuer2")}</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item name="fineType" label={t("form.fineType")}>
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
                <Button type="primary" htmlType="submit" loading={isLoading}>
                  {t("common.search")}
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Spin spinning={isLoading}>
          <Table
            rowSelection={{ type: "checkbox" }}
            columns={columns}
            dataSource={searchResults}
            rowKey="id"
            locale={{ emptyText: <Empty description={t("common.noData")} /> }}
            pagination={{
              showTotal: (total, range) => `${range[0]}-${range[1]} ${t("common.of")} ${total} ${t("common.items")}`,
            }}
          />
        </Spin>
      </Card>
    </Space>
  );
};

export default FinesPage;
