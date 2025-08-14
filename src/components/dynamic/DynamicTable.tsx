import React from "react";
import { Table, Button, Tag, Badge, Dropdown } from "antd";
import type { TableProps, MenuProps, TableColumnType as AntTableColumnType } from "antd";
import { EditOutlined, DeleteOutlined, EyeOutlined, MoreOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import type { PageConfig } from "../../types/config";

interface TableRecord {
  id: string | number;
  [key: string]: unknown;
}

interface DynamicTableProps {
  config: PageConfig;
  data: TableRecord[];
  loading: boolean;
  onView: (record: TableRecord) => void;
  onEdit: (record: TableRecord) => void;
  onDelete?: (record: TableRecord) => void;
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
  onView,
  onEdit,
  onDelete,
  selectedRowKeys,
  setSelectedRowKeys,
}) => {
  const { t } = useTranslation();

  const columns: AntTableColumnType<TableRecord>[] = [
    ...config.tableConfig.columns.map((col) => {
      const { key, title, type, filterable } = col;

      const columnProps: AntTableColumnType<TableRecord> = {
        title: t(title),
        dataIndex: key,
        key: key,
        sorter: (a: TableRecord, b: TableRecord) => {
          const aVal = a[key];
          const bVal = b[key];
          if (typeof aVal === "string" && typeof bVal === "string") {
            return aVal.localeCompare(bVal);
          }
          if (typeof aVal === "number" && typeof bVal === "number") {
            return aVal - bVal;
          }
          return 0;
        },
        render: (text: unknown) => {
          if (text === null || text === undefined || text === "") return " - ";

          if (col.type === "select" && col.options) {
            const found = col.options.find((opt: any) => opt.value === text);
            return found ? found.label : String(text);
          }

          const statusKey = typeof text === "string" ? text.toLowerCase() : "";
          const tagColor = statusColors[statusKey as keyof typeof statusColors] ?? "default";

          switch (type) {
            case "date":
              return dayjs(text as string).isValid() ? dayjs(text as string).format("DD MMM YYYY") : String(text);
            case "tag":
              return <Tag color={tagColor}>{t(`status.${statusKey}`, statusKey)}</Tag>;
            case "badge":
              return <Badge color={String(text).toLowerCase()} text={String(text)} />;
            default:
              return String(text);
          }
        },
      };

      if (filterable) {
        const uniqueValues = [...new Set(data.map((item) => item[key]).filter(Boolean))];
        columnProps.filters = uniqueValues.map((value) => ({
          text: String(value),
          value: value as string | number,
        }));
        columnProps.filterMode = "tree";
        columnProps.filterSearch = true;
        columnProps.onFilter = (value, record) => record[key] === value;
      }

      return columnProps;
    }),
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
            onClick: () => onView(record),
          });
        }

        if (config.api.put && (config.tableConfig as any).showEdit !== false) {
          menuItems.push({
            key: "edit",
            label: t("common.edit"),
            icon: <EditOutlined />,
            onClick: () => onEdit(record),
          });
        }

        if (config.api.delete && onDelete) {
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
  );
};

export default DynamicTable;
