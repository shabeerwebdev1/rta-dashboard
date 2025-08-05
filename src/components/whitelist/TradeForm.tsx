/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Form, Input, DatePicker, Button, Space, Row, Col, Select } from "antd";
import { useTranslation } from "react-i18next";

interface TradeFormValues {
  tradeLicenseNumber: string;
  tradeLicenseName: string;
  startDate: string;
  endDate: string;
  zone: string;
  priority: boolean;
  notes?: string;
  document?: any[];
}

interface TradeFormProps {
  onSubmit: (values: TradeFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const TradeForm: React.FC<TradeFormProps> = ({
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const [form] = Form.useForm();
  const { t } = useTranslation();

  const normFile = (e: any) => (Array.isArray(e) ? e : e?.fileList);

  const onFinish = (values: any) => {
    onSubmit({
      ...values,
      startDate: values.startDate?.format("DD/MM/YYYY"),
      endDate: values.endDate?.format("DD/MM/YYYY"),
    });
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Row gutter={[24, 0]}>
        <Col xs={24} sm={12}>
          <Form.Item
            name="tradeLicenseNumber"
            label={t("form.tradeLicenseNumber")}
            rules={[{ required: true }]}
          >
            <Input size="large" placeholder="Enter Trade License Number" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="tradeLicenseName"
            label={t("form.tradeLicenseName")}
            rules={[{ required: true }]}
          >
            <Input size="large" placeholder="Enter Trade License Name" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="PlotNumber"
            label="Plot Number"
            rules={[{ required: true }]}
          >
            <Input size="large" placeholder="Enter Plot Number" />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            name="plateStatus"
            label="Plate Status"
            rules={[{ required: true }]}
          >
            <Select size="large" placeholder="Select color">
              <Select.Option value="white">White</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="startDate"
            label={t("form.fromDate")}
            rules={[{ required: true }]}
          >
            <DatePicker
              size="large"
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="endDate"
            label={t("form.toDate")}
            rules={[{ required: true }]}
          >
            <DatePicker
              size="large"
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item name="exceptionReason" label={t("form.exceptionReason")}>
            <Select size="large" placeholder="Select an exception reason">
              <Select.Option value="reason1">Reason 1</Select.Option>
              <Select.Option value="reason2">Reason 2</Select.Option>
              <Select.Option value="reason3">Reason 3</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Row justify="end" style={{ marginTop: "24px" }}>
        <Space>
          <Button onClick={onCancel}>{t("common.cancel")}</Button>
          <Button onClick={() => form.resetFields()}>
            {t("common.reset")}
          </Button>
          <Button type="primary" htmlType="submit" loading={isSubmitting}>
            {t("common.submit")}
          </Button>
        </Space>
      </Row>
    </Form>
  );
};

export default TradeForm;
