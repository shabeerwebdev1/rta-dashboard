import React, { useState } from "react";
import { Table, Button, Space, Tag, Badge, Dropdown, App, Tooltip } from "antd";
import type { TableProps, MenuProps } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import type { PageConfig } from "../../types/config";
import DynamicViewDrawer from "./DynamicViewDrawer";

interface DynamicTableProps {
  config: PageConfig;
  data: any[];
  loading: boolean;
  onEdit: (record: any) => void;
  onDelete: (record: any) => void;
  selectedRowKeys: React.Key[];
  setSelectedRowKeys: (keys: React.Key[]) => void;
}

const statusColors = {
  active: "green",
  inactive: "default",
  expired: "red",
  pending: "orange",
  removed: "volcano",
  reported: "green",
};

const DynamicTable: React.FC<DynamicTableProps> = ({
  config,
  data,
  loading,
  onEdit,
  onDelete,
  selectedRowKeys,
  setSelectedRowKeys,
}) => {
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);

  const handleView = (record: any) => {
    setViewRecord(record);
    setIsDrawerOpen(true);
  };

  const columns: TableProps<any>["columns"] = [
    ...config.tableConfig.columns.map((col) => ({
      title: t(col.title),
      dataIndex: col.key,
      key: col.key,
      sorter: (a: any, b: any) =>
        typeof a[col.key] === "string"
          ? a[col.key].localeCompare(b[col.key])
          : a[col.key] - b[col.key],
      render: (text: any) => {
        const statusKey = typeof text === "string" && text?.toLowerCase();
        const tagColor =
          statusColors[statusKey as keyof typeof statusColors] || "default";
        if (!text) return " - ";
        switch (col.type) {
          case "date":
            return dayjs(text).isValid()
              ? dayjs(text).format("DD MMM YYYY")
              : text;
          case "tag":
            return (
              <Tag color={tagColor}>{t(`status.${statusKey}`)}</Tag>
            );
          case "badge":
            return <Badge color={statusKey} text={text} />;
          default:
            return text;
        }
      },
    })),
    {
      // title: t("common.action"),
      key: "action",
      align: "center",
      fixed: "right",
      width: 100,
      render: (_, record) => {
        const menuItems: MenuProps["items"] = [];
        if (config.tableConfig.viewRecord) {
          menuItems.push({
            key: "view",
            label: t("common.view"),
            icon: <EyeOutlined />,
            onClick: () => handleView(record),
          });
        }
        if (config.api.put) {
          menuItems.push({
            key: "edit",
            label: t("common.edit"),
            icon: <EditOutlined />,
            onClick: () => onEdit(record),
          });
        }
        if (config.api.delete) {
          menuItems.push({
            key: "delete",
            label: t("common.delete"),
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => onDelete(record),
          });
        }

        return menuItems.length > 0 ? (
          <Dropdown
            menu={{ items: menuItems }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        ) : null;
      },
    },
  ];

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  return (
    <>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        rowSelection={rowSelection}
        scroll={{ x: "max-content" }}
        pagination={{
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} ${t("common.items")}`,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50"],
        }}
      />
      {viewRecord && (
        <DynamicViewDrawer
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          record={viewRecord}
          config={config}
        />
      )}
    </>
  );
};

export default DynamicTable;
