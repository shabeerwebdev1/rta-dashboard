import React from "react";
import { Modal, App, Button, Form, Space } from "antd";
import { useTranslation } from "react-i18next";
import WhitelistTradeLicenseForm from "./WhitelistTradeLicenseForm";
import {
  useAddWhitelistTradeLicenseMutation,
  useUpdateWhitelistTradeLicenseMutation,
} from "../../../store/api/whitelistApi";
import type {
  WhitelistTradeLicenseRequestDto,
  WhitelistTradeLicenseResponseDto,
} from "../../../types/api";

interface WhitelistTradeLicenseModalProps {
  open: boolean;
  mode: "add" | "edit";
  initialData: WhitelistTradeLicenseResponseDto | null;
  onClose: () => void;
}

const WhitelistTradeLicenseModal: React.FC<WhitelistTradeLicenseModalProps> = ({
  open,
  mode,
  initialData,
  onClose,
}) => {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const [addLicense, { isLoading: isAdding }] =
    useAddWhitelistTradeLicenseMutation();
  const [updateLicense, { isLoading: isUpdating }] =
    useUpdateWhitelistTradeLicenseMutation();

  const isSubmitting = isAdding || isUpdating;

  const handleFormSubmit = async (values: WhitelistTradeLicenseRequestDto) => {
    try {
      if (mode === "add") {
        await addLicense(values).unwrap();
        message.success(t("messages.whitelistAdded"));
      } else if (initialData) {
        await updateLicense({ id: initialData.id, ...values }).unwrap();
        message.success("License updated successfully!");
      }
      onClose();
    } catch (err: any) {
      message.error(
        `Failed to ${mode} license: ${err?.data?.en_Msg || "Unknown error"}`,
      );
    }
  };

  const title =
    mode === "add"
      ? t("whitelist.trade.addTitle")
      : t("whitelist.trade.editTitle");

  return (
    <Modal
      title={title}
      width={720}
      open={open}
      onCancel={onClose}
      destroyOnClose
      footer={[
        <Button key="back" onClick={onClose}>
          {t("common.cancel")}
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={isSubmitting}
          onClick={() => form.submit()}
        >
          {t("common.submit")}
        </Button>,
      ]}
    >
      <WhitelistTradeLicenseForm
        form={form}
        onSubmit={handleFormSubmit}
        initialValues={initialData}
      />
    </Modal>
  );
};

export default WhitelistTradeLicenseModal;