/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect } from "react";
import { Dropdown, Button } from "antd";
import { EyeOutlined, MoreOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

import DataTableWrapper from "../components/common/DataTableWrapper";
import { useGetInboxListQuery, useGetInboxSummaryMenuQuery } from "../services/rtkApiFactory";
import UAEPlate from "../components/UAEPlate";

import { usePage } from "../contexts/PageContext";
import { DynamicEntityHandler, useEntityHandler } from "../components/common/DynamicEntityHandler";
import { formatDateTimeDisplay } from "../utils/dateFormatter";

const InboxPage = () => {
  const { t, i18n } = useTranslation();
  const { setPageTitle } = usePage();
  const [searchParams] = useSearchParams();
  const notificationCode = searchParams.get("code") || "";
  const isRTL = i18n.language === "ar";

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

  // Client-side pagination state
  const [apiParams, setApiParams] = useState({
    PageNumber: 1,
    PageSize: 10,
  });

  // Fetch full dataset
  const { data, isLoading } = useGetInboxListQuery({
    notificationCode,
  });

  const fullData = data?.DataTable ?? [];

  // Slice data for current page
  const paginatedData = useMemo(() => {
    const start = (apiParams.PageNumber - 1) * apiParams.PageSize;
    const end = start + apiParams.PageSize;
    return fullData.slice(start, end);
  }, [fullData, apiParams]);

  const {
    open,
    record,
    entityCode,
    isLoading: entityLoading,
    fetchedData,
    openEntity,
    closeEntity,
  } = useEntityHandler();

  const renderTextCell = (value: any) => {
    const displayValue = value === null || value === undefined || value === "" ? "-" : String(value);

    return (
      <span
        style={{
          display: "inline-block",
          maxWidth: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {displayValue}
      </span>
    );
  };

  const renderPlateInfoCell = (value: any) => {
    const plateInfo = value === null || value === undefined ? "" : String(value).trim();
    if (!plateInfo) return "-";

    const [plateNumber, sourceEn, _categoryEn, plateColorCodeEn, sourceAr] = plateInfo.split("|");

    return (
      <UAEPlate
        code={plateColorCodeEn || ""}
        number={plateNumber || "-"}
        emirateEn={sourceEn || ""}
        emirateAr={sourceAr || ""}
      />
    );
  };

  // SL.No Column
  // const slNoColumn = {
  //   key: "slno",
  //   title: "SL.No",
  //   width: 100,
  //   render: (_: any, __: any, index: number) => (apiParams.PageNumber - 1) * apiParams.PageSize + index + 1,
  // };

  const slNoColumn = {
    key: "slno",
    title: isRTL ? "التسلسل" : "SL.No",
    width: 100,
    onHeaderCell: () => ({
      style: { paddingLeft: 16 },
    }),
    onCell: () => ({
      style: { paddingLeft: 16 },
    }),
    render: (_: any, __: any, index: number) => (apiParams.PageNumber - 1) * apiParams.PageSize + index + 1,
  };

  // Action column
  const actionColumn = {
    key: "actions",
    title: isRTL ? "الإجراء" : "Action",
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
      .map((col: any) => ({
        key: col.Field,
        dataIndex: col.Field,
        title: col.DisplayName,
        sortable: col.AllowSorting === "true",
        width: String(col.Name || "").toLowerCase() === "_$v$_$plateinfo" ? 180 : undefined,
        ellipsis: true,
        render:
          String(col.Name || "").toLowerCase() === "_$v$_$plateinfo" ||
          String(col.DisplayName || "").toLowerCase() === "plate no"
            ? (value: any) => renderPlateInfoCell(value)
            : col.Type === "datetime"
              ? (value: any) => renderTextCell(value ? formatDateTimeDisplay(value) : "-")
              : (value: any) => renderTextCell(value),
      }));

    return [slNoColumn, ...dynamicColumns, actionColumn];
  }, [data, apiParams]);

  // const columns = useMemo(() => {
  //   if (!data?.Columns) return [];

  //   const hiddenColumns = ["Notification Name", "Activity Name", "Actor Name"];

  //   const dynamicColumns = data.Columns.filter((col: any) => col.Visible)
  //     .sort((a: any, b: any) => a.Position - b.Position)
  //     .filter((col: any) => !hiddenColumns.includes(col.DisplayName)) // hide columns
  //     .map((col: any) => ({
  //       key: col.Field,
  //       dataIndex: col.Field,
  //       title: col.DisplayName === "Last Updated DateTime" ? "Last Updated" : col.DisplayName, // rename column
  //       sortable: col.AllowSorting === "true",
  //       width: String(col.Name || "").toLowerCase() === "_$v$_$plateinfo" ? 180 : undefined,
  //       ellipsis: true,
  //       render:
  //         String(col.Name || "").toLowerCase() === "_$v$_$plateinfo" ||
  //         String(col.DisplayName || "").toLowerCase() === "plate no"
  //           ? (value: any) => renderPlateInfoCell(value)
  //           : col.Type === "datetime"
  //             ? (value: any) => renderTextCell(value ? formatDateTimeDisplay(value) : "-")
  //             : (value: any) => renderTextCell(value),
  //     }));

  //   return [slNoColumn, ...dynamicColumns, actionColumn];
  // }, [data, apiParams]);

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
      <DataTableWrapper
        pageConfig={pageConfig}
        data={paginatedData}
        total={fullData.length}
        isLoading={isLoading}
        apiParams={apiParams}
        handlePaginationChange={handlePaginationChange}
        handleTableChange={() => {}}
        tableSize="small"
        state={{ columnFilters: {} }}
      />

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
