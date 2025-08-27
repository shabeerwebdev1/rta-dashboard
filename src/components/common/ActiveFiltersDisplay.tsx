import React from "react";
import { Tag, Space, Typography, Button } from "antd";
import { CloseOutlined, ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

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
  // Add these props for lookup data
  lookupOptions?: any[];
  getLabelFromValue?: (value: number, options: any[], i18n: any) => string;
}

const ActiveFiltersDisplay: React.FC<ActiveFiltersDisplayProps> = ({
  state,
  onClearFilter,
  onClearAll,
  columnLabels,
  lookupOptions = [],
  getLabelFromValue,
}) => {
  const { t, i18n } = useTranslation();
  const filterGroups: React.ReactNode[] = [];

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
    };

    const categoryId = columnToCategoryMap[columnKey];
    if (!categoryId) return [];

    return lookupOptions.filter((option) => option.categoryId === categoryId);
  };

  // Helper to get label for a filter value
  const getFilterLabel = (columnKey: string, value: string | number) => {
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
      <Space key="sorter_group">
        <Text>{t("common.sortBy")}: </Text>
        <Tag
          color="#ee3a41"
          key="sorter"
          closable
          onClose={() => onClearFilter("sorter")}
          icon={state.sortOrder === "ascend" ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          style={{ userSelect: "none" }}
        >
          <>{sortLabel}</>
        </Tag>
      </Space>,
    );
  }

  // 2. Global Search Filter
  if (state.searchKey && state.searchValue) {
    const searchLabel = columnLabels[state.searchKey] || state.searchKey;
    filterGroups.push(
      <Space key="search_group">
        <Text>{searchLabel}: </Text>
        <Tag
          color="#ee3a41"
          key="search"
          closable
          onClose={() => onClearFilter("search")}
          style={{ userSelect: "none" }}
        >
          <>{state.searchValue}</>
        </Tag>
      </Space>,
    );
  }

  // 3. Date Range Filter
  if (state.dateRange) {
    const from = state.dateRange[0].format("YYYY-MM-DD");
    const to = state.dateRange[1].format("YYYY-MM-DD");
    filterGroups.push(
      <Space key="date_group">
        <Text> {t("form.dateRange")}: </Text>
        <Tag color="#ee3a41" key="date" closable onClose={() => onClearFilter("date")} style={{ userSelect: "none" }}>
          <>{`${from} to ${to}`}</>
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
        <Space key={key} size={[0, 8]} wrap>
          <Text style={{ marginRight: 10 }}>{groupLabel}: </Text>
          {values.map((value) => (
            <Tag
              color="#ee3a41"
              style={{}}
              key={String(value)}
              closable
              onClose={() => onClearFilter("column", key, value)}
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
        borderTop: "1px solid var(--ant-color-border-secondary)",
      }}
    >
      <Space wrap>{filterGroups}</Space>
      <Button type="link" danger onClick={onClearAll} style={{ whiteSpace: "nowrap", paddingRight: 0 }}>
        {t("common.clearAll")}
      </Button>
    </div>
  );
};

export default ActiveFiltersDisplay;
