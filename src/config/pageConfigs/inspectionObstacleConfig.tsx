import React from "react";
import { Button } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { PageConfig } from "../../types/config";
import { SearchOutlined, CheckSquareOutlined } from "@ant-design/icons";
import { useUpdateInspectionObstacleMutation } from "../../services/rtkApiFactory";
import { useAppNotification } from "../../utils/notificationManager";
import { useTranslation } from "react-i18next";

const RemoveObstacleButton = ({
  record,
  onClose,
  refetch,
}: {
  record: any;
  onClose: () => void;
  refetch: () => void;
}) => {
  const { t } = useTranslation();
  const notification = useAppNotification();
  const [updateObstacle, { isLoading: isUpdating }] = useUpdateInspectionObstacleMutation();

  const handleRemove = async () => {
    try {
      await updateObstacle({ id: record.id, status: 1 }).unwrap();
      notification.success(null, t("messages.updateSuccess", { entity: t("entity.inspectionObstacle") }));
      refetch();
      onClose();
    } catch (err) {
      notification.error(err as any, "Operation Failed");
    }
  };

  if (record.status === 1 || record.status === "Removed") return null;

  return (
    <div style={{ marginTop: 16, textAlign: "right" }}>
      <Button icon={<DeleteOutlined />} onClick={handleRemove} loading={isUpdating} danger>
        {t("common.remove obstacle")}
      </Button>
    </div>
  );
};

export const inspectionObstacleConfig: PageConfig = {
  key: "inspection-obstacles",
  title: "page.title.inspection-obstacles",
  name: { singular: "Inspection Obstacle", plural: "Inspection Obstacles" },
  api: {
    get: "/api/InspectionObstacle",
    post: "/api/InspectionObstacle",
    postContentType: "multipart/form-data",
    put: "/api/InspectionObstacle/markremoved/:id",
    delete: "",
  },
  searchConfig: {
    globalSearchKeys: ["zone", "area"],
    columnFilterKeys: ["sourceOfObstacle", "status"],
    dateRangeKey: "reportedAt",
  },
  statsConfig: [
    { title: "Reported Obstacles", icon: <SearchOutlined />, value: (data) => data.length },
    {
      title: "Removed Obstacles",
      icon: <CheckSquareOutlined />,
      value: (data) => data.filter((d) => String(d.status ?? "").toLowerCase() === "removed").length,
      color: "#52c41a",
    },
  ],
  tableConfig: {
    columns: [
      { key: "zone", title: "form.zone", type: "string", sortable: true, lookupCategory: 600 },
      { key: "area", title: "form.area", type: "string", sortable: true, lookupCategory: 700 },
      {
        key: "sourceOfObstacle",
        title: "form.sourceOfObstacle",
        type: "string",
        filterable: true,
        lookupCategory: 800,
      },
      { key: "status", title: "form.status", type: "tag", filterable: true },
    ],
    viewRecord: true,
    showEdit: false,
    drawerConfig: {
      sections: [
        {
          type: "descriptions",
          fields: ["zone", "area", "sourceOfObstacle", "closestPaymentDevice", "comments", "status"],
        },
        {
          type: "images",
          title: "form.photo",
          imageSourceKey: "photoPath",
        },
        {
          type: "custom",
          render: (record, onClose, refetch) => (
            <RemoveObstacleButton record={record} onClose={onClose} refetch={refetch} />
          ),
        },
      ],
    },
  },
  formConfig: {
    modalWidth: "720px",
    fields: [
      { name: "Zone", label: "form.zone", type: "select", required: true, span: 12, lookupCategory: 600 },
      { name: "Area", label: "form.area", type: "select", required: true, span: 12, lookupCategory: 700 },
      {
        name: "SourceOfObstacle",
        label: "form.sourceOfObstacle",
        type: "select",
        required: true,
        span: 12,
        lookupCategory: 800,
      },
      { name: "ClosestPaymentDevice", label: "form.closestPaymentDevice", type: "text", required: true, span: 12 },
      {
        name: "Photo",
        label: "form.photo",
        type: "file",
        required: true,
        span: 24,
        fileCategory: "Obstacles",
        responseKey: "photoPath",
      },
      { name: "Comments", label: "form.comments", type: "textarea", required: false, span: 24 },
    ],
  },
};
