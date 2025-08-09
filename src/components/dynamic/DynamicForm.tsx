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
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { FormField } from "../../types/config";
import { getFileUrl } from "../../services/fileApi";
import dayjs from "dayjs";

type UploadMutation = [(formData: FormData) => any, { isLoading: boolean }];

interface DynamicFormProps {
  fields: FormField[];
  form: any;
  initialData: any | null;
  uploadFilesMutation: UploadMutation;
  setUploadedFileNames: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
}

const DynamicForm: React.FC<DynamicFormProps> = ({
  fields,
  form,
  initialData,
  uploadFilesMutation,
  setUploadedFileNames,
  pageKey,
}) => {
  const { t } = useTranslation();
  const { notification } = App.useApp();
  const [uploadFiles, { isLoading: isUploading }] = uploadFilesMutation;

  const handleUploadChange = async (
    info: any,
    fieldName: string,
    category: string,
  ) => {
    const { fileList } = info;
    const newFilesToUpload = fileList.filter(
      (f: any) => f.originFileObj && f.status !== "uploading",
    );
    const existingFileNames = fileList
      .filter((f: any) => !f.originFileObj)
      .map((f: any) => f.name);

    if (newFilesToUpload.length > 0) {
      const formData = new FormData();
      formData.append("Category", category);
      newFilesToUpload.forEach((file: any) => {
        formData.append("Files", file.originFileObj);

        form.setFieldValue(
          fieldName,
          fileList.map((f: any) =>
            f.uid === file.uid ? { ...f, status: "uploading" } : f,
          ),
        );
      });

      try {
        const uploadResult = await uploadFiles(formData).unwrap();
        let uploadedNames: string[] = [];

        if (Array.isArray(uploadResult)) {
          uploadedNames = uploadResult
            .filter((res) => res.success)
            .map((res) => res.savedAs);
        } else if (uploadResult.fileName) {
          uploadedNames = [uploadResult.fileName];
        }

        setUploadedFileNames((prev) => ({
          ...prev,
          [fieldName]: [...existingFileNames, ...uploadedNames].join(";"),
        }));

        const updatedFileList = fileList
          .map((f: any) => {
            const uploadedFile = newFilesToUpload.find(
              (nf) => nf.uid === f.uid,
            );
            if (uploadedFile) {
              const savedAs = uploadedNames.shift();
              return savedAs
                ? {
                    ...f,
                    status: "done",
                    name: savedAs,
                    url: getFileUrl(savedAs),
                  }
                : { ...f, status: "error" };
            }
            return f;
          })
          .filter((f: any) => f.status !== "error");

        form.setFieldValue(fieldName, updatedFileList);
      } catch (error) {
        notification.error({ message: "Upload Failed" });

        form.setFieldValue(
          fieldName,
          fileList.filter(
            (f: any) => !newFilesToUpload.some((nf) => nf.uid === f.uid),
          ),
        );
      }
    } else {
      setUploadedFileNames((prev) => ({
        ...prev,
        [fieldName]: existingFileNames.join(";"),
      }));
    }
  };

  const renderField = (field: FormField) => {
    switch (field.type) {
      case "file":
        return (
          <Upload
            name={field.name}
            listType="picture"
            multiple
            onChange={(info) =>
              handleUploadChange(
                info,
                field.name,
                field.fileCategory || "Default",
              )
            }
            beforeUpload={() => false}
          >
            <Button icon={<UploadOutlined />} loading={isUploading}>
              Click to Upload
            </Button>
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
          const payloadKey = field.name;
          if (typeof initialData[payloadKey] === "string") {
            const fileNames = initialData[payloadKey]
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
  }, [initialData, form, fields, pageKey]);

  return (
    <Row gutter={24}>
      {fields.map(
        (field) =>
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
                ]}
                valuePropName={field.type === "file" ? "fileList" : "value"}
              >
                {renderField(field)}
              </Form.Item>
            </Col>
          ),
      )}
    </Row>
  );
};

export default DynamicForm;
