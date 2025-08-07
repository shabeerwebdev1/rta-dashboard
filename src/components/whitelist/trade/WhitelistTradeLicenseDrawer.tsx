import React from "react";
import { Drawer, Typography, App, Button, Space, Form } from "antd";
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

const { Title } = Typography;

interface WhitelistTradeLicenseDrawerProps {
  open: boolean;
  mode: "add" | "edit";
  initialData: WhitelistTradeLicenseResponseDto | null;
  onClose: () => void;
}

const WhitelistTradeLicenseDrawer: React.FC<
  WhitelistTradeLicenseDrawerProps
> = ({ open, mode, initialData, onClose }) => {
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

  return (
    <Drawer
      title={
        <Title level={5} style={{ margin: 0 }}>
          {mode === "add"
            ? t("whitelist.trade.addTitle")
            : `Edit License: ${initialData?.tradeLicenseNumber}`}
        </Title>
      }
      width={720}
      onClose={onClose}
      open={open}
      destroyOnClose
      styles={{ body: { paddingBottom: 80 } }}
      footer={
        <Space style={{ float: "right" }}>
          <Button onClick={onClose}>{t("common.cancel")}</Button>
          <Button
            onClick={() => form.submit()}
            type="primary"
            loading={isSubmitting}
          >
            {t("common.submit")}
          </Button>
        </Space>
      }
    >
      <WhitelistTradeLicenseForm
        form={form}
        onSubmit={handleFormSubmit}
        initialValues={initialData}
      />
    </Drawer>
  );
};

export default WhitelistTradeLicenseDrawer;
