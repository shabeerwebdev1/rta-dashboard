import React from "react";
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
import { getFixedT } from "i18next";

const InboxPage = () => {
  const { t, i18n } = useTranslation();
  const { setPageTitle } = usePage();
  const [searchParams] = useSearchParams();
  const notificationCode = searchParams.get("code") || "";
  const isRTL = i18n.language === "ar";

  const { data: inboxMenus = [] } = useGetInboxSummaryMenuQuery();

  const sanitizeInboxTitle = (title?: string) => {
    if (!title) return "Inbox";
    return title.replace(/[\u200E\u200F]/g, "").trim();
  };

  const notificationName = useMemo(() => {
    if (!notificationCode) return "Inbox";

    const isArabic = i18n.language === "ar";
    const matches = inboxMenus.filter((item: any) => item.NotificationCode === notificationCode);
    const arabicItem = matches.find((m: any) => /[\u0600-\u06FF]/.test(m.NotificationName));
    const englishItem = matches.find((m: any) => !/[\u0600-\u06FF]/.test(m.NotificationName));
    const selected = isArabic ? arabicItem || englishItem : englishItem || arabicItem;

    return sanitizeInboxTitle(selected?.NotificationName || "Inbox");
  }, [notificationCode, inboxMenus, i18n.language]);

  useEffect(() => {
    setPageTitle(notificationName);
  }, [notificationName, setPageTitle]);

  // Client-side pagination state
  const [apiParams, setApiParams] = useState({
    PageNumber: 1,
    PageSize: 10,
  });

  // Fetch full dataset
  const { data, isLoading } = useGetInboxListQuery({ notificationCode });

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
          display: "block",
          whiteSpace: "normal",
          wordBreak: "break-word",
          overflowWrap: "anywhere",
          lineHeight: 1.35,
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

  // ── SL.No: fixed narrow width, zero side padding ──────────────────────────
  const slNoColumn = {
    key: "slno",
    title: isRTL ? "التسلسل" : "SL.No",
    width: 58,
    align: "center" as const,
    onHeaderCell: () => ({
      style: { textAlign: "center", padding: "0 4px", whiteSpace: "nowrap" },
    }),
    onCell: () => ({
      style: { textAlign: "center", padding: "0 4px" },
    }),
    render: (_: any, __: any, index: number) => (apiParams.PageNumber - 1) * apiParams.PageSize + index + 1,
  };

  // Action column
  const actionColumn = {
    key: "actions",
    title: isRTL ? "الإجراءات" : "Actions",
    width: 80,
    fixed: "right" as const,
    align: "center" as const,
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

        width: String(col.Name || "").toLowerCase() === "_$v$_$plateinfo" ? 180 : 160, // 👈 DEFAULT WIDTH ADDED

        onCell: () => ({
          style: {
            maxWidth: String(col.Name || "").toLowerCase() === "_$v$_$plateinfo" ? 180 : 160, // 👈 LOCK WIDTH

            whiteSpace: "normal",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
          },
        }),

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

  const pageConfig = {
    tableConfig: { columns },
  };

  const handlePaginationChange = (page: number, pageSize: number) => {
    setApiParams({ PageNumber: page, PageSize: pageSize });
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
        tableLayout="fixed"
        scrollX="max-content"
        // scrollX={1200}
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
