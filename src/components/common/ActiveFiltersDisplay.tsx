import React from "react";
import { Tag, Space, Typography, Button, theme } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined, UserOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import "dayjs/locale/ar";

// Helper function to format date based on language
const formatDateRange = (date: dayjs.Dayjs, language: string) => {
  return date
    .locale(language.startsWith("ar") ? "ar" : "en")
    .format(language.startsWith("ar") ? "DD MMMM YYYY" : "DD MMM YYYY");
};

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
  // My Approvals filter props
  showMyApprovals?: boolean;
  onClearMyApprovals?: () => void;
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
  // My Approvals props
  showMyApprovals,
  onClearMyApprovals,
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
      pledgeStatus: 500,
    };

    const categoryId = columnToCategoryMap[columnKey];
    if (!categoryId) return [];

    return lookupOptions.filter((option) => option.categoryId === categoryId);
  };

  const getFilterLabel = (columnKey: string, value: string | number) => {
    // Handle Zone filter
    if (columnKey === "zone") {
      const zone = zoneOptions.find((z) => z.value?.toString() === value.toString());
      return zone ? zone.label : String(value);
    }

    // Handle Area filter - Try areaOptions first
    if (columnKey === "area") {
      const area = areaOptions.find((a) => a.value?.toString() === value.toString());
      if (area) return area.label;

      // Fallback to areaIdToNameMap
      if (areaIdToNameMap) {
        const areaName = areaIdToNameMap.get(Number(value));
        if (areaName) return areaName;
      }

      return String(value);
    }

    // Handle status labels with bilingual support
    if (
      (columnKey === "status" ||
        columnKey === "dispute_Status" ||
        columnKey === "reviewStatus" ||
        columnKey === "isUpdatedBack" ||
        columnKey === "plateStatus_Id") &&
      statusLabels
    ) {
      return statusLabels[Number(value)] || String(value);
    }

    // Handle lookup-based filters (with bilingual support)
    if (getLabelFromValue) {
      const optionsForColumn = getLookupOptionsForColumn(columnKey);
      if (optionsForColumn.length > 0) {
        return getLabelFromValue(value as any, optionsForColumn, i18n);
      }
    }

    // Fallback
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

  // 3. Date Range Filter (with bilingual support)
  if (state.dateRange) {
    const from = formatDateRange(state.dateRange[0], i18n.language);
    const to = formatDateRange(state.dateRange[1], i18n.language);
    const dateLabel = i18n.language === "ar" ? "من إلى" : "from to";
    
    filterGroups.push(
      <Space key="date_group" align="center">
        <Text>{t("form.dateRange")}: </Text>
        <Tag color={tagColor} key="date" closable onClose={() => onClearFilter("date")} style={tagStyle}>
          {`${from} ${dateLabel} ${to}`}
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

  if (showMyApprovals) {
    filterGroups.push(
      <Space key="my_approvals_group" align="center">
        <Text>{t("common.showMyApprovals")}: </Text>
        <Tag
          color={tagColor}
          key="my_approvals"
          closable
          onClose={onClearMyApprovals}
          style={tagStyle}
          icon={<UserOutlined />}
        >
          {t("common.showingyourApprovals")}
        </Tag>
      </Space>,
    );
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