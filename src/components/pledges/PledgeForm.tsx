import React from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  Upload,
  Button,
  Row,
  Col,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";

const { Option } = Select;

interface PledgeFormProps {
  onSubmit: (values: any) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  initialValues?: any;
}

const PledgeForm: React.FC<PledgeFormProps> = ({
  onSubmit,
  onCancel,
  isSubmitting,
  initialValues,
}) => {
  const [form] = Form.useForm();

  const normFile = (e: any) => {
    return Array.isArray(e) ? e : e?.fileList;
  };

  const onFinish = (values: any) => {
    onSubmit(values);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={onFinish}
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
              <Option value="type1">Type 1</Option>
              <Option value="type2">Type 2</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="fromDate"
            label="From Date"
            rules={[{ required: true, message: "Please select from date" }]}
          >
            <DatePicker
              size="large"
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="tradeLicenseName"
            label="Trade License Name"
            rules={[{ required: true, message: "Please enter TL name" }]}
          >
            <Input size="large" placeholder="Enter TL Name" />
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

        <Col xs={24} sm={24} md={24}>
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
          <Button size="large" onClick={onCancel}>
            Cancel
          </Button>
        </Col>
        <Col>
          <Button size="large" onClick={() => form.resetFields()}>
            Reset
          </Button>
        </Col>
        <Col>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={isSubmitting}
          >
            Submit
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

export default PledgeForm;
