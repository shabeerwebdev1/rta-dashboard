import React from "react";
import { Table, Pagination, Card, Tag, Button, Dropdown, theme } from "antd";
import type { TableProps } from "antd";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { STATUS_COLORS } from "../../constants/ui";
import type { PageConfig } from "../../types/config";
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
  lookupOptions?: any[];
  getLabelFromValue?: (value: number, options: any[], i18n: any) => string;
  filterOptions?: Record<string, Array<{ text: string; value: string | number }>>;
  showPagination?: boolean;
  columnLookupMap?: Record<string, number>;
  rowClassName?: (record: any, index: number) => string; // ADD THIS LINE
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
  showPagination = true,
  columnLookupMap,
  rowClassName, // ADD THIS LINE
}) => {
  const { t, i18n } = useTranslation();
  const { token } = theme.useToken();

  const getRowKey = React.useCallback(
    (record: any, index: number) => {
      if (rowKey && record[rowKey] !== undefined && record[rowKey] !== null) {
        return record[rowKey];
      }

      const commonKeys = ["id", "key", "ID", "Key", "uuid", "UUID"];
      for (const key of commonKeys) {
        if (record[key] !== undefined && record[key] !== null) {
          return record[key];
        }
      }

      return `row-${index}`;
    },
    [rowKey],
  );

  // Helper to get lookup options for a specific column with usage context
  const getLookupOptionsForColumn = (columnKey: string, useFor: "display" | "filter" = "display") => {
    //  For filters, first check columnLookupMap if provided
    if (useFor === "filter" && columnLookupMap && columnLookupMap[columnKey]) {
      const categoryId = columnLookupMap[columnKey];
      return lookupOptions.filter((option) => option.categoryId === categoryId);
    }

    //  For display or fallback, use the default mapping
    const columnToCategoryMap: Record<string, number> = {
      plateSource_Id: 200,
      plateType_Id: 300,
      plateColor_Id: 400,
      plateStatus_Id: 500,
      exemptionReason_ID: 100,
      sourceOfObstacle: 800,
      pledgeType: 900,
      inspectionType: 1400,
      inspectionCategory: 1300,
      inspectionStatus: 1500,
      payment_Type: 1100,
      ParkingInspectionType: 1800,
      CarInspectionType: 1700,
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

    // Use the modified function that checks columnLookupMap for filters
    const lookupOptionsForColumn = getLookupOptionsForColumn(columnKey, "filter");
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
        ...col,
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
        antdCol.filters = getFilterOptionsWithLabels(col.key);
        antdCol.filterMode = "tree";
        antdCol.filterSearch = true;

        if (!col.onFilter) {
          antdCol.onFilter = (value: any, record: any) => {
            if (typeof record[col.key] === "number" || typeof value === "number") {
              return record[col.key] === Number(value);
            }
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
            // ✅ For display, use the default mapping (not columnLookupMap)
            const lookupOptionsForColumn = getLookupOptionsForColumn(col.key, "display");
            if (lookupOptionsForColumn.length > 0) {
              const label = getLabelFromValue(text, lookupOptionsForColumn, i18n);
              text = label;
            }
          }

          switch (col.type) {
            case "date":
              return dayjs(text as string).isValid() ? dayjs(text as string).format("DD-MM-YYYY") : String(text);

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
        render: (_: any, record: any) => {
          const items = actionMenuItems(record);

          if (items.length === 1) {
            const single = items[0];
            return <Button type="text" icon={single.icon} onClick={single.onClick} disabled={single.disabled}></Button>;
          }

          return (
            <Dropdown menu={{ items }} trigger={["click"]}>
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          );
        },
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
    columnLookupMap,
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
        rowSelection={{ ...rowSelection, preserveSelectedRowKeys: true }}
        size={tableSize}
        sortDirections={["ascend", "descend"]}
        rowClassName={rowClassName} // ADD THIS LINE
        {...(state.sortBy && {
          sortOrder: state.sortOrder,
          sortColumn: state.sortBy,
        })}
      />
      {showPagination && (
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
      )}
    </Card>
  );
};

export default DataTableWrapper;
