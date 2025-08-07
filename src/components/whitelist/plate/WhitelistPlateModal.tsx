import React from "react";
import { Modal, App, Button, Form } from "antd";
import { useTranslation } from "react-i18next";
import WhitelistPlateForm from "./WhitelistPlateForm";
import {
  useAddWhitelistPlateMutation,
  useUpdateWhitelistPlateMutation,
} from "../../../store/api/whitelistApi";
import type {
  WhitelistPlateRequestDto,
  WhitelistPlateResponseDto,
} from "../../../types/api";

interface WhitelistPlateModalProps {
  open: boolean;
  mode: "add" | "edit";
  initialData: WhitelistPlateResponseDto | null;
  onClose: () => void;
}

const WhitelistPlateModal: React.FC<WhitelistPlateModalProps> = ({
  open,
  mode,
  initialData,
  onClose,
}) => {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const [addPlate, { isLoading: isAdding }] = useAddWhitelistPlateMutation();
  const [updatePlate, { isLoading: isUpdating }] =
    useUpdateWhitelistPlateMutation();

  const isSubmitting = isAdding || isUpdating;

  const handleFormSubmit = async (values: WhitelistPlateRequestDto) => {
    try {
      if (mode === "add") {
        await addPlate(values).unwrap();
        message.success(t("messages.whitelistAdded"));
      } else if (initialData) {
        await updatePlate({ id: initialData.id, ...values }).unwrap();
        message.success("Plate updated successfully!");
      }
      onClose();
    } catch (err: any) {
      message.error(
        `Failed to ${mode} plate: ${err?.data?.en_Msg || "Unknown error"}`,
      );
    }
  };

  const title =
    mode === "add"
      ? t("whitelist.plate.addTitle")
      : t("whitelist.plate.editTitle");

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
      <WhitelistPlateForm
        form={form}
        onSubmit={handleFormSubmit}
        initialValues={initialData}
      />
    </Modal>
  );
};

export default WhitelistPlateModal;
