/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect } from "react";
import { Card } from "antd";
import { FolderOpenFilled } from "@ant-design/icons";
import dayjs from "dayjs";

import DataTableWrapper from "../components/common/DataTableWrapper";
import {
  useGetInboxListQuery,
  useGetInboxSummaryMenuQuery,
  useLazyGetParkonicByIdQuery,
  useLazyGetParkonicsLocationByIdQuery,
} from "../services/rtkApiFactory";

import { usePage } from "../contexts/PageContext";
import { useSearchParams } from "react-router-dom";

import ParkonicViewDrawer from "../components/parkonic/ParkonicViewDrawer";
import ParkonicLocationViewDrawer from "../components/ParkonicLocation/ParkonicLocationViewDrawer";
import DisputeViewModal from "../components/dispute/DisputeViewModal";

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

  // ========================
  // PARKONIC FINES STATE
  // ========================
  const [parkonicOpen, setParkonicOpen] = useState(false);
  const [parkonicRecord, setParkonicRecord] = useState<any>(null);

  // ========================
  // LOCATION STATE  ✅ ADD
  // ========================
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationRecord, setLocationRecord] = useState<any>(null);

  // ========================
  // DISPUTE STATE
  // ========================
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeRecord, setDisputeRecord] = useState<any>(null);

  const [getParkonicById, { isFetching: parkonicLoading }] = useLazyGetParkonicByIdQuery();
  const [getLocationById, { isFetching: locationLoading }] = useLazyGetParkonicsLocationByIdQuery(); // ✅ ADD

  // SLNO
  const slNoColumn = {
    key: "slno",
    title: "SL.No",
    width: 80,
    render: (_: any, __: any, index: number) => (apiParams.PageNumber - 1) * apiParams.PageSize + index + 1,
  };

  // ACTION
  const actionColumn = {
    key: "actions",
    title: "Action",
    width: 100,
    render: (_: any, record: any) => (
      <FolderOpenFilled
        style={{ cursor: "pointer", fontSize: 16 }}
        onClick={async () => {
          try {
            // PARKONIC FINES
            if (record.EntityCode === "parking-parkonic-fines") {
              const res = await getParkonicById(record.EntityGUID).unwrap();

              const mergedRecord = {
                ...(res?.data || res),
                $SKWorkItemData: record.$SKWorkItemData,
                EntityGUID: record.EntityGUID,
                EntityCode: record.EntityCode,
                ActivityCode: record.ActivityCode || record.nvarchar3,
                iid: record.id,
              };

              setParkonicRecord(mergedRecord);
              setParkonicOpen(true);
            }

            // LOCATION  ✅ ADD THIS BLOCK
            if (record.EntityCode === "parking-parkonic-location") {
              const res = await getLocationById(record.EntityGUID).unwrap();

              const mergedRecord = {
                ...(res?.data || res),
                $SKWorkItemData: record.$SKWorkItemData,
                EntityGUID: record.EntityGUID,
                EntityCode: record.EntityCode,

                // guarantee activityCode always exists
                ActivityCode: record.ActivityCode || record.nvarchar3 || res?.data?.ActivityCode || "",
              };

              setLocationRecord(mergedRecord);
              setLocationOpen(true);
            }

            // DISPUTE
            if (record.EntityCode === "parking-parkonic-fine-dispute") {
              setDisputeRecord(record);
              setDisputeOpen(true);
            }
          } catch (err) {
            console.error("Open record failed", err);
          }
        }}
      />
    ),
  };

  // COLUMNS
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

      {/* FINES DRAWER */}
      <ParkonicViewDrawer
        open={parkonicOpen}
        onClose={() => {
          setParkonicOpen(false);
          setParkonicRecord(null);
        }}
        record={parkonicRecord}
        isLoading={parkonicLoading}
      />

      {/* LOCATION DRAWER  ✅ ADD */}
      <ParkonicLocationViewDrawer
        open={locationOpen}
        onClose={() => {
          setLocationOpen(false);
          setLocationRecord(null);
        }}
        record={locationRecord}
        config={{ name: { singular: "entity.location" } }}
        isLoading={locationLoading}
      />

      {/* DISPUTE MODAL */}
      <DisputeViewModal
        open={disputeOpen}
        onClose={() => {
          setDisputeOpen(false);
          setDisputeRecord(null);
        }}
        record={disputeRecord}
      />
    </>
  );
};

export default InboxPage;
