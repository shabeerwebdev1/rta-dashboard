import React, { useState, useEffect } from "react";
import { Drawer, Descriptions, Tag, Button, Space, App } from "antd";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

interface FineViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: any;
}

const GeneralSearchViewDrawer: React.FC<FineViewDrawerProps> = ({ open, onClose, record }) => {
  const { notification } = App.useApp();
  const { t } = useTranslation();

  return (
    <Drawer
      open={open}
      width={600}
      onClose={onClose}
      title="Fine Details"
      bodyStyle={{ overflowY: "auto", height: "calc(100vh - 64px)" }}
    >
      {record ? (
        <>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Fine ID">{record.entityNo}</Descriptions.Item>
            
            <Descriptions.Item label="Amount">{record.amount}</Descriptions.Item>
            <Descriptions.Item label="Fined Date">{record.date}</Descriptions.Item>
            <Descriptions.Item label="Plate Number">{record.plateNumber}</Descriptions.Item>
            <Descriptions.Item label="Vehicle Brand">{record.vehicleBrand}</Descriptions.Item>
            <Descriptions.Item label="Vehicle Type">{record.vehicleType}</Descriptions.Item>
            <Descriptions.Item label="Vehicle Color">{record.vehicleColor}</Descriptions.Item>
            <Descriptions.Item label="Manufacturer Year">{record.manufacturerYear}</Descriptions.Item>
            <Descriptions.Item label="Owner Name">{record.ownerName}</Descriptions.Item>
            <Descriptions.Item label="Owner Name">{record.OwnerEmail}</Descriptions.Item>
            <Descriptions.Item label="Owner Name">{record.OwnerMobile}</Descriptions.Item>
          </Descriptions>
        </>
      ) : (
        <p>No Data</p>
      )}
    </Drawer>
  );
};

export default GeneralSearchViewDrawer;