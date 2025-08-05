import React from "react";
import { Form, Input, Select, Button, Row, Col, Upload } from "antd";

export interface InspectionFormValues {
  zone: string;
  area: string;
  obstacleSource: string;
  paymentDevice: string;
  document?: File[];
  comments?: string;
  priority?: boolean;
}

interface InspectionFormProps {
  onSubmit: (values: InspectionFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const InspectionForm: React.FC<InspectionFormProps> = ({
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const [form] = Form.useForm();

  const normFile = (e: any) => {
    return Array.isArray(e) ? e : e?.fileList;
  };

  const handleFinish = (values: any) => {
    onSubmit(values);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={{ priority: false }}
    >
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            name="zone"
            label="Zone"
            rules={[{ required: true, message: "Zone is required" }]}
          >
            <Select placeholder="Select a zone" size="large">
              <Select.Option value="North">North</Select.Option>
              <Select.Option value="South">South</Select.Option>
              <Select.Option value="East">East</Select.Option>
              <Select.Option value="West">West</Select.Option>
            </Select>
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="area"
            label="Area"
            rules={[{ required: true, message: "Area is required" }]}
          >
            <Select placeholder="Select an area" size="large">
              <Select.Option value="Residential">Residential</Select.Option>
              <Select.Option value="Commercial">Commercial</Select.Option>
              <Select.Option value="Industrial">Industrial</Select.Option>
            </Select>
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="obstacleSource"
            label="Obstacle Source"
            rules={[{ required: true, message: "Obstacle source is required" }]}
          >
            <Select placeholder="Select obstacle source" size="large">
              <Select.Option value="Construction">Construction</Select.Option>
              <Select.Option value="Parked Vehicle">
                Parked Vehicle
              </Select.Option>
              <Select.Option value="Natural Obstacle">
                Natural Obstacle
              </Select.Option>
              <Select.Option value="Road Work">Road Work</Select.Option>
              <Select.Option value="Utility Work">Utility Work</Select.Option>
              <Select.Option value="Other">Other</Select.Option>
            </Select>
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="paymentDevice"
            label="Payment Device"
            rules={[{ required: true, message: "Payment device is required" }]}
          >
            <Select placeholder="Select payment device" size="large">
              <Select.Option value="Meter #1234">Meter #1234</Select.Option>
              <Select.Option value="Meter #5678">Meter #5678</Select.Option>
              <Select.Option value="Kiosk #A1">Kiosk #A1</Select.Option>
              <Select.Option value="Kiosk #B2">Kiosk #B2</Select.Option>
              <Select.Option value="Mobile Zone 1">Mobile Zone 1</Select.Option>
              <Select.Option value="Mobile Zone 2">Mobile Zone 2</Select.Option>
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} sm={24} md={24}>
          <Form.Item
            name="document"
            label="Obstacle Image"
            valuePropName="fileList"
            getValueFromEvent={normFile}
          >
            <Upload
              name="logo"
              listType="picture-card"
              multiple={true}
              beforeUpload={() => false}
            >
              upload(PDF,PNG and JPG)
            </Upload>
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item name="comments" label="Comments">
            <Input.TextArea
              placeholder="Enter any comments"
              rows={3}
              size="large"
            />
          </Form.Item>
        </Col>
      </Row>

      <Row justify="end" gutter={12}>
        <Col>
          <Button htmlType="reset" onClick={onCancel}>
            Cancel{" "}
          </Button>
        </Col>
        <Col>
          <Button htmlType="reset" onClick={() => form.resetFields()}>
            Reset
          </Button>
        </Col>
        <Col>
          <Button type="primary" htmlType="submit" loading={isSubmitting}>
            Submit
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

export default InspectionForm;
