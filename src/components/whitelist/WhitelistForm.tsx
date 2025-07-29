import React from "react";
import { Form, Input, DatePicker, Select, Button, Space, Row, Col } from "antd";

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

  const onFinish = (values: any) => {
    const formattedValues = {
      ...values,
      startDate: values.startDate.format("DD/MM/YYYY"),
      endDate: values.endDate.format("DD/MM/YYYY"),
    };
    onSubmit(formattedValues);
  };

  const handleClear = () => {
    form.resetFields();
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Row gutter={[16, 0]}>
        {type === "plate" && (
          <>
            <Col xs={24} sm={12} md={12}>
              <Form.Item
                name="plateNumber"
                label="Plate Number"
                rules={[
                  { required: true, message: "Plate Number is required" },
                ]}
              >
                <Input placeholder="Enter plate number" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={12}>
              <Form.Item
                name="plateSource"
                label="Plate Source"
                rules={[{ required: true, message: "Please select a source" }]}
              >
                <Select placeholder="Select source">
                  <Select.Option value="DXB">Dubai</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={12}>
              <Form.Item
                name="plateType"
                label="Plate Type"
                rules={[{ required: true, message: "Please select a type" }]}
              >
                <Select placeholder="Select type">
                  <Select.Option value="private">Private</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={12}>
              <Form.Item
                name="plateColor"
                label="Plate Color"
                rules={[{ required: true, message: "Please select a color" }]}
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
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="tradeLicenseNumber"
                label="Trade License Number"
                rules={[
                  { required: true, message: "License Number is required" },
                ]}
              >
                <Input placeholder="Enter trade license number" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="tradeLicenseName"
                label="Trade License Name"
                rules={[
                  { required: true, message: "License Name is required" },
                ]}
              >
                <Input placeholder="Enter trade license name" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="plotNumber"
                label="Plot Number"
                rules={[{ required: true, message: "Plot Number is required" }]}
              >
                <Input placeholder="Enter plot number" />
              </Form.Item>
            </Col>
          </>
        )}

        <Col xs={24} sm={12} md={12}>
          <Form.Item
            name="startDate"
            label="Start Date"
            rules={[{ required: true, message: "Start date is required" }]}
          >
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={12}>
          <Form.Item
            name="endDate"
            label="End Date"
            rules={[{ required: true, message: "End date is required" }]}
          >
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={12}>
          <Form.Item
            name="plateStatus"
            label="Plate Status"
            rules={[{ required: true, message: "Please select a status" }]}
          >
            <Select placeholder="Select status">
              <Select.Option value="active">Active</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={12}>
          <Form.Item
            name="exceptionReason"
            label="Exception Reason"
            rules={[{ required: true, message: "Please select a reason" }]}
          >
            <Select placeholder="Select reason">
              <Select.Option value="gov">Government</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row justify="end" style={{ marginTop: "24px" }}>
        <Space>
          <Button onClick={onCancel}>Cancel</Button>
          <Button onClick={handleClear}>Clear</Button>
          <Button type="primary" htmlType="submit" loading={isSubmitting}>
            Submit
          </Button>
        </Space>
      </Row>
    </Form>
  );
};

export default WhitelistForm;
