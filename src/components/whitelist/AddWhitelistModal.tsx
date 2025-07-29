import React from "react";
import { Modal, Button, Typography, Divider } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import WhitelistForm, { type WhitelistFormValues } from "./WhitelistForm";

const { Title, Text } = Typography;

interface AddWhitelistModalProps {
  type: "plate" | "trade" | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: WhitelistFormValues) => void;
  isSubmitting: boolean;
}

const AddWhitelistModal: React.FC<AddWhitelistModalProps> = ({
  type,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  if (!type) return null;

  const titleText =
    type === "plate" ? "Add by Plate Details" : "Add by Trade Details";

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

      <WhitelistForm
        type={type}
        onSubmit={onSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
      />
    </Modal>
  );
};

export default AddWhitelistModal;
