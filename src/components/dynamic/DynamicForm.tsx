import React, { useEffect } from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  Upload,
  Row,
  Col,
  Button,
  App,
  message,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { FormField } from "../../types/config";
import { getFileUrl } from "../../services/fileApi";
import dayjs, { Dayjs } from "dayjs";

const validationPatterns = {
  plateNumber: {
    pattern: /^[A-Za-z0-9 -]+$/,
    message:
      "Plate number can only contain letters, numbers, spaces, and hyphens.",
  },
  alphanumeric_hyphen_uppercase: {
    pattern: /^[A-Z0-9-]+$/,
    message:
      "This field can only contain uppercase letters, numbers, and hyphens.",
  },
  arabic: {
    pattern: /^[\u0600-\u06FF\s]+$/,
    message: "This field can only contain Arabic characters and spaces.",
  },
};
interface DynamicFormProps {
  fields: FormField[];
  form: any;
  initialData: any | null;
}

const DynamicForm: React.FC<DynamicFormProps> = ({
  fields,
  form,
  initialData,
}) => {
  const { t } = useTranslation();

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const disabledDate = (current: Dayjs, field: FormField) => {
    return (
      field.disablePastDates && current && current < dayjs().startOf("day")
    );
  };

  const renderField = (field: FormField) => {
    switch (field.type) {
      case "file":
        return (
          <Upload
            name={field.name}
            listType="picture-card"
            multiple
            beforeUpload={() => {
              return false; // Prevent automatic upload
            }}
          >{t("common.selectFile")}
          </Upload>
        );

      case "text":
        return <Input size="large" />;
      case "textarea":
        return <Input.TextArea size="large" rows={3} />;
      case "select":
        return (
          <Select size="large" allowClear>
            {field.options?.map((opt: any) => (
              <Select.Option
                key={typeof opt === "string" ? opt : opt.value}
                value={typeof opt === "string" ? opt : opt.value}
              >
                {typeof opt === "string" ? opt : opt.label}
              </Select.Option>
            ))}
          </Select>
        );
      case "date":
        return (
          <DatePicker
            size="large"
            style={{ width: "100%" }}
            format="YYYY-MM-DD"
          />
        );
      case "dateRange":
        return (
          <DatePicker.RangePicker
            size="large"
            style={{ width: "100%" }}
            format="YYYY-MM-DD"
            disabledDate={(current: Dayjs) => disabledDate(current, field)}
          />
        );
      default:
        return <Input size="large" />;
    }
  };

  useEffect(() => {
    if (initialData) {
      const transformedData = { ...initialData };
      fields.forEach((field) => {
        if (field.type === "date" && initialData[field.name]) {
          transformedData[field.name] = dayjs(initialData[field.name]);
        }
        if (
          field.type === "dateRange" &&
          field.fieldMapping &&
          initialData[field.fieldMapping.from] &&
          initialData[field.fieldMapping.to]
        ) {
          transformedData[field.name] = [
            dayjs(initialData[field.fieldMapping.from]),
            dayjs(initialData[field.fieldMapping.to]),
          ];
        }
        if (field.type === "file") {
          const fileDataKey = field.responseKey || field.name;
          if (typeof initialData[fileDataKey] === "string") {
            const fileNames = initialData[fileDataKey]
              .split(";")
              .filter(Boolean);
            transformedData[field.name] = fileNames.map(
              (name: string, index: number) => ({
                uid: `${-index}`,
                name: name,
                status: "done",
                url: getFileUrl(name),
              }),
            );
          }
        }
      });
      form.setFieldsValue(transformedData);
    } else {
      form.resetFields();
    }
  }, [initialData, form, fields]);

  return (
    <Row gutter={24}>
      {fields.map((field) => {
        const customRules = field.validationType
          ? [
              {
                pattern: validationPatterns[field.validationType].pattern,
                message: t(validationPatterns[field.validationType].message),
              },
            ]
          : [];

        return (
          !field.hidden?.(form.getFieldsValue()) && (
            <Col span={field.span} key={field.name}>
              <Form.Item
                name={field.name}
                label={t(field.label)}
                rules={[
                  {
                    required: field.required,
                    message: `${t(field.label)} is required.`,
                  },
                  ...customRules,
                ]}
                valuePropName={field.type === "file" ? "fileList" : "value"}
                getValueFromEvent={field.type === "file" ? normFile : undefined}
              >
                {renderField(field)}
              </Form.Item>
            </Col>
          )
        );
      })}
    </Row>
  );
};

export default DynamicForm;
