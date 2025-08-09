import React, { useState } from "react";
import { Modal, Form, Button } from "antd";
import { useTranslation } from "react-i18next";
import { pageConfigs } from "../../config/pageConfigs";
import { dynamicApi } from "../../services/rtkApiFactory";
import { useUploadFilesMutation } from "../../services/fileApi";
import { useAppNotification } from "../../utils/notificationManager";
import DynamicForm from "./DynamicForm";
import type { PageConfig } from "../../types/config";

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

  const [uploadedFileNames, setUploadedFileNames] = useState<
    Record<string, string>
  >({});

  const { useAddHook, useUpdateHook } = getMutationHooks(config);
  const [addItem, { isLoading: isAdding }] = useAddHook();
  const [updateItem, { isLoading: isUpdating }] = useUpdateHook();
  const [uploadFiles, { isLoading: isUploading }] = useUploadFilesMutation();

  const isSubmitting = isAdding || isUpdating;

  const handleFinish = async (values: any) => {
    try {
      const finalPayload = { ...values };

      for (const [fieldName, fileString] of Object.entries(uploadedFileNames)) {
        const payloadKey = fieldName;
        finalPayload[payloadKey] = fileString;

        if (finalPayload.hasOwnProperty("documentUploaded")) {
          finalPayload.documentUploaded = !!fileString;
        }
      }

      config.formConfig.fields.forEach((field) => {
        // if (field.type === "file") {
        //   delete finalPayload[field.name];
        // }
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

      let response;
      if (mode === "add") {
        response = await addItem(finalPayload).unwrap();
      } else {
        response = await updateItem({
          id: initialData.id,
          ...finalPayload,
        }).unwrap();
      }

      notification.success(
        response,
        t("messages.updateSuccess", { entity: t(config.name.singular) }),
      );
      onClose();
    } catch (err: any) {
      console.error("Form submission error:", err);
      notification.error(err, "Operation failed");
      if (err.data?.validationErrors) {
        const errorFields = err.data.validationErrors.map((ve: any) => ({
          name: ve.fieldName.charAt(0).toLowerCase() + ve.fieldName.slice(1),
          errors: [i18n.language === "ar" ? ve.arMessage : ve.enMessage],
        }));
        form.setFields(errorFields);
      }
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
        <Button key="cancel" onClick={onClose}>
          {t("common.cancel")}
        </Button>,
        <Button key="reset" onClick={() => form.resetFields()}>
          {t("common.reset")}
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={isSubmitting || isUploading}
          onClick={() => form.submit()}
        >
          {isUploading
            ? "Uploading..."
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
          uploadFilesMutation={[uploadFiles, { isLoading: isUploading }]}
          setUploadedFileNames={setUploadedFileNames}
        />
      </Form>
    </Modal>
  );
};

export default DynamicFormModal;
