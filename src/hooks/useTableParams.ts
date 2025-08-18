import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { TableProps } from "antd";
import type { SorterResult } from "antd/es/table/interface";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";

interface TableState {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: "ascend" | "descend";
  columnFilters: Record<string, (string | number)[] | null>;
  searchKey: string;
  searchValue: string;
  dateRange: [Dayjs, Dayjs] | null;
}

const serializeParams = (params: Record<string, any>): string => {
  const parts: string[] = [];
  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      const value = params[key];
      if (value === null || value === undefined) continue;
      if (key === "orFilters" && typeof value === "object") {
        for (const filterKey in value) {
          if (value.hasOwnProperty(filterKey)) {
            const filterValues = value[filterKey];
            if (Array.isArray(filterValues)) {
              filterValues.forEach((val) => {
                parts.push(`${encodeURIComponent(`orFilters[${filterKey}]`)}=${encodeURIComponent(val)}`);
              });
            } else {
              parts.push(`${encodeURIComponent(`orFilters[${filterKey}]`)}=${encodeURIComponent(filterValues)}`);
            }
          }
        }
      } else if (key === "betweens" && typeof value === "object") {
        for (const betweenKey in value) {
          if (value.hasOwnProperty(betweenKey)) {
            const range = value[betweenKey];
            if (range.From)
              parts.push(`${encodeURIComponent(`betweens[${betweenKey}][From]`)}=${encodeURIComponent(range.From)}`);
            if (range.To)
              parts.push(`${encodeURIComponent(`betweens[${betweenKey}][To]`)}=${encodeURIComponent(range.To)}`);
          }
        }
      } else {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
    }
  }
  return parts.join("&");
};

const useTableParams = (pageConfig: { globalSearchKeys: string[]; dateRangeKey: string }, initialPageSize = 10) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const getInitialState = (): TableState => {
    const orFilters: Record<string, string[]> = {};
    const betweens: Record<string, { From?: string; To?: string }> = {};

    searchParams.forEach((value, key) => {
      const orMatch = key.match(/orFilters\[(.*?)\]/);
      const betweenMatch = key.match(/betweens\[(.*?)\]\[(From|To)\]/);

      if (orMatch) {
        const filterKey = orMatch[1];
        if (!orFilters[filterKey]) {
          orFilters[filterKey] = [];
        }
        orFilters[filterKey].push(value);
      } else if (betweenMatch) {
        const betweenKey = betweenMatch[1];
        const rangeKey = betweenMatch[2] as "From" | "To";
        if (!betweens[betweenKey]) {
          betweens[betweenKey] = {};
        }
        betweens[betweenKey][rangeKey] = value;
      }
    });

    const searchKey = pageConfig.globalSearchKeys.find((key) => orFilters[key]) || pageConfig.globalSearchKeys[0];
    const searchValue = orFilters[searchKey]?.[0] || "";

    const columnFilters: Record<string, string[] | null> = {};
    for (const key in orFilters) {
      if (key !== searchKey) {
        columnFilters[key] = orFilters[key];
      }
    }

    const dateRange = betweens[pageConfig.dateRangeKey];

    return {
      page: Number(searchParams.get("PageNumber")) || 1,
      pageSize: Number(searchParams.get("PageSize")) || initialPageSize,
      sortBy: searchParams.get("SortBy") || undefined,
      sortOrder:
        searchParams.get("SortDescending") === "true" ? "descend" : searchParams.get("SortBy") ? "ascend" : undefined,
      searchKey,
      searchValue,
      columnFilters,
      dateRange: dateRange ? [dayjs(dateRange.From), dayjs(dateRange.To)] : null,
    };
  };

  const [state, setState] = useState<TableState>(getInitialState);

  const handleTableChange: TableProps["onChange"] = (pagination, tableColumnFilters, sorter) => {
    const s = (Array.isArray(sorter) ? sorter[0] : sorter) as SorterResult<any>;
    setState((prev) => ({
      ...prev,
      page: pagination.current || 1,
      pageSize: pagination.pageSize || initialPageSize,
      sortBy: s.field as string,
      sortOrder: s.order,
      columnFilters: tableColumnFilters as Record<string, (string | number)[] | null>,
    }));
  };

  const handlePaginationChange = useCallback((page: number, pageSize: number) => {
    setState((prev) => ({
      ...prev,
      page,
      pageSize,
    }));
  }, []);

  const setGlobalSearch = useCallback((key: string, value: string) => {
    setState((prev) => ({ ...prev, page: 1, searchKey: key, searchValue: value }));
  }, []);

  const setDateRange = useCallback((dates: [Dayjs, Dayjs] | null) => {
    setState((prev) => ({ ...prev, page: 1, dateRange: dates }));
  }, []);

  const clearFilter = useCallback(
    (type: "search" | "date" | "column" | "sorter", key?: string, valueToRemove?: string | number) => {
      setState((prev) => {
        const newState: TableState = { ...prev, page: 1 };
        switch (type) {
          case "search":
            newState.searchValue = "";
            break;
          case "date":
            newState.dateRange = null;
            break;
          case "sorter":
            newState.sortBy = undefined;
            newState.sortOrder = undefined;
            break;
          case "column":
            if (key) {
              const newColumnFilters = { ...prev.columnFilters };
              if (valueToRemove !== undefined) {
                const currentValues = newColumnFilters[key];
                if (currentValues) {
                  const filteredValues = currentValues.filter((v) => v !== valueToRemove);
                  if (filteredValues.length > 0) {
                    newColumnFilters[key] = filteredValues;
                  } else {
                    delete newColumnFilters[key];
                  }
                }
              } else {
                delete newColumnFilters[key];
              }
              newState.columnFilters = newColumnFilters;
            }
            break;
        }
        return newState;
      });
    },
    [],
  );

  const clearAll = useCallback(() => {
    setState(getInitialState());
  }, []);

  const apiParams = useMemo(() => {
    const params: Record<string, any> = { PageNumber: state.page, PageSize: state.pageSize };
    const orFilters: Record<string, any> = {};
    const betweens: Record<string, any> = {};

    if (state.sortBy && state.sortOrder) {
      params.SortBy = state.sortBy;
      params.SortDescending = state.sortOrder === "descend";
    }
    if (state.searchKey && state.searchValue) orFilters[state.searchKey] = state.searchValue;
    for (const key in state.columnFilters) {
      const value = state.columnFilters[key];
      if (value && value.length > 0) orFilters[key] = value;
    }
    if (state.dateRange) {
      betweens[pageConfig.dateRangeKey] = {
        From: state.dateRange[0].format("YYYY-MM-DD"),
        To: state.dateRange[1].format("YYYY-MM-DD"),
      };
    }
    if (Object.keys(orFilters).length > 0) params.orFilters = orFilters;
    if (Object.keys(betweens).length > 0) params.betweens = betweens;
    return params;
  }, [state, pageConfig]);

  useEffect(() => {
    const newSearchParams = new URLSearchParams(serializeParams(apiParams));
    setSearchParams(newSearchParams, { replace: true });
  }, [apiParams, setSearchParams]);

  return {
    state,
    apiParams,
    handleTableChange,
    handlePaginationChange,
    setGlobalSearch,
    setDateRange,
    clearFilter,
    clearAll,
  };
};

export { useTableParams, serializeParams };
