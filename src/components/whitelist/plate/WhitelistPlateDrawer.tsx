import React from "react";
import { Drawer, Typography, App, Button, Space, Form } from "antd";
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

const { Title } = Typography;

interface WhitelistPlateDrawerProps {
  open: boolean;
  mode: "add" | "edit";
  initialData: WhitelistPlateResponseDto | null;
  onClose: () => void;
}

const WhitelistPlateDrawer: React.FC<WhitelistPlateDrawerProps> = ({
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

  return (
    <Drawer
      title={
        <Title level={5} style={{ margin: 0 }}>
          {mode === "add"
            ? t("whitelist.plate.addTitle")
            : `Edit Plate: ${initialData?.plateNumber}`}
        </Title>
      }
      width={720}
      onClose={onClose}
      open={open}
      destroyOnClose
      styles={{
        body: {
          paddingBottom: 80,
        },
      }}
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
      <WhitelistPlateForm
        form={form}
        onSubmit={handleFormSubmit}
        initialValues={initialData}
      />
    </Drawer>
  );
};

export default WhitelistPlateDrawer;
