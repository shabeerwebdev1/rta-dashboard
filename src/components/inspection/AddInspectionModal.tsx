import React from "react";
import { Modal, Button, Typography, Divider } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import InspectionForm from "./InspectionForm";
import type { InspectionFormValues } from "../../types/inspection";

const { Title } = Typography;

interface AddInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: InspectionFormValues) => void;
  isSubmitting: boolean;
}

const AddInspectionModal: React.FC<AddInspectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      closable={false} // 🔧 disable default close icon
      title={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Title level={5} style={{ margin: 0 }}>
            Add Inspection Obstacle
          </Title>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
            style={{ marginRight: -8 }}
          />
        </div>
      }
      footer={null}
      width={700}
      destroyOnClose
    >
      <Divider />
      <InspectionForm
        onSubmit={onSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
      />
    </Modal>
  );
};

export default AddInspectionModal;
