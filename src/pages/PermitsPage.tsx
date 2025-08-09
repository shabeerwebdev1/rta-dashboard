import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Row,
  Col,
  Space,
  Card,
  Table,
  message,
  Spin,
  Empty,
} from "antd";
import { useTranslation } from "react-i18next";
import { useLazySearchPermitsQuery } from "../services/rtkApiFactory";
import { usePage } from "../contexts/PageContext";
import dayjs from "dayjs";

const { Option } = Select;
const { RangePicker } = DatePicker;

const PermitsPage: React.FC = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const { setPageTitle } = usePage();

  const [searchPermits, { data: searchResults, isLoading, isFetching }] =
    useLazySearchPermitsQuery();

  useEffect(() => {
    setPageTitle(t("page.title.permits"));
  }, [setPageTitle, t]);

  const onFinish = (values: any) => {
    const params = {
      ...values,
      dateFrom: values.dateRange
        ? values.dateRange[0].toISOString()
        : undefined,
      dateTo: values.dateRange ? values.dateRange[1].toISOString() : undefined,
    };
    delete params.dateRange;

    Object.keys(params).forEach(
      (key) => params[key] == null && delete params[key],
    );

    searchPermits(params);
  };

  const columns = [
    {
      title: t("form.permitNumber"),
      dataIndex: "permitNumber",
      key: "permitNumber",
    },
    { title: t("form.permitType"), dataIndex: "permitType", key: "permitType" },
    {
      title: t("form.plateNumber"),
      dataIndex: "plateNumber",
      key: "plateNumber",
    },
    {
      title: t("form.phoneNumber"),
      dataIndex: "phoneNumber",
      key: "phoneNumber",
    },
    {
      title: t("form.fromDate"),
      dataIndex: "validFrom",
      key: "validFrom",
      render: (text: string) => dayjs(text).format("YYYY-MM-DD"),
    },
    {
      title: t("form.toDate"),
      dataIndex: "validTo",
      key: "validTo",
      render: (text: string) => dayjs(text).format("YYYY-MM-DD"),
    },
    {
      title: t("form.authorizedAreas"),
      dataIndex: "authorizedAreas",
      key: "authorizedAreas",
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card title={t("common.search")} bordered={false}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={24}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="permitType" label={t("form.permitType")}>
                <Select placeholder={t("form.permitType")} allowClear>
                  <Option value="VIP">VIP</Option>
                  <Option value="Residential">Residential</Option>
                  <Option value="People of Determination">
                    People of Determination
                  </Option>
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
          </Row>
          <Row justify="end">
            <Space>
              <Button onClick={() => form.resetFields()}>
                {t("common.reset")}
              </Button>
              <Button type="primary" htmlType="submit" loading={isFetching}>
                {t("common.search")}
              </Button>
            </Space>
          </Row>
        </Form>
      </Card>
      <Card title="Search Results" bordered={false}>
        <Spin spinning={isLoading || isFetching}>
          <Table
            columns={columns}
            dataSource={searchResults}
            rowKey="id"
            locale={{ emptyText: <Empty description={t("common.noData")} /> }}
            pagination={{
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} ${t("common.items")}`,
            }}
          />
        </Spin>
      </Card>
    </Space>
  );
};

export default PermitsPage;
