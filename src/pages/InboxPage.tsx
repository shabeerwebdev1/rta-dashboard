/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect } from "react";
import { Card, Dropdown, Button } from "antd";
import { EyeOutlined, MoreOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

import DataTableWrapper from "../components/common/DataTableWrapper";
import { useGetInboxListQuery, useGetInboxSummaryMenuQuery } from "../services/rtkApiFactory";

import { usePage } from "../contexts/PageContext";

// Import the dynamic entity handler
import { DynamicEntityHandler, useEntityHandler } from "../components/common/DynamicEntityHandler";
import { formatDateTimeDisplay } from "../utils/dateFormatter";

const InboxPage = () => {
  const { t } = useTranslation();
  const { setPageTitle } = usePage();
  const [searchParams] = useSearchParams();
  const notificationCode = searchParams.get("code") || "";

  const { data: inboxMenus = [] } = useGetInboxSummaryMenuQuery();

  const sanitizeInboxTitle = (title?: string) => {
    if (!title) return "Inbox";
    return title.replace(/^Parking\s*-\s*/i, "").trim();
  };

  const notificationName = useMemo(() => {
    if (!notificationCode) return "Inbox";
    const match = inboxMenus.find((item: any) => item.NotificationCode === notificationCode);
    return sanitizeInboxTitle(match?.NotificationName || "Inbox");
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
    render: (_: any, row: any) => (
      <Dropdown
        trigger={["click"]}
        menu={{
          items: [
            {
              key: "view",
              icon: <EyeOutlined />,
              label: t("common.open"),
              onClick: () => openEntity(row.EntityCode, row),
            },
          ],
        }}
      >
        <Button type="text" icon={<MoreOutlined />} />
      </Dropdown>
    ),
  };

  // Dynamic Columns
  const columns = useMemo(() => {
    if (!data?.Columns) return [];

    const dynamicColumns = data.Columns.filter((col: any) => col.Visible)
      .sort((a: any, b: any) => a.Position - b.Position)
      .filter((col: any) => {
        const name = String(col.DisplayName || "").toLowerCase();
        const field = String(col.Field || "").toLowerCase();
        const blockedNames = ["actor name", "supervisor name", "activity name", "notification name", "payment type"];
        return !blockedNames.some((v) => name.includes(v) || field.includes(v.replace(/\s+/g, "")));
      })
      .map((col: any) => ({
        key: col.Field,
        dataIndex: col.Field,
        title:
          String(col.DisplayName || "").toLowerCase() === "last updated date time" ? "Last Updated" : col.DisplayName,
        sortable: col.AllowSorting === "true",
        render: col.Type === "datetime" ? (value: any) => (value ? formatDateTimeDisplay(value) : "-") : undefined,
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
