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
}

const ActiveFiltersDisplay: React.FC<ActiveFiltersDisplayProps> = ({
  state,
  onClearFilter,
  onClearAll,
  columnLabels,
}) => {
  const { t } = useTranslation();
  const filterGroups: React.ReactNode[] = [];

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
        <Tag color="#ee3a41" key="search" closable onClose={() => onClearFilter("search")} style={{ userSelect: "none" }}>
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
            <Tag color="#ee3a41" style={{}} key={String(value)} closable onClose={() => onClearFilter("column", key, value)}>
              {String(value)}
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