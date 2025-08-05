import React from "react";
import { Modal, Typography, Divider } from "antd";
import PlateForm from "./PlateForm";
import TradeForm from "./TradeForm";
import type { PlateFormValues } from "../whitelist/PlateForm";
import type { TradeFormValues } from "../whitelist/TradeForm";
import { useTranslation } from "react-i18next";

const { Title } = Typography;

interface AddWhitelistModalProps {
  type: "plate" | "trade" | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: PlateFormValues | TradeFormValues) => void;
  isSubmitting: boolean;
}

const AddWhitelistModal: React.FC<AddWhitelistModalProps> = ({
  type,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const { t } = useTranslation();

  if (!type) return null;

  const titleText =
    type === "plate"
      ? t("whitelist.addPlateTitle")
      : t("whitelist.addTradeTitle");

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Title level={5} style={{ margin: 0 }}>
            {titleText}
          </Title>
        </div>
      }
      footer={null}
      width={600}
      destroyOnClose
    >
      <Divider />

      {type === "plate" ? (
        <PlateForm
          onSubmit={onSubmit as (values: PlateFormValues) => void}
          onCancel={onClose}
          isSubmitting={isSubmitting}
        />
      ) : (
        <TradeForm
          onSubmit={onSubmit as (values: TradeFormValues) => void}
          onCancel={onClose}
          isSubmitting={isSubmitting}
        />
      )}
    </Modal>
  );
};

export default AddWhitelistModal;
