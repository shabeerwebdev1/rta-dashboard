import React from "react";
import { Table, Pagination, Card, Tag, Button, Dropdown, theme } from "antd";
import type { TableProps } from "antd";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { STATUS_COLORS } from "../../constants/ui";
import type { PageConfig } from "../../types/config";
import { MoreOutlined } from "@ant-design/icons";
import { ColumnsType } from "antd/es/table";

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
  lookupOptions?: any[];
  getLabelFromValue?: (value: number, options: any[], i18n: any) => string;
  filterOptions?: Record<string, Array<{ text: string; value: string | number }>>;
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
  lookupOptions = [],
  getLabelFromValue,
  filterOptions = {},
}) => {
  const { t, i18n } = useTranslation();
  const { token } = theme.useToken();

  // ✅ Enhanced rowKey function with fallbacks
  const getRowKey = React.useCallback(
    (record: any, index: number) => {
      // Try the specified rowKey first
      if (rowKey && record[rowKey] !== undefined && record[rowKey] !== null) {
        return record[rowKey];
      }

      // Fallback to other common unique identifiers
      const commonKeys = ["id", "key", "ID", "Key", "uuid", "UUID"];
      for (const key of commonKeys) {
        if (record[key] !== undefined && record[key] !== null) {
          return record[key];
        }
      }

      // Final fallback: use index (not ideal but prevents errors)
      return `row-${index}`;
    },
    [rowKey],
  );

  // Helper to get lookup options for a specific column
  const getLookupOptionsForColumn = (columnKey: string) => {
    const columnToCategoryMap: Record<string, number> = {
      plateSource_Id: 200,
      plateType_Id: 300,
      plateColor_Id: 400,
      plateStatus_Id: 500,
      exemptionReason_ID: 100,
      sourceOfObstacle: 800,
      pledgeType: 900,
      inspectionType:1400,
      inspectionCategory:1300,
      inspectionStatus:1500
    };

    const categoryId = columnToCategoryMap[columnKey];
    if (!categoryId) return [];

    return lookupOptions.filter((option) => option.categoryId === categoryId);
  };

  const getFilterOptionsWithLabels = (columnKey: string) => {
    // First, check if filterOptions are provided for this column
    if (filterOptions && filterOptions[columnKey] && filterOptions[columnKey].length > 0) {
      return filterOptions[columnKey];
    }

    // Fallback to lookup options
    const lookupOptionsForColumn = getLookupOptionsForColumn(columnKey);
    if (lookupOptionsForColumn.length > 0) {
      return lookupOptionsForColumn.map((option) => ({
        text: i18n.language === "ar" ? option.labelAr || option.label : option.labelEn || option.label,
        value: option.value || option.id,
      }));
    }

    // Final fallback: extract unique values from data
    if (!data || data.length === 0) return [];
    const uniqueValues = [...new Set(data.map((item: any) => item[columnKey]).filter(Boolean))];
    return uniqueValues.map((value) => ({ text: String(value), value }));
  };

  const columns = React.useMemo(() => {
    const generatedColumns = pageConfig.tableConfig.columns.map((col: any) => {
      const antdCol: any = {
        key: col.key,
        title: t(col.title),
        dataIndex: col.key,
        filteredValue: state.columnFilters[col.key] || null,
        width: col.key === "plateUI" ? "160px" : undefined,
      };

      if (col.sortable) {
        antdCol.sorter = true;
        if (state.sortBy === col.key) {
          antdCol.sortOrder = state.sortOrder;
        }
      }

      if (col.filterable) {
        // Use the enhanced filter function
        antdCol.filters = getFilterOptionsWithLabels(col.key);
        antdCol.filterMode = "tree";
        antdCol.filterSearch = true;
        
        // Add onFilter function for custom filtering
        if (!col.onFilter) {
          antdCol.onFilter = (value: any, record: any) => {
            // Handle numeric values (like status)
            if (typeof record[col.key] === 'number' || typeof value === 'number') {
              return record[col.key] === Number(value);
            }
            // Handle string values
            return String(record[col.key]) === String(value);
          };
        } else {
          antdCol.onFilter = col.onFilter;
        }
      }

      if (col.render) {
        antdCol.render = col.render;
      } else {
        antdCol.render = (text: any) => {
          if (text === null || text === undefined || text === "") return t("common.noData");

          if (getLabelFromValue && lookupOptions.length > 0) {
            const lookupOptionsForColumn = getLookupOptionsForColumn(col.key);
            if (lookupOptionsForColumn.length > 0) {
              const label = getLabelFromValue(text, lookupOptionsForColumn, i18n);
              text = label;
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
    state.columnFilters,
    state.sortBy,
    state.sortOrder,
    lookupOptions,
    getLabelFromValue,
    i18n,
    filterOptions,
  ]);

  return (
    <Card bordered={false} bodyStyle={{ padding: 0 }}>
      <Table
        rowKey={getRowKey}
        columns={columns}
        scroll={{ x: 1200 }}
        sticky={{ offsetHeader: 64 }}
        dataSource={data}
        loading={isLoading}
        pagination={false}
        onChange={handleTableChange}
        rowSelection={rowSelection}
        size={tableSize}
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
          showSizeChanger={{ showSearch: false }}
          pageSizeOptions={["10", "20", "50"]}
          onChange={handlePaginationChange}
          
        />
      </div>
    </Card>
  );
};

export default DataTableWrapper;