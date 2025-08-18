import React, { useEffect } from "react";
import { Form, Input, Select, DatePicker, Button, Row, Col, Space, Card, Table, Empty } from "antd";
import { useTranslation } from "react-i18next";
import { useSearchPermitsQuery } from "../services/rtkApiFactory";
import { usePage } from "../contexts/PageContext";
import { useTableParams } from "../hooks/useTableParams";
import dayjs from "dayjs";
import { searchConfig } from "../config/searchConfig";

const { Option } = Select;
const { RangePicker } = DatePicker;

const PermitsPage: React.FC = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const { setPageTitle } = usePage();
  const pageKey = "permits";
  const { apiParams, handleTableChange, setSearchFilters } = useTableParams(searchConfig[pageKey]);

  const { data, isLoading, isFetching } = useSearchPermitsQuery(apiParams, {
    refetchOnMountOrArgChange: true,
  });

  const searchResults = data?.data || [];
  const totalRecords = data?.total || 0;

  useEffect(() => {
    setPageTitle(t("page.title.permits"));
  }, [setPageTitle, t]);

  const onFinish = (values: Record<string, unknown>) => {
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

    Object.keys(params).forEach((key) => params[key] == null && delete params[key]);

    setSearchFilters(params);
  };

  const columns = [
    { title: t("form.permitNumber"), dataIndex: "permitNumber", key: "permitNumber", sorter: true },
    { title: t("form.permitType"), dataIndex: "permitType", key: "permitType", sorter: true },
    { title: t("form.plateNumber"), dataIndex: "plateNumber", key: "plateNumber", sorter: true },
    { title: t("form.phoneNumber"), dataIndex: "phoneNumber", key: "phoneNumber" },
    {
      title: t("form.fromDate"),
      dataIndex: "validFrom",
      key: "validFrom",
      render: (text: string) => dayjs(text).format("YYYY-MM-DD"),
      sorter: true,
    },
    {
      title: t("form.toDate"),
      dataIndex: "validTo",
      key: "validTo",
      render: (text: string) => dayjs(text).format("YYYY-MM-DD"),
      sorter: true,
    },
    { title: t("form.authorizedAreas"), dataIndex: "authorizedAreas", key: "authorizedAreas" },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card bordered={false}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={24}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="permitType" label={t("form.permitType")}>
                <Select placeholder={t("form.permitType")} allowClear>
                  <Option value="VIP">VIP</Option>
                  <Option value="Residential">Residential</Option>
                  <Option value="People of Determination">People of Determination</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="permitNumber" label={t("form.permitNumber")}>
                <Input placeholder={t("form.permitNumber")} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="plateNumber" label={t("form.plateNumber")}>
                <Input placeholder={t("form.plateNumber")} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="phoneNumber" label={t("form.phoneNumber")}>
                <Input placeholder={t("form.phoneNumber")} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="dateRange" label={t("form.dateRange")}>
                <RangePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} style={{ textAlign: "right", alignSelf: "flex-end" }}>
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
    </Space>
  );
};

export default PermitsPage;