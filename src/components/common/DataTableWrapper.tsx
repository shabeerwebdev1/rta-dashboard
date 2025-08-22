import React from "react";
import { Table, Pagination, Card, Tag, Button, Dropdown, theme } from "antd";
import type { TableProps } from "antd";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { STATUS_COLORS } from "../../constants/ui";
import type { PageConfig, TableColumn } from "../../types/config";
import { MoreOutlined } from "@ant-design/icons";

interface DataTableWrapperProps {
  pageConfig: PageConfig;
  data: any[];
  total: number;
  isLoading: boolean;
  apiParams: { PageNumber: number; PageSize: number };
  handleTableChange: TableProps<any>["onChange"];
  handlePaginationChange: (page: number, pageSize: number) => void;
  rowSelection?: any;
  actionMenuItems?: (record: any) => any[];
  tableSize: "middle" | "small";
  rowKey?: string;
}

const DataTableWrapper: React.FC<DataTableWrapperProps> = ({
  pageConfig,
  data,
  total,
  isLoading,
  apiParams,
  handleTableChange,
  handlePaginationChange,
  rowSelection,
  actionMenuItems,
  tableSize,
  rowKey = "id",
}) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();

  const getUniqueFilters = (key: string) => {
    if (!data) return [];
    const uniqueValues = [...new Set(data.map((item: any) => item[key]).filter(Boolean))];
    return uniqueValues.map((value) => ({ text: String(value), value: String(value) }));
  };

  const columns = React.useMemo(() => {
    const generatedColumns = pageConfig.tableConfig.columns.map((col: TableColumn) => {
      const antdCol: any = {
        key: col.key,
        title: t(col.title),
        dataIndex: col.key,
      };

      if (col.sortable) {
        antdCol.sorter = true;
      }

      if (col.filterable) {
        antdCol.filters = getUniqueFilters(col.key);
        antdCol.filterMode = "tree";
        antdCol.filterSearch = true;
      }

      // 🔹 Respect custom render if provided in config
      if (col.render) {
        antdCol.render = col.render;
      } else {
        // 🔹 Fallback render logic
        antdCol.render = (text: any) => {
          if (text === null || text === undefined || text === "") return t("common.noData");

          switch (col.type) {
            case "date":
              return dayjs(text as string).isValid() ? dayjs(text as string).format("YYYY-MM-DD") : String(text);

            case "tag": {
              const statusKey = String(text).toLowerCase();
              return (
                <Tag color={STATUS_COLORS[statusKey] || "default"}>
                  {t(`status.${statusKey}`, { defaultValue: String(text) })}
                </Tag>
              );
            }

            case "badge":
              return String(text);

            case "select": {
              const options = (col.options as { label: string; value: unknown }[]) || [];
              const option = options.find((opt) => String(opt.value) === String(text));
              return option ? option.label : String(text);
            }

            default:
              return String(text);
          }
        };
      }

      return antdCol;
    });

    if (actionMenuItems) {
      generatedColumns.push({
        key: "action",
        align: "center" as const,
        fixed: "right",
        width: 50,
        render: (_: any, record: any) => (
          <Dropdown menu={{ items: actionMenuItems(record) }} trigger={["click"]}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        ),
      });
    }

    return generatedColumns;
  }, [pageConfig.tableConfig.columns, t, data, actionMenuItems]);

  return (
    <Card bordered={false} bodyStyle={{ padding: 0 }}>
      <Table
        rowKey={rowKey}
        columns={columns}
        scroll={{ x: 1200 }}
        sticky={{ offsetHeader: 64 }}
        dataSource={data}
        loading={isLoading}
        pagination={false}
        onChange={handleTableChange}
        rowSelection={rowSelection}
        size={tableSize}
      />
      <div
        style={{
          position: "sticky",
          bottom: 0,
          background: token.colorBgContainer,
          padding: "12px 16px",
          textAlign: "right",
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          zIndex: 10,
        }}
      >
        <Pagination
          current={apiParams.PageNumber}
          pageSize={apiParams.PageSize}
          total={total}
          showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} ${t("common.items")}`}
          showSizeChanger={true}
          pageSizeOptions={["10", "20", "50"]}
          onChange={handlePaginationChange}
        />
      </div>
    </Card>
  );
};

export default DataTableWrapper;
