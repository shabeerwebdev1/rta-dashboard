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
        <>
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
      </>
    );
  }

  // 2. Global Search Filter
  if (state.searchKey && state.searchValue) {
    const searchLabel = columnLabels[state.searchKey] || state.searchKey;
    filterGroups.push(
        <>
        <Text>{searchLabel}: </Text>
      <Tag color="#ee3a41" key="search" closable onClose={() => onClearFilter("search")} style={{ userSelect: "none" }}>
        < >{state.searchValue}</>
      </Tag>
      </>
    );
  }

  // 3. Date Range Filter
  if (state.dateRange) {
    const from = state.dateRange[0].format("YYYY-MM-DD");
    const to = state.dateRange[1].format("YYYY-MM-DD");
    filterGroups.push(
        <>
        <Text> {t("form.dateRange")}: </Text>
      <Tag color="#ee3a41" key="date" closable onClose={() => onClearFilter("date")} style={{ userSelect: "none" }}>
        < >{`${from} to ${to}`}</>
      </Tag>
      </>
    );
  }

  // 4. Column Filters
  for (const key in state.columnFilters) {
    const values = state.columnFilters[key];
    if (values && values.length > 0) {
      const groupLabel = columnLabels[key] || key;
      const groupTags = (
        <Space key={key} size={[0, 8]} wrap>
          <Text style={{marginRight: 10}}>{groupLabel}: </Text>
          {values.map((value) => (
            <Tag color="#ee3a41" style={{}} key={String(value)} closable onClose={() => onClearFilter("column", key, value)}>
              {String(value)}
            </Tag>
          ))}
          {/* <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={() => onClearFilter("column", key)}
            title={`Clear all ${groupLabel} filters`}
          /> */}
        </Space>
      );
      filterGroups.push(groupTags);
    }
  }

  if (filterGroups.length === 0) {
    return null;
  }

  return (
    <div style={{ position: "relative", padding: "0 16px 8px 4px", borderTop: "1px solid var(--ant-color-border-secondary)" }}>
      <Space wrap>
        {/* <Text strong>{t("common.activeFilters")}:</Text> */}
        {filterGroups}
        <div style={{position: "sticky", right: 0 }}>
        <Button type="link" danger onClick={onClearAll}>
          {t("common.clearAll")}
        </Button>
        </div>
      </Space>
    </div>
  );
};

export default ActiveFiltersDisplay;