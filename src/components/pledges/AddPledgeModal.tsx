import React from "react";
import { Modal, Typography, Divider } from "antd";
import PledgeForm from "./PledgeForm";
import type { PledgeFormValues } from "../../types/pledge";

const { Title } = Typography;

interface AddPledgeModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: PledgeFormValues) => Promise<void>;
  isSubmitting: boolean;
  initialValues?: PledgeFormValues;
  mode: "add" | "edit";
}

const AddPledgeModal: React.FC<AddPledgeModalProps> = ({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  initialValues,
  mode,
}) => {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      destroyOnClose
    >
      <Title level={4} style={{ marginBottom: 16 }}>
        {mode === "add" ? "Add New Pledge" : "Edit Pledge"}
      </Title>
      <Divider />
      <PledgeForm
        onSubmit={onSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
        initialValues={initialValues}
      />
    </Modal>
  );
};

export default AddPledgeModal;
