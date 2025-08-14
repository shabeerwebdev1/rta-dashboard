import React, { useState } from "react";
import { Table, Button, Tag, Badge, Dropdown } from "antd";
import type { TableProps, MenuProps } from "antd";
import { EditOutlined, DeleteOutlined, EyeOutlined, MoreOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import type { PageConfig } from "../../types/config";
import DynamicViewDrawer from "./DynamicViewDrawer";

interface TableRecord {
  id: string | number;
  [key: string]: unknown;
}

interface DynamicTableProps {
  config: PageConfig;
  data: TableRecord[];
  loading: boolean;
  onEdit: (record: TableRecord) => void;
  onDelete: (record: TableRecord) => void;
  selectedRowKeys: React.Key[];
  setSelectedRowKeys: (keys: React.Key[]) => void;
  tableSize: "small" | "middle";
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
  tableSize,
  onEdit,
  onDelete,
  selectedRowKeys,
  setSelectedRowKeys,
}) => {
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<TableRecord | null>(null);

  const handleView = (record: TableRecord) => {
    setViewRecord(record);
    setIsDrawerOpen(true);
  };

  const columns: TableProps<TableRecord>["columns"] = [
    ...config.tableConfig.columns.map((col) => ({
      title: t(col.title),
      dataIndex: col.key,
      key: col.key,
      sorter: (a: TableRecord, b: TableRecord) => {
        const aVal = a[col.key];
        const bVal = b[col.key];
        if (typeof aVal === "string" && typeof bVal === "string") {
          return aVal.localeCompare(bVal);
        }
        return Number(aVal) - Number(bVal);
      },
      render: (text: unknown) => {
        if (!text) return " - ";

        // Handle select fields (show label instead of number)
        if (col.type === "select" && col.options) {
          const found = col.options.find((opt) => opt.value === text);
          return found ? found.label : String(text);
        }

        const statusKey = typeof text === "string" ? text.toLowerCase() : "";
        const tagColor =
          statusKey && statusColors[statusKey as keyof typeof statusColors]
            ? statusColors[statusKey as keyof typeof statusColors]
            : "default";

        switch (col.type) {
          case "date":
            return dayjs(text as string).isValid() ? dayjs(text as string).format("DD MMM YYYY") : String(text);
          case "tag":
            return <Tag color={tagColor}>{t(`status.${statusKey}`)}</Tag>;
          case "badge":
            return <Badge color={String(text).toLowerCase()} text={String(text)} />;
          default:
            return String(text);
        }
      },
    })),
    {
      key: "action",
      align: "center",
      fixed: "right",
      width: 100,
      render: (_, record: TableRecord) => {
        const menuItems: MenuProps["items"] = [];

        if (config.tableConfig.viewRecord) {
          menuItems.push({
            key: "view",
            label: t("common.view"),
            icon: <EyeOutlined />,
            onClick: () => handleView(record),
          });
        }

        if (config.api.put && config.tableConfig.showEdit !== false) {
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
          <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
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
        size={tableSize}
        pagination={{
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} ${t("common.items")}`,
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
