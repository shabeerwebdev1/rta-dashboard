import React, { useEffect } from "react";
import { Form, Input, Select, Upload, Button, Row, Col } from "antd";

import type { PledgeRequestDto } from "../../types/api";

const { Option } = Select;

interface PledgeRequestDto {
  onSubmit: (values: PledgeRequestDto) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  initialValues?: PledgeRequestDto;
}

const PledgeForm: React.FC<PledgeRequestDto> = ({
  onSubmit,
  onCancel,
  isSubmitting,
  initialValues,
}) => {
  const [form] = Form.useForm();

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList ? e.fileList : [];
  };

  const onFinish = async (values: any) => {
    await onSubmit(values);
  };

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [initialValues, form]);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={initialValues}
    >
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            name="tradeLicenseNumber"
            label="Trade License Number"
            rules={[{ required: true, message: "Please enter TL number" }]}
          >
            <Input size="large" placeholder="Enter TL Number" />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="pledgeType"
            label="Pledge Type"
            rules={[{ required: true, message: "Please select pledge type" }]}
          >
            <Select size="large" placeholder="Select Type">
              <Option value="Corporate">Corporate</Option>
              <Option value="Individual">Individual</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="pledgeNumber"
            label="Pledge Number"
            rules={[{ required: true, message: "Please enter pledge number" }]}
          >
            <Input size="large" placeholder="Enter Pledge Number" />
          </Form.Item>
        </Col>

       

        <Col span={12}>
          <Form.Item
            name="businessName"
            label="Business Name"
            rules={[{ required: true, message: "Please enter business name" }]}
          >
            <Input size="large" placeholder="Enter Business Name" />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            name="files"
            label="Upload Files"
            valuePropName="fileList"
            getValueFromEvent={normFile}
            rules={[{ required: true, message: "Please upload files" }]}
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
          <Form.Item name="remarks" label="Remarks">
            <Input.TextArea placeholder="Enter Your Remarks" rows={3} />
          </Form.Item>
        </Col>
      </Row>

      <Row justify="end" gutter={12}>
        <Col>
          <Button onClick={onCancel}>Cancel</Button>
        </Col>
        <Col>
          <Button onClick={() => form.resetFields()}>Reset</Button>
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

export default PledgeForm;
