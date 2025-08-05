import React from "react";
import {
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Space,
  Row,
  Col,
  message,
} from "antd";
import { useTranslation } from "react-i18next";
import { useApi } from "../../hooks/useApi";
import { plateService } from "../../services/plateService";

const { Option } = Select;

interface PlateFormValues {
  plateNumber: string;
  plateSource: string;
  plateType: string;
  plateColor: string;
  fromDate: string;
  toDate: string;
  plateStatus: string;
  exemptionReasonId?: number;
  exemptionReason_EN?: string;
  exemptionReason_AR?: string;
}

interface PlateFormProps {
  onCancel: () => void;
}

const exemptionReasons = [
  { id: 1, label: "Government Vehicle", label_ar: "مركبة حكومية" },
  { id: 2, label: "Emergency Use", label_ar: "استخدام الطوارئ" },
];

const PlateForm: React.FC<PlateFormProps> = ({ onCancel }) => {
  const [form] = Form.useForm();
  const { t, i18n } = useTranslation();
  const { request: submitPlate, loading } = useApi(plateService.create);

  const onFinish = async (values: any) => {
    const selectedReason = exemptionReasons.find(
      (r) => r.id === values.exemptionReasonId
    );

    const payload: PlateFormValues = {
      plateNumber: values.plateNumber,
      plateSource: values.plateSource,
      plateType: values.plateType,
      plateColor: values.plateColor,
      fromDate: values.fromDate?.toISOString(),
      toDate: values.toDate?.toISOString(),
      plateStatus: values.plateStatus,
      exemptionReasonId: selectedReason?.id,
      exemptionReason_EN: selectedReason?.label,
      exemptionReason_AR: selectedReason?.label_ar,
    };

    try {
      await submitPlate(payload);
      message.success(t("Plate created successfully"));
      form.resetFields();
    } catch (error) {
      message.error(t("Failed to create plate"));
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
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
              <Option value="DXB">Dubai</Option>
              <Option value="AUH">Abu Dhabi</Option>
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
              <Option value="private">Private</Option>
              <Option value="commercial">Commercial</Option>
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
              <Option value="white">White</Option>
              <Option value="black">Black</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            name="fromDate"
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
            name="toDate"
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
          <Form.Item
            name="exemptionReasonId"
            label={t("form.exceptionReason")}
            rules={[{ required: true }]}
          >
            <Select size="large" placeholder="Select a reason">
              {exemptionReasons.map((reason) => (
                <Option key={reason.id} value={reason.id}>
                  {i18n.language === "ar" ? reason.label_ar : reason.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            name="plateStatus"
            label={t("form.plateStatus")}
            rules={[{ required: true }]}
          >
            <Select size="large" placeholder="Select status">
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
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
          <Button type="primary" htmlType="submit" >
            {t("common.submit")}
          </Button>
        </Space>
      </Row>
    </Form>
  );
};

export default PlateForm;
