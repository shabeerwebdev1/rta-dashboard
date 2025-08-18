import { useState, useMemo, useCallback } from "react";
import type { TableProps } from "antd";
import type { SorterResult } from "antd/es/table/interface";

interface TableParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: "ascend" | "descend";
  filters: Record<string, any>;
}

const useTableParams = (initialPageSize = 10) => {
  const [params, setParams] = useState<TableParams>({
    page: 1,
    pageSize: initialPageSize,
    filters: {},
  });

  const handleTableChange: TableProps["onChange"] = (pagination, filters, sorter) => {
    const s = sorter as SorterResult<any>;
    setParams((prev) => ({
      ...prev,
      page: pagination.current || 1,
      pageSize: pagination.pageSize || initialPageSize,
      sortBy: s.field as string,
      sortOrder: s.order,
      filters: { ...prev.filters, ...filters },
    }));
  };

  const setFilter = useCallback((key: string, value: any) => {
    setParams((prev) => ({
      ...prev,
      page: 1, // Reset to first page on filter change
      filters: {
        ...prev.filters,
        [key]: value,
      },
    }));
  }, []);

  const setSearchFilters = useCallback((newFilters: Record<string, any>) => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      filters: { ...newFilters },
    }));
  }, []);

  const apiParams = useMemo(
    () => ({
      PageNumber: params.page,
      PageSize: params.pageSize,
      SortBy: params.sortBy,
      SortDescending: params.sortOrder === "descend",
      ...params.filters,
    }),
    [params],
  );

  return {
    params,
    apiParams,
    handleTableChange,
    setFilter,
    setSearchFilters,
  };
};

export default useTableParams;