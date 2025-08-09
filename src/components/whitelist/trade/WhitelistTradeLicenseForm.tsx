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
  WhitelistTradeLicenseRequestDto,
  WhitelistTradeLicenseResponseDto,
} from "../../../types/api";

interface WhitelistTradeLicenseFormProps {
  form: FormInstance;
  onSubmit: (values: WhitelistTradeLicenseRequestDto) => void;
  initialValues: WhitelistTradeLicenseResponseDto | null;
}

const EXEMPTION_REASONS = [
  { code: 1, label: "Government Entity" },
  { code: 2, label: "Diplomatic Entity" },
  { code: 3, label: "Emergency Services" },
  { code: 4, label: "Special Economic Zone" },
];

const WhitelistTradeLicenseForm: React.FC<WhitelistTradeLicenseFormProps> = ({
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
        // Map existing exemption reason to the new single field
        exemptionReasonId: initialValues.exemptionReason_EN,
      });
    }
  }, [initialValues, form]);

  const onFinish = (values: any) => {
    const formattedValues: WhitelistTradeLicenseRequestDto = {
      ...values,
      fromDate: values.dateRange[0].toISOString(),
      toDate: values.dateRange[1].toISOString(),
      // Map the single exemption reason to both fields for backend compatibility
      exemptionReason_ID: values.exemptionReason_ID,
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
            name="tradeLicenseNumber"
            label={t("form.tradeLicenseNumber")}
            rules={[{ required: true }]}
          >
            <Input size="large" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="tradeLicense_EN_Name"
            label={t("form.tradeLicense_EN_Name")}
            rules={[{ required: true }]}
          >
            <Input size="large" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="tradeLicense_AR_Name"
            label={t("form.tradeLicense_AR_Name")}
            rules={[{ required: true }]}
          >
            <Input size="large" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="plotNumber"
            label={t("form.plotNumber")}
            rules={[{ required: true }]}
          >
            <Input size="large" />
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
                  {reason.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        {/* Hidden fields to maintain backend contract */}
        <Form.Item name="exemptionReason_EN" noStyle hidden>
          <Input />
        </Form.Item>
        <Form.Item name="exemptionReason_AR" noStyle hidden>
          <Input />
        </Form.Item>

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

export default WhitelistTradeLicenseForm;
