import React from "react";
import { Tag, Space, Typography, Button, theme } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

const tagStyle: React.CSSProperties = {
  margin: "0 4px",
  cursor: "pointer",
};

const { Text } = Typography;

interface ActiveFiltersDisplayProps {
  state: {
    columnFilters: Record<string, (string | number)[] | null>;
    searchKey: string;
    searchValue: string;
    dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
    sortBy?: string;
    sortOrder?: "ascend" | "descend";
  };
  onClearFilter: (type: "search" | "date" | "column" | "sorter", key?: string, value?: string | number) => void;
  onClearAll: () => void;
  columnLabels: Record<string, string>;
  lookupOptions?: any[];
  getLabelFromValue?: (value: number, options: any[], i18n: any) => string;
  statusLabels?: Record<number, string>;
}

const ActiveFiltersDisplay: React.FC<ActiveFiltersDisplayProps> = ({
  state,
  onClearFilter,
  onClearAll,
  columnLabels,
  lookupOptions = [],
  getLabelFromValue,
  statusLabels,
}) => {
  const { t, i18n } = useTranslation();
  const { token } = theme.useToken(); // 🎨 Grab theme colors
  const filterGroups: React.ReactNode[] = [];

  // Use the theme's primary color for tags
  const tagColor = token.colorPrimary;

  // Helper: get lookup options for a specific column
  const getLookupOptionsForColumn = (columnKey: string) => {
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
    };

    const categoryId = columnToCategoryMap[columnKey];
    if (!categoryId) return [];
    return lookupOptions.filter((option) => option.categoryId === categoryId);
  };

  // Helper: get label for a filter value
  const getFilterLabel = (columnKey: string, value: string | number) => {
    if (columnKey === "status" && statusLabels) {
      return statusLabels[Number(value)] || String(value);
    }

    if (getLabelFromValue && lookupOptions.length > 0) {
      const lookupOptionsForColumn = getLookupOptionsForColumn(columnKey);
      if (lookupOptionsForColumn.length > 0) {
        return getLabelFromValue(Number(value), lookupOptionsForColumn, i18n);
      }
    }
    return String(value);
  };

  // 1. Sorter
  if (state.sortBy && state.sortOrder) {
    const sortLabel = columnLabels[state.sortBy] || state.sortBy;
    filterGroups.push(
      <Space key="sorter_group" align="center">
        <Text>{t("common.sortBy")}: </Text>
        <Tag
          color={tagColor}
          key="sorter"
          closable
          onClose={() => onClearFilter("sorter")}
          icon={state.sortOrder === "ascend" ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          style={tagStyle}
        >
          {sortLabel}
        </Tag>
      </Space>,
    );
  }

  // 2. Global Search Filter
  if (state.searchKey && state.searchValue) {
    const searchLabel = columnLabels[state.searchKey] || state.searchKey;
    filterGroups.push(
      <Space key="search_group" align="center">
        <Text>{searchLabel}: </Text>
        <Tag color={tagColor} key="search" closable onClose={() => onClearFilter("search")} style={tagStyle}>
          {state.searchValue}
        </Tag>
      </Space>,
    );
  }

  // 3. Date Range Filter
  if (state.dateRange) {
    const from = state.dateRange[0].format("DD-MM-YYYY");
    const to = state.dateRange[1].format("DD-MM-YYYY");
    filterGroups.push(
      <Space key="date_group" align="center">
        <Text>{t("form.dateRange")}: </Text>
        <Tag color={tagColor} key="date" closable onClose={() => onClearFilter("date")} style={tagStyle}>
          {`${from} to ${to}`}
        </Tag>
      </Space>,
    );
  }

  // 4. Column Filters
  for (const key in state.columnFilters) {
    const values = state.columnFilters[key];
    if (values && values.length > 0) {
      const groupLabel = columnLabels[key] || key;
      const groupTags = (
        <Space key={key} size={[0, 8]} wrap align="center">
          <Text style={{ marginRight: 10 }}>{groupLabel}: </Text>
          {values.map((value) => (
            <Tag
              color={tagColor}
              key={String(value)}
              closable
              onClose={() => onClearFilter("column", key, value)}
              style={tagStyle}
            >
              {getFilterLabel(key, value)}
            </Tag>
          ))}
        </Space>
      );
      filterGroups.push(groupTags);
    }
  }

  if (filterGroups.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        rowGap: 8,
        padding: "8px 4px",
        borderTop: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Space wrap>{filterGroups}</Space>
      <Button
        type="link"
        danger
        onClick={onClearAll}
        style={{ whiteSpace: "nowrap", paddingRight: 0, color: tagColor }}
      >
        {t("common.clearAll")}
      </Button>
    </div>
  );
};

export default ActiveFiltersDisplay;
