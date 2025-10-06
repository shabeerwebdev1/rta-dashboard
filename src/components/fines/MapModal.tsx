import React from "react";
import { Modal, Empty, Space } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import ArcGISMap from "../common/ArcGISMap";

interface MapModalProps {
  open: boolean;
  onClose: () => void;
  fine: any;
}

const MapModal: React.FC<MapModalProps> = ({ open, onClose, fine }) => {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={800}
      footer={null}
      title={
        <Space>
          <EnvironmentOutlined />
          {t("form.FineLocation")}
        </Space>
      }
    >
      {fine?.latitude && fine?.longitude ? (
        <ArcGISMap
          inspectors={[
            {
              id: 1,
              name: "Fine Location",
              nameAr: "موقع المخالفة",
              lat: fine.latitude,
              lng: fine.longitude,
              status: "Fine",
              statusAr: "مخالفة",
              details: { zone: "", lastCheckIn: "" },
              markerType: "google-pin",
            },
          ]}
          center={[fine.longitude, fine.latitude]}
          zoom={16}
          height="400px"
          disablePopup={true}
        />
      ) : (
        <Empty description="No Location Data Available" style={{ padding: 40 }} />
      )}
    </Modal>
  );
};

export default MapModal;