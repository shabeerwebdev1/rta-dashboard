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
  Checkbox,
  Upload,
  Radio,
  Tooltip,
} from "antd";
import { UploadOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

export interface WhitelistFormValues {
  plateNumber?: string;
  plateSource?: string;
  plateType?: string;
  plateColor?: string;
  tradeLicenseNumber?: string;
  tradeLicenseName?: string;
  plotNumber?: string;
  startDate: string;
  endDate: string;
  plateStatus: string;
  exceptionReason: string;
  priority?: boolean;
  document?: any;
  zone?: "freezone" | "mainland";
  notes?: string;
}

interface WhitelistFormProps {
  type: "plate" | "trade";
  onSubmit: (values: WhitelistFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const WhitelistForm: React.FC<WhitelistFormProps> = ({
  type,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const [form] = Form.useForm();
  const { t } = useTranslation();

  const onFinish = (values: any) => {
    const formattedValues = {
      ...values,
      startDate: values.startDate?.format("DD/MM/YYYY"),
      endDate: values.endDate?.format("DD/MM/YYYY"),
    };
    onSubmit(formattedValues);
    console.log("Form Values:", formattedValues);
  };

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Row gutter={[24, 0]}>
        {type === "plate" && (
          <>
            <Col xs={24} sm={12}>
              <Form.Item
                name="plateNumber"
                label={t("form.plateNumber")}
                rules={[{ required: true }]}
              >
                <Input placeholder="e.g. A 12345" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="plateSource"
                label={t("form.plateSource")}
                rules={[{ required: true }]}
              >
                <Select placeholder="Select source">
                  <Select.Option value="DXB">Dubai</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="plateType"
                label={t("form.plateType")}
                rules={[{ required: true }]}
              >
                <Select placeholder="Select type">
                  <Select.Option value="private">Private</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="plateColor"
                label={t("form.plateColor")}
                rules={[{ required: true }]}
              >
                <Select placeholder="Select color">
                  <Select.Option value="white">White</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </>
        )}

        {type === "trade" && (
          <>
            <Col xs={24} sm={12} md={12}>
              <Form.Item
                name="tradeLicenseNumber"
                label={t("form.tradeLicenseNumber")}
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={12}>
              <Form.Item
                name="tradeLicenseName"
                label={t("form.tradeLicenseName")}
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={12}>
              <Form.Item
                name="zone"
                label={t("form.zone")}
                initialValue="mainland"
                rules={[{ required: true }]}
              >
                <Radio.Group>
                  <Radio.Button value="mainland">
                    {t("form.mainland")}
                  </Radio.Button>
                  <Radio.Button value="freezone">
                    {t("form.freezone")}
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={12}>
              <Form.Item
                name="document"
                label={t("form.tradeLicenseDocument")}
                valuePropName="fileList"
                getValueFromEvent={normFile}
              >
                <Upload
                  name="logo"
                  listType="picture"
                  maxCount={1}
                  beforeUpload={() => false}
                >
                  <Button icon={<UploadOutlined />}>
                    {t("form.uploadHint")}
                  </Button>
                </Upload>
              </Form.Item>
            </Col>
          </>
        )}

        <Col xs={24} sm={12}>
          <Form.Item
            name="startDate"
            label={t("form.startDate")}
            rules={[{ required: true }]}
          >
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="endDate"
            label={t("form.endDate")}
            rules={[{ required: true }]}
          >
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item name="notes" label={t("form.notes")}>
            <Input.TextArea rows={3} placeholder="Add any relevant notes..." />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item name="priority" valuePropName="checked">
            <Checkbox>
              {t("form.highPriority")}
              <Tooltip title={t("form.highPriorityHint")}>
                <InfoCircleOutlined
                  style={{ marginLeft: 8, color: "rgba(0,0,0,0.45)" }}
                />
              </Tooltip>
            </Checkbox>
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

export default WhitelistForm;
