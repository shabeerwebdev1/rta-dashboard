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
  // ✅ NEW: Zone and Area options
  zoneOptions?: any[];
  areaOptions?: any[];
  areaIdToNameMap?: Map<number, string>;
}

const ActiveFiltersDisplay: React.FC<ActiveFiltersDisplayProps> = ({
  state,
  onClearFilter,
  onClearAll,
  columnLabels,
  lookupOptions = [],
  getLabelFromValue,
  statusLabels,
  // ✅ NEW: Zone and Area props
  zoneOptions = [],
  areaOptions = [],
  areaIdToNameMap,
}) => {
  const { t, i18n } = useTranslation();
  const { token } = theme.useToken();
  const filterGroups: React.ReactNode[] = [];

  const tagColor = token.colorPrimary;

  // Helper function to get lookup options for a specific column
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

  // ✅ UPDATED: Enhanced getFilterLabel function with zone and area support
  const getFilterLabel = (columnKey: string, value: string | number) => {
    // 1. Handle Zone filter
    if (columnKey === "zone") {
      const zone = zoneOptions.find(z => z.value?.toString() === value.toString());
      return zone ? zone.label : String(value);
    }

    // 2. Handle Area filter - Try areaOptions first
    if (columnKey === "area") {
      const area = areaOptions.find(a => a.value?.toString() === value.toString());
      if (area) return area.label;
      
      // Fallback to areaIdToNameMap
      if (areaIdToNameMap) {
        const areaName = areaIdToNameMap.get(Number(value));
        if (areaName) return areaName;
      }
      
      return String(value);
    }

    // 3. Handle status labels
    if ((columnKey === "status" || columnKey === "dispute_Status" || columnKey === "reviewStatus") && statusLabels) {
      return statusLabels[Number(value)] || String(value);
    }

    // 4. Handle lookup-based filters
    if (getLabelFromValue) {
      const optionsForColumn = getLookupOptionsForColumn(columnKey);
      if (optionsForColumn.length > 0) {
        return getLabelFromValue(value as any, optionsForColumn, i18n);
      }
    }

    // 5. Fallback
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
        alignItems: "center",
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