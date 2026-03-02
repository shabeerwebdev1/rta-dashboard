/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect } from "react";
import { Card } from "antd";
import dayjs from "dayjs";
import { useSearchParams } from "react-router-dom";

import DataTableWrapper from "../components/common/DataTableWrapper";
import { useGetInboxListQuery, useGetInboxSummaryMenuQuery } from "../services/rtkApiFactory";

import { usePage } from "../contexts/PageContext";

// Import the dynamic entity handler
import { DynamicEntityHandler, EntityActionButton, useEntityHandler } from "../components/common/DynamicEntityHandler";

const InboxPage = () => {
  const { setPageTitle } = usePage();
  const [searchParams] = useSearchParams();
  const notificationCode = searchParams.get("code") || "";

  const { data: inboxMenus = [] } = useGetInboxSummaryMenuQuery();

  const notificationName = useMemo(() => {
    if (!notificationCode) return "Inbox";
    const match = inboxMenus.find((item: any) => item.NotificationCode === notificationCode);
    return match?.NotificationName || "Inbox";
  }, [notificationCode, inboxMenus]);

  useEffect(() => {
    setPageTitle(notificationName);
  }, [notificationName, setPageTitle]);

  // Pagination
  const [apiParams, setApiParams] = useState({
    PageNumber: 1,
    PageSize: 10,
  });

  const { data, isLoading } = useGetInboxListQuery({
    PageNumber: apiParams.PageNumber,
    PageSize: apiParams.PageSize,
    notificationCode,
  });

  // Use the unified entity handler
  const {
    open,
    record,
    entityCode,
    isLoading: entityLoading,
    fetchedData,
    openEntity,
    closeEntity,
  } = useEntityHandler();

  // SLNO Column
  const slNoColumn = {
    key: "slno",
    title: "SL.No",
    width: 80,
    render: (_: any, __: any, index: number) => (apiParams.PageNumber - 1) * apiParams.PageSize + index + 1,
  };

  // Action Column with unified button
  const actionColumn = {
    key: "actions",
    title: "Action",
    width: 100,
    render: (_: any, record: any) => (
      <EntityActionButton record={record} entityCode={record.EntityCode} onClick={openEntity} />
    ),
  };

  // Dynamic Columns
  const columns = useMemo(() => {
    if (!data?.Columns) return [];

    const dynamicColumns = data.Columns.filter((col: any) => col.Visible)
      .sort((a: any, b: any) => a.Position - b.Position)
      .map((col: any) => ({
        key: col.Field,
        dataIndex: col.Field,
        title: col.DisplayName,
        sortable: col.AllowSorting === "true",
        render:
          col.Type === "datetime"
            ? (value: any) => (value ? dayjs(value).format("DD MMM YYYY HH:mm:ss") : "-")
            : undefined,
      }));

    return [slNoColumn, ...dynamicColumns, actionColumn];
  }, [data, apiParams]);

  const pageConfig = {
    tableConfig: { columns },
  };

  const handlePaginationChange = (page: number, pageSize: number) => {
    setApiParams({
      PageNumber: page,
      PageSize: pageSize,
    });
  };

  return (
    <>
      <Card variant="borderless" title="">
        <DataTableWrapper
          pageConfig={pageConfig}
          data={data?.DataTable ?? []}
          total={data?.TotalRecords ?? 0}
          isLoading={isLoading}
          apiParams={apiParams}
          handleTableChange={() => {}}
          handlePaginationChange={handlePaginationChange}
          tableSize="middle"
          state={{ columnFilters: {} }}
        />
      </Card>

      {/* Single Dynamic Entity Handler - replaces all separate drawers/modals */}
      <DynamicEntityHandler
        entityCode={entityCode}
        record={record}
        open={open}
        onClose={closeEntity}
        isLoading={entityLoading}
        fetchedData={fetchedData}
      />
    </>
  );
};

export default InboxPage;
