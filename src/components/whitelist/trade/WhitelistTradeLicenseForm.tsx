import React, { useEffect } from "react";
import {
  Form,
  Input,
  DatePicker,
  Select,
  Row,
  Col,
  InputNumber,
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
      });
    }
  }, [initialValues, form]);

  const onFinish = (values: any) => {
    const formattedValues: WhitelistTradeLicenseRequestDto = {
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

        <Col xs={24} sm={12}>
          <Form.Item
            name="exemptionReason_EN"
            label={t("form.exemptionReason_EN")}
            rules={[{ required: true }]}
          >
            <InputNumber
              size="large"
              style={{ width: "100%" }}
              placeholder="Enter reason code"
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="exemptionReason_AR"
            label={t("form.exemptionReason_AR")}
            rules={[{ required: true }]}
          >
            <InputNumber
              size="large"
              style={{ width: "100%" }}
              placeholder="أدخل رمز السبب"
            />
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

export default WhitelistTradeLicenseForm;
