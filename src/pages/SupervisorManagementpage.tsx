// SupervisorManagement.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Space, Select, Checkbox, Button, Spin, Pagination } from "antd";
import { SupervisorManagemnetConfig } from "../config/pageConfigs/SupervisorManagementConfig";
import { useTranslation } from "react-i18next";
import {
  useLazyGetShiftsQuery,
  useLazyGetZonesQuery,
  useGetActiveShiftsQuery,
  useUpdateShiftManagementMutation,
} from "../services/rtkApiFactory";
import DataTableWrapper from "../components/common/DataTableWrapper";
import { useAppNotification } from "../utils/notificationManager";

interface SupervisorData {
  key: string;
  SupervisorName: string;
  zone?: string[];
  shift?: string;
  weekOffs?: number[];
  role: string;
  employeeId: string;
  uswMcode: string;
  isActive: boolean;
}

interface Zone {
  zoneId: number;
  zoneName: string;
  zoneNameAr?: string;
  zoneCode?: string;
  zone?: string;
}

interface Shift {
  shiftTypeGUID: string;
  shiftTypeCode: string;
  shiftTypeNameEn: string;
  shiftTypeNameAr: string;
}

interface ActiveShiftData {
  uswMcode: string;
  employeeId: string;
  employeeName: string;
  shiftId: string;
  roleGUID: string;
  roleCode: string;
  role: string;
  wO_Days: string;
  isActive: boolean;
  assignmentTypes: number[];
  zoneIds: number[];
  addOn: string;
}

const { Option } = Select;

function SupervisorManagement() {
  const [data, setData] = useState<SupervisorData[]>([]);
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [triggerGetZones] = useLazyGetZonesQuery();
  const [triggerGetShifts] = useLazyGetShiftsQuery();
  const { t, i18n } = useTranslation();
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [updatingRowKey, setUpdatingRowKey] = useState<string | null>(null);

  const notification = useAppNotification();

  //  pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const {
    data: activeShiftsResponse,
    isLoading: isLoadingActiveShifts,
    refetch: refetchActiveShifts,
  } = useGetActiveShiftsQuery();

  const [updateShiftManagement, { isLoading: isUpdating }] =
    useUpdateShiftManagementMutation();

  useEffect(() => {
    fetchZonesData();
    fetchShiftsData();
  }, [i18n.language]);

  const availableShiftIds = useMemo(
    () => shifts.map((shift) => shift.shiftTypeGUID),
    [shifts]
  );

  useEffect(() => {
    if (activeShiftsResponse) {
      const activeShiftsData = Array.isArray(activeShiftsResponse)
        ? activeShiftsResponse
        : activeShiftsResponse.data || [];

      const transformedData: SupervisorData[] = activeShiftsData
        .filter((item: ActiveShiftData) => item.roleCode === "PARSUP")
        .map((item: ActiveShiftData, index: number) => {
          const isValidShift =
            item.shiftId && availableShiftIds.includes(item.shiftId);
          const zoneIds = item.zoneIds?.map((id) => id.toString()) || [];

          return {
            key: item.employeeId || item.uswMcode || `supervisor-${index}`,
            SupervisorName: item.employeeName,
            zone: zoneIds,
            shift: isValidShift ? item.shiftId : undefined,
            weekOffs: item.wO_Days
              ? item.wO_Days.split(",").map((d) => parseInt(d))
              : [],
            role: item.role,
            employeeId: item.employeeId,
            uswMcode: item.uswMcode,
            isActive: item.isActive,
          };
        });

      setData(transformedData);
    }
  }, [activeShiftsResponse, availableShiftIds]);

  const fetchZonesData = async () => {
    setIsLoadingZones(true);
    try {
      const result = await triggerGetZones().unwrap();
      setZones(result);
    } catch {
      notification.error(t("Fetch failed"), t("Failed to fetch zones data."));
    } finally {
      setIsLoadingZones(false);
    }
  };

  const fetchShiftsData = async () => {
    setIsLoadingShifts(true);
    try {
      const result = await triggerGetShifts().unwrap();
      setShifts(result);
    } catch {
      notification.error(t("Fetch failed"), t("Failed to fetch shifts data."));
    } finally {
      setIsLoadingShifts(false);
    }
  };

  const zoneOptions = useMemo(
    () =>
      zones.map((zone) => ({
        value: zone.zoneId.toString(),
        label: `${zone.zoneCode}-${zone.zone}`,
        original: zone,
      })),
    [zones, i18n.language]
  );

  const shiftOptions = useMemo(
    () =>
      shifts.map((shift) => ({
        value: shift.shiftTypeGUID,
        label: `${shift.shiftTypeCode} - ${
          i18n.language === "ar"
            ? shift.shiftTypeNameAr
            : shift.shiftTypeNameEn
        }`,
        original: shift,
      })),
    [shifts, i18n.language]
  );

  const weekDayOptions = useMemo(
    () =>
      SupervisorManagemnetConfig.tableConfig.weekDays.map((d) => ({
        label: t(d.label),
        value: parseInt(d.value),
      })),
    [i18n.language, t]
  );

  const handleZoneChange = (value: string[], record: SupervisorData) => {
    setData((prev) =>
      prev.map((item) =>
        item.key === record.key ? { ...item, zone: value } : item
      )
    );
  };

  const handleShiftChange = (value: string, record: SupervisorData) => {
    setData((prev) =>
      prev.map((item) =>
        item.key === record.key ? { ...item, shift: value } : item
      )
    );
  };

  const handleWeekOffChange = (checkedValues: number[], record: SupervisorData) => {
    setData((prev) =>
      prev.map((item) =>
        item.key === record.key ? { ...item, weekOffs: checkedValues } : item
      )
    );
  };

  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size) setPageSize(size);
  };

  const handleUpdate = async (record: SupervisorData) => {
    try {
      setUpdatingRowKey(record.key);

      const zoneIds = record.zone?.map((zoneId) => zoneId) || [];
      const assignmentTypes = [0];

      const updateData = {
        employeeId: record.employeeId,
        shiftId: record.shift || "",
        wO_Days: record.weekOffs?.join(",") || "",
        role: "Supervisor",
        assignmentTypes,
        zoneIds,
      };

      await updateShiftManagement(updateData).unwrap();

      notification.success(
        t("Update successful"),
        t("Supervisor data has been updated successfully.")
      );

      refetchActiveShifts();
    } catch {
      notification.error(
        t("Update failed"),
        t("Failed to update supervisor data. Please try again.")
      );
    } finally {
      setUpdatingRowKey(null);
    }
  };

  const tableColumns = useMemo(() => {
    return SupervisorManagemnetConfig.tableConfig.columns.map((col: any) => {
      if (col.key === "zone") {
        return {
          ...col,
          render: (_: any, record: SupervisorData) => (
            <Select
              mode="multiple"
              value={record.zone || []}
              style={{ width: 250 }}
              onChange={(val) => handleZoneChange(val, record)}
              placeholder={t("placeholders.selectZones")}
              loading={isLoadingZones}
            >
              {zoneOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          ),
        };
      }

      if (col.key === "shift") {
        return {
          ...col,
          render: (_: any, record: SupervisorData) => (
            <Select
              value={record.shift}
              style={{ width: 200 }}
              onChange={(val) => handleShiftChange(val, record)}
              placeholder={t("placeholders.selectShift")}
              loading={isLoadingShifts}
              allowClear
            >
              {shiftOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          ),
        };
      }

      if (col.key === "weekOffs") {
        return {
          ...col,
          render: (_: any, record: SupervisorData) => (
            <Checkbox.Group
              options={weekDayOptions}
              value={record.weekOffs}
              onChange={(vals) =>
                handleWeekOffChange(vals as number[], record)
              }
              style={{ display: "flex", flexDirection: "column", gap: 4 }}
            />
          ),
        };
      }

      if (col.key === "Actions") {
        return {
          ...col,
          render: (_: any, record: SupervisorData) => (
            <Space>
              <Button
                type="primary"
                onClick={() => handleUpdate(record)}
                loading={updatingRowKey === record.key}
              >
                {t("common.update")}
              </Button>
            </Space>
          ),
        };
      }

      return { ...col, dataIndex: col.key };
    });
  }, [
    zones,
    shifts,
    data,
    isLoadingZones,
    isLoadingShifts,
    isUpdating,
    weekDayOptions,
    t,
  ]);

  // ✅ slice data for pagination
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
  }, [data, currentPage, pageSize]);

  return (
    <Spin
      spinning={
        isLoadingActiveShifts || isLoadingZones || isLoadingShifts || isUpdating
      }
    >
      <DataTableWrapper
        pageConfig={{
          ...SupervisorManagemnetConfig,
          tableConfig: {
            ...SupervisorManagemnetConfig.tableConfig,
            columns: tableColumns,
          },
        }}
        data={paginatedData} //  use sliced data
        total={data.length}
        isLoading={isLoadingActiveShifts}
        handleTableChange={() => {}}
        handlePaginationChange={() => {}}
        tableSize="middle"
        state={{ columnFilters: {} }}
        showPagination={false} //  keep false
        rowKey={(record: SupervisorData) => record.key}
      />

      {/*  Fresh Pagination */}
      <div style={{ marginTop: 16, textAlign: "right" }}>
             <Pagination
               current={currentPage}
               pageSize={pageSize}
               total={data.length}
               onChange={handlePageChange}
              
               showSizeChanger={{showSearch: false }}
               pageSizeOptions={["5", "10", "20", "50"]}
               showQuickJumper={false}
               showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
             />
           </div>
    </Spin>
  );
}

export default SupervisorManagement;
