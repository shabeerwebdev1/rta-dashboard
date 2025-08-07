import React from "react";
import { Modal, Typography, Divider, Button } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import PledgeForm from "./PledgeForm";
import type { PledgeFormValues } from "../../types/pledge";

const { Title } = Typography;

interface AddPledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: PledgeFormValues) => void;
  isSubmitting: boolean;
  initialValues?: Partial<PledgeFormValues>;
}

const AddPledgeModal: React.FC<AddPledgeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  initialValues,
}) => {
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
            Add New Pledge
          </Title>
        </div>
      }
      footer={null}
      width={600}
      destroyOnHidden
      closable={true} // enable default close icon to match the first modal
    >
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
