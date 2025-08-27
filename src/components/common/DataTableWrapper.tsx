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
  state: {
    columnFilters: Record<string, (string | number)[] | null>;
    sortBy?: string;
    sortOrder?: "ascend" | "descend";
  };
  // Add these new props for lookup data
  lookupOptions?: any[];
  getLabelFromValue?: (value: number, options: any[], i18n: any) => string;
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
  state,
  // New props for lookup data
  lookupOptions = [],
  getLabelFromValue,
}) => {
  const { t, i18n } = useTranslation();
  const { token } = theme.useToken();

  // Helper to get lookup options for a specific column
  const getLookupOptionsForColumn = (columnKey: string) => {
    // Map column keys to their corresponding lookup categories
    const columnToCategoryMap: Record<string, number> = {
      plateSource_Id: 200,
      plateType_Id: 300,
      plateColor_Id: 400,
      plateStatus_Id: 500,
      exemptionReason_ID: 100,
      sourceOfObstacle: 800,
      pledgeType: 900,
    };

    const categoryId = columnToCategoryMap[columnKey];
    if (!categoryId) return [];

    return lookupOptions.filter((option) => option.categoryId === categoryId);
  };

  // Helper to get filter options with labels from lookup data
  const getFilterOptionsWithLabels = (columnKey: string) => {
    const lookupOptionsForColumn = getLookupOptionsForColumn(columnKey);

    if (lookupOptionsForColumn.length > 0) {
      return lookupOptionsForColumn.map((option) => ({
        text: i18n.language === "ar" ? option.labelAr || option.label : option.labelEn || option.label,
        value: option.value || option.id,
      }));
    }

    // Fallback: unique values from data
    if (!data) return [];
    const uniqueValues = [...new Set(data.map((item: any) => item[columnKey]).filter(Boolean))];
    return uniqueValues.map((value) => ({ text: String(value), value }));
  };

  // helper for unique filters (fallback if no lookup data available)
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
        // Add this to control filter state - CRITICAL FIX
        filteredValue: state.columnFilters[col.key] || null,
      };

      // enable sorter if requested
      if (col.sortable) {
        antdCol.sorter = true;
        if (state.sortBy === col.key) {
          antdCol.sortOrder = state.sortOrder;
        }
      }

      // ✅ Updated filter logic - use lookup data for labels
      if (col.filterable) {
        if (col.type === "select" && col.options) {
          // use provided options (label/value) for filters
          antdCol.filters = (col.options as { label: string; value: unknown }[]).map((opt) => ({
            text: opt.label,
            value: opt.value,
          }));
        } else if (lookupOptions.length > 0) {
          // use lookup data for filter options with labels
          antdCol.filters = getFilterOptionsWithLabels(col.key);
        } else {
          // fallback: unique raw values from data
          antdCol.filters = getUniqueFilters(col.key);
        }
        antdCol.filterMode = "tree";
        antdCol.filterSearch = true;
      }

      // ✅ Updated render logic - use lookup data for labels
      if (col.render) {
        // respect custom render from config
        antdCol.render = col.render;
      } else {
        // default render behavior with lookup support
        antdCol.render = (text: any) => {
          if (text === null || text === undefined || text === "") return t("common.noData");

          // Use lookup data to display labels instead of values
          if (getLabelFromValue && lookupOptions.length > 0) {
            const lookupOptionsForColumn = getLookupOptionsForColumn(col.key);
            if (lookupOptionsForColumn.length > 0) {
              const label = getLabelFromValue(text, lookupOptionsForColumn, i18n);
              text = label; // Replace value with label for display
            }
          }

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

    // ✅ add action column if menu items provided
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
  }, [
    pageConfig.tableConfig.columns,
    t,
    data,
    actionMenuItems,
    state.columnFilters, // Add this dependency
    state.sortBy,
    state.sortOrder,
    lookupOptions,
    getLabelFromValue,
    i18n,
  ]);

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
        // Add controlled sorting
        sortDirections={["ascend", "descend"]}
        {...(state.sortBy && {
          sortOrder: state.sortOrder,
          sortColumn: state.sortBy,
        })}
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
