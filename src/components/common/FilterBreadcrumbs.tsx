import React from "react";
import { Tag, Space, Typography, Card, Button, Tooltip } from "antd";
import { CloseCircleOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

const { Text, Title } = Typography;

interface FilterBreadcrumbsProps {
  state: {
    sortBy?: string;
    sortOrder?: "ascend" | "descend";
    columnFilters: Record<string, (string | number)[] | null>;
    searchKey: string;
    searchValue: string;
    dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
  };
  onClear: {
    globalSearch: () => void;
    dateRange: () => void;
    sorter: () => void;
    columnFilter: (key: string) => void;
    allColumnFilters: () => void;
    all: () => void;
  };
  columnLabels: Record<string, string>;
}

const FilterBreadcrumbs: React.FC<FilterBreadcrumbsProps> = ({ state, onClear, columnLabels }) => {
  const { t } = useTranslation();
  const filterGroups: React.ReactNode[] = [];

  const { sortBy, sortOrder, searchKey, searchValue, dateRange, columnFilters } = state;

  // 1. Sorter
  if (sortBy && sortOrder) {
    const sortLabel = columnLabels[sortBy] || sortBy;
    const direction = sortOrder === "ascend" ? t("common.ascending") : t("common.descending");
    filterGroups.push(
      <div key="sorter">
        <Space>
          <Title level={5} style={{ margin: 0 }}>{t("common.sortOrder")}</Title>
          <Tooltip title="Clear Sort">
            <Button type="text" shape="circle" icon={<CloseCircleOutlined />} onClick={onClear.sorter} />
          </Tooltip>
        </Space>
        <Tag style={{ marginTop: 8 }}>{`${sortLabel} (${direction})`}</Tag>
      </div>,
    );
  }

  // 2. Global Search & Date Range
  const generalFilters: React.ReactNode[] = [];
  if (searchKey && searchValue) {
    const label = columnLabels[searchKey] || searchKey;
    generalFilters.push(
      <Tag key="search" closable onClose={onClear.globalSearch}>
        {label}: <Text strong>{searchValue}</Text>
      </Tag>,
    );
  }
  if (dateRange) {
    const from = dateRange[0].format("YYYY-MM-DD");
    const to = dateRange[1].format("YYYY-MM-DD");
    generalFilters.push(
      <Tag key="date" closable onClose={onClear.dateRange}>
        {t("form.dateRange")}: <Text strong>{`${from} to ${to}`}</Text>
      </Tag>,
    );
  }
  if (generalFilters.length > 0) {
    filterGroups.push(
      <div key="general">
        <Title level={5} style={{ margin: 0 }}>{t("common.filter")}</Title>
        <Space wrap style={{ marginTop: 8 }}>{generalFilters}</Space>
      </div>,
    );
  }

  // 3. Column Filters
  const columnFilterTags = Object.entries(columnFilters)
    .filter(([, values]) => values && values.length > 0)
    .map(([key, values]) => {
      const label = columnLabels[key] || key;
      return (
        <Tag key={key} closable onClose={() => onClear.columnFilter(key)}>
          {label}: <Text strong>{values!.join(", ")}</Text>
        </Tag>
      );
    });

  if (columnFilterTags.length > 0) {
    filterGroups.push(
      <div key="columns">
        <Space>
          <Title level={5} style={{ margin: 0 }}>{t("common.filter")}</Title>
          <Tooltip title="Clear Column Filters">
            <Button type="text" shape="circle" icon={<CloseCircleOutlined />} onClick={onClear.allColumnFilters} />
          </Tooltip>
        </Space>
        <Space wrap style={{ marginTop: 8 }}>{columnFilterTags}</Space>
      </div>,
    );
  }

  if (filterGroups.length === 0) {
    return null;
  }

  return (
    <Card
      size="small"
      title={t("common.activeFilters")}
      extra={
        <Button type="link" onClick={onClear.all} danger>
          {t("common.clearAll")}
        </Button>
      }
      style={{ marginBottom: 24 }}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        {filterGroups}
      </Space>
    </Card>
  );
};

export default FilterBreadcrumbs;