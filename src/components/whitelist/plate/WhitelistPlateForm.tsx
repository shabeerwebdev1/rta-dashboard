import React, { useEffect } from "react";
import {
  Form,
  Input,
  DatePicker,
  Select,
  Row,
  Col,
  type FormInstance,
} from "antd";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import type {
  WhitelistPlateRequestDto,
  WhitelistPlateResponseDto,
} from "../../../types/api";

interface WhitelistPlateFormProps {
  form: FormInstance;
  onSubmit: (values: WhitelistPlateRequestDto) => void;
  initialValues: WhitelistPlateResponseDto | null;
}

const EXEMPTION_REASONS = [
  { code: 1, label: "Government Vehicle" },
  { code: 2, label: "Diplomatic Vehicle" },
  { code: 3, label: "Emergency Vehicle" },
  { code: 4, label: "Special Permission" },
];

const WhitelistPlateForm: React.FC<WhitelistPlateFormProps> = ({
  form,
  onSubmit,
  initialValues,
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        dateRange: [
          initialValues.fromDate ? dayjs(initialValues.fromDate) : null,
          initialValues.toDate ? dayjs(initialValues.toDate) : null,
        ],
        exemptionReason_ID: initialValues.exemptionReason_ID,
      });
    }
  }, [initialValues, form]);

  const onFinish = (values: any) => {
    const formattedValues: WhitelistPlateRequestDto = {
      ...values,
      fromDate: values.dateRange[0].toISOString(),
      toDate: values.dateRange[1].toISOString(),
    };
    delete formattedValues.dateRange;
    onSubmit(formattedValues);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={initialValues || {}}
    >
      <Row gutter={[24, 0]}>
        <Col xs={24} sm={12}>
          <Form.Item
            name="plateNumber"
            label={t("form.plateNumber")}
            rules={[{ required: true }]}
          >
            <Input size="large" placeholder="e.g. A 12345" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="plateSource"
            label={t("form.plateSource")}
            rules={[{ required: true }]}
          >
            <Select size="large" placeholder="Select source">
              <Select.Option value="Dubai">Dubai</Select.Option>
              <Select.Option value="Abu Dhabi">Abu Dhabi</Select.Option>
              <Select.Option value="Sharjah">Sharjah</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="plateType"
            label={t("form.plateType")}
            rules={[{ required: true }]}
          >
            <Select size="large" placeholder="Select type">
              <Select.Option value="Private">Private</Select.Option>
              <Select.Option value="Commercial">Commercial</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="plateColor"
            label={t("form.plateColor")}
            rules={[{ required: true }]}
          >
            <Select size="large" placeholder="Select color">
              <Select.Option value="White">White</Select.Option>
              <Select.Option value="Red">Red</Select.Option>
              <Select.Option value="Blue">Blue</Select.Option>
              <Select.Option value="Green">Green</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item
            name="dateRange"
            label={t("form.dateRange")}
            rules={[{ required: true }]}
          >
            <DatePicker.RangePicker
              size="large"
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
            />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item
            name="exemptionReason_ID"
            label={t("form.exemptionReason")}
            rules={[{ required: true }]}
          >
            <Select size="large" placeholder="Select exemption reason">
              {EXEMPTION_REASONS.map((reason) => (
                <Select.Option key={reason.code} value={reason.code}>
                  {reason.code} - {reason.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item
            name="plateStatus"
            label={t("form.plateStatus")}
            rules={[{ required: true }]}
          >
            <Select size="large" placeholder="Select status">
              <Select.Option value="Active">Active</Select.Option>
              <Select.Option value="Inactive">Inactive</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};

export default WhitelistPlateForm;
