import React, { useState } from "react";
import { Modal, Form, Button } from "antd";
import { useTranslation } from "react-i18next";
import { pageConfigs } from "../../config/pageConfigs";
import { dynamicApi } from "../../services/rtkApiFactory";
import { useUploadFilesMutation } from "../../services/fileApi";
import { useAppNotification } from "../../utils/notificationManager";
import DynamicForm from "./DynamicForm";
import type { PageConfig, FormField } from "../../types/config";

const getMutationHooks = (config: PageConfig) => {
  const singular = config.name.singular.replace(/\s/g, "");
  const useAddHook = (dynamicApi as any)[`useAdd${singular}Mutation`];
  const useUpdateHook = (dynamicApi as any)[`useUpdate${singular}Mutation`];
  return { useAddHook, useUpdateHook };
};

interface DynamicFormModalProps {
  pageKey: keyof typeof pageConfigs;
  mode: "add" | "edit";
  open: boolean;
  initialData: any | null;
  onClose: () => void;
}

const DynamicFormModal: React.FC<DynamicFormModalProps> = ({
  pageKey,
  mode,
  open,
  initialData,
  onClose,
}) => {
  const { t, i18n } = useTranslation();
  const [form] = Form.useForm();
  const notification = useAppNotification();
  const config = pageConfigs[pageKey];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState("");

  const { useAddHook, useUpdateHook } = getMutationHooks(config);
  const [addItem] = useAddHook();
  const [updateItem] = useUpdateHook();
  const [uploadFiles] = useUploadFilesMutation();

  const handleFinish = async (values: any) => {
    setIsSubmitting(true);
    try {
      let finalPayload: any = { ...values };
      const formFields = config.formConfig.fields;
      const fileFields = formFields.filter((f) => f.type === "file");

      // --- File Upload Step ---
      if (fileFields.length > 0) {
        setSubmissionStatus(t("status.uploading"));
        for (const field of fileFields) {
          const fileList = values[field.name] || [];
          const newFiles = fileList.filter((f: any) => f.originFileObj);
          const existingFiles = fileList
            .filter((f: any) => !f.originFileObj)
            .map((f: any) => f.name);

          let uploadedFileNames: string[] = [];
          if (newFiles.length > 0) {
            const uploadFormData = new FormData();
            uploadFormData.append("Category", field.fileCategory || "Default");
            newFiles.forEach((f: any) =>
              uploadFormData.append("Files", f.originFileObj),
            );
            const result = await uploadFiles(uploadFormData).unwrap();
            if (Array.isArray(result)) {
              uploadedFileNames = result
                .filter((r) => r.success)
                .map((r) => r.savedAs);
            } else if (result.fileName) {
              uploadedFileNames = [result.fileName];
            }
          }
          // Replace file list object with a string of filenames for the payload
          finalPayload[field.name] =
            [...existingFiles, ...uploadedFileNames].join(";") || null;
        }
      }

      // --- Payload Preparation Step ---
      formFields.forEach((field) => {
        if (
          field.type === "dateRange" &&
          field.fieldMapping &&
          finalPayload[field.name]
        ) {
          finalPayload[field.fieldMapping.from] =
            finalPayload[field.name][0].toISOString();
          finalPayload[field.fieldMapping.to] =
            finalPayload[field.name][1].toISOString();
          delete finalPayload[field.name];
        }
      });

      const isMultipart =
        (mode === "add" &&
          config.api.postContentType === "multipart/form-data") ||
        (mode === "edit" &&
          config.api.putContentType === "multipart/form-data");
      let submissionPayload: any;

      if (isMultipart) {
        const formData = new FormData();
        for (const key in finalPayload) {
          if (finalPayload[key] !== undefined && finalPayload[key] !== null) {
            formData.append(key, finalPayload[key]);
          }
        }
        submissionPayload = formData;
      } else {
        submissionPayload = finalPayload;
      }

      // --- Submission Step ---
      setSubmissionStatus(t("status.submitting"));
      let response;
      if (mode === "add") {
        response = await addItem(submissionPayload).unwrap();
      } else {
        response = await updateItem({
          id: initialData.id,
          ...submissionPayload,
        }).unwrap();
      }

      notification.success(
        response,
        t(mode === "add" ? "messages.addSuccess" : "messages.updateSuccess", {
          entity: t(config.name.singular),
        }),
      );
      onClose();
    } catch (err: any) {
      console.error("Form submission error:", err);
      notification.error(err, "Operation failed");
      if (err.data?.validationErrors) {
        const errorFields = err.data.validationErrors.map((ve: any) => ({
          name: ve.fieldName,
          errors: [`${ve.enMessage} / ${ve.arMessage}`],
        }));
        form.setFields(errorFields);
      }
    } finally {
      setIsSubmitting(false);
      setSubmissionStatus("");
    }
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      open={open}
      title={t(mode === "add" ? "page.addTitle" : "page.editTitle", {
        entity: t(config.name.singular),
      })}
      width={config.formConfig.modalWidth}
      onCancel={handleClose}
      destroyOnClose
      className="dynamic-modal"
      footer={[
        <Button key="cancel" onClick={handleClose} disabled={isSubmitting}>
          {t("common.cancel")}
        </Button>,
        <Button
          key="reset"
          onClick={() => form.resetFields()}
          disabled={isSubmitting}
        >
          {t("common.reset")}
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={isSubmitting}
          onClick={() => form.submit()}
        >
          {isSubmitting
            ? submissionStatus
            : mode === "add"
              ? t("common.submit")
              : t("common.update")}
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        preserve={false}
      >
        <DynamicForm
          fields={config.formConfig.fields}
          form={form}
          initialData={initialData}
        />
      </Form>
    </Modal>
  );
};

export default DynamicFormModal;
