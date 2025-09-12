// UserZoneLinking.tsx
import React, { useEffect, useState, useMemo } from "react";
import { Space, Select, Checkbox, Spin, Button, Pagination } from "antd";
import { UserZoneLinkingConfig } from "../config/pageConfigs/userZoneLinkingConfig";
import { useTranslation } from "react-i18next";
import {
  useLazyGetLookupsQuery,
  useLazyGetZonesQuery,
  useLazyGetShiftsQuery,
  useGetActiveShiftsQuery,
  useUpdateShiftManagementMutation,
} from "../services/rtkApiFactory";
import DataTableWrapper from "../components/common/DataTableWrapper";
import { useAppNotification } from "../utils/notificationManager";

const { Option } = Select;

interface InspectorData {
  key: string;
  InspectorName: string;
  zone?: string[];
  shift?: string;
  weekOffs?: string[];
  assignmentType?: number[];
  role: string;
  roleGUID: string;
  employeeId: string;
  uswMcode: string;
  isActive: boolean;
}

interface LookupItem {
  categoryId: number;
  categoryName: string;
  value: number;
  labelEn: string;
  labelAr: string;
}

interface Zone {
  zoneId: number;
  zoneCode: string;
  zone: string;
  zoneNameAr?: string;
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

function UserZoneLinking() {
  const { t, i18n } = useTranslation();
  const notification = useAppNotification();

  const [data, setData] = useState<InspectorData[]>([]);
  const [triggerGetLookups] = useLazyGetLookupsQuery();
  const [triggerGetZones] = useLazyGetZonesQuery();
  const [triggerGetShifts] = useLazyGetShiftsQuery();

  const {
    data: activeShiftsResponse,
    isLoading: isLoadingActiveShifts,
    refetch: refetchActiveShifts,
  } = useGetActiveShiftsQuery();

  const [updateShiftManagement, { isLoading: isUpdating }] =
    useUpdateShiftManagementMutation();

  const [isLoadingLookups, setIsLoadingLookups] = useState(false);
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);
  const [lookupOptions, setLookupOptions] = useState<LookupItem[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);

  // pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchLookupData();
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

      const transformedData: InspectorData[] = activeShiftsData
        .filter((item: ActiveShiftData) => item.roleCode === "PARINSP")
        .map((item: ActiveShiftData, index: number) => {
          const isValidShift =
            item.shiftId && availableShiftIds.includes(item.shiftId);
          const zoneIds = (item.zoneIds || []).map((id) => id.toString());

          const weekOffDays = item.wO_Days
            ? item.wO_Days.split(",").filter(Boolean)
            : [];
          const weekOffNumbers = weekOffDays.map((day) => {
            const dayMap: Record<string, string> = {
              Monday: "1",
              Tuesday: "2",
              Wednesday: "3",
              Thursday: "4",
              Friday: "5",
              Saturday: "6",
              Sunday: "7",
              "1": "1",
              "2": "2",
              "3": "3",
              "4": "4",
              "5": "5",
              "6": "6",
              "7": "7",
            };
            return dayMap[day.trim()] || day;
          });

          const assignmentTypes = item.assignmentTypes || [];

          return {
            key: item.uswMcode || `inspector-${index}`,
            InspectorName: item.employeeName,
            zone: zoneIds,
            shift: isValidShift ? item.shiftId : undefined,
            weekOffs: weekOffNumbers,
            assignmentType: assignmentTypes,
            role: item.role,
            employeeId: item.employeeId,
            uswMcode: item.uswMcode,
            isActive: item.isActive,
          };
        });

      setData(transformedData);
    }
  }, [activeShiftsResponse, availableShiftIds]);

  // ===== Pagination Logic =====
  const paginatedData = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return data.slice(startIdx, startIdx + pageSize);
  }, [data, currentPage, pageSize]);

  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size) setPageSize(size);
  };

  // === Fetch functions ===
  const fetchLookupData = async () => {
    setIsLoadingLookups(true);
    try {
      const result = await triggerGetLookups([1400]).unwrap();
      setLookupOptions(result);
    } catch {
      notification.error(t("Fetch failed"), t("Failed to fetch lookup data."));
    } finally {
      setIsLoadingLookups(false);
    }
  };

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

  // === Options ===
  const assignmentTypeOptions = useMemo(
    () =>
      lookupOptions
        .filter((item) => item.categoryId === 1400)
        .map((item) => ({
          value: item.value,
          label: i18n.language === "ar" ? item.labelAr : item.labelEn,
        })),
    [lookupOptions, i18n.language]
  );

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
      UserZoneLinkingConfig.tableConfig.weekDays.map((day) => ({
        label: t(day.label),
        value: day.value,
      })),
    [i18n.language, t]
  );

  // === Handlers ===
  const handleZoneChange = (value: string[], record: InspectorData) => {
    setData((prev) =>
      prev.map((item) => (item.key === record.key ? { ...item, zone: value } : item))
    );
  };

  const handleShiftChange = (value: string, record: InspectorData) => {
    setData((prev) =>
      prev.map((item) => (item.key === record.key ? { ...item, shift: value } : item))
    );
  };

  const handleWeekOffChange = (checkedValues: string[], record: InspectorData) => {
    setData((prev) =>
      prev.map((item) =>
        item.key === record.key ? { ...item, weekOffs: checkedValues } : item
      )
    );
  };

  const handleAssignmentTypeChange = (value: number[], record: InspectorData) => {
    setData((prev) =>
      prev.map((item) =>
        item.key === record.key ? { ...item, assignmentType: value } : item
      )
    );
  };

  // === Update Handler ===
  const handleUpdate = async (record: InspectorData) => {
    try {
      const zoneIds = record.zone || [];
      const assignmentTypes = record.assignmentType || [];
      const weekOffsString = (record.weekOffs || []).join(",");

      const updateData = {
        employeeId: record.employeeId,
        shiftId: record.shift || "",
        wO_Days: weekOffsString,
        role: "Inspector",
        assignmentTypes,
        zoneIds,
      };

      await updateShiftManagement(updateData).unwrap();

      notification.success(
        t("Update successful"),
        t("Inspector data has been updated successfully.")
      );

      refetchActiveShifts();
    } catch {
      notification.error(
        t("Update failed"),
        t("Failed to update inspector data. Please try again.")
      );
    }
  };

  // === Columns with custom render ===
  const tableColumns = useMemo(() => {
    return UserZoneLinkingConfig.tableConfig.columns.map((col: any) => {
      if (col.key === "Zone") {
        return {
          ...col,
          render: (_: any, record: InspectorData) => (
            <Select
              mode="multiple"
              value={record.zone || []}
              style={{ width: 210 }}
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

      if (col.key === "Shift") {
        return {
          ...col,
          render: (_: any, record: InspectorData) => (
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

      if (col.key === "AssignmentType") {
        return {
          ...col,
          render: (_: any, record: InspectorData) => (
            <Select
              mode="multiple"
              value={record.assignmentType || []}
              style={{ width: 200 }}
              onChange={(val) => handleAssignmentTypeChange(val, record)}
              placeholder={t("placeholders.selectAssignmentTypes")}
              loading={isLoadingLookups}
            >
              {assignmentTypeOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          ),
        };
      }

      if (col.key === "WeekOffs") {
        return {
          ...col,
          render: (_: any, record: InspectorData) => (
            <Checkbox.Group
              options={weekDayOptions}
              value={record.weekOffs || []}
              onChange={(vals) =>
                handleWeekOffChange(vals as string[], record)
              }
              style={{ display: "flex", flexDirection: "column", gap: 4 }}
            />
          ),
        };
      }

      if (col.key === "Actions") {
        return {
          ...col,
          fixed: "right",
          width: 120,
          render: (_: any, record: InspectorData) => (
            <Space>
              <Button
                type="primary"
                onClick={() => handleUpdate(record)}
                loading={isUpdating}
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
    lookupOptions,
    data,
    isLoadingZones,
    isLoadingShifts,
    isLoadingLookups,
    isUpdating,
    i18n.language,
    weekDayOptions,
    t,
  ]);

  return (
    <Spin
      spinning={
        isLoadingActiveShifts ||
        isLoadingLookups ||
        isLoadingZones ||
        isLoadingShifts ||
        isUpdating
      }
    >
      <DataTableWrapper
        pageConfig={{
          ...UserZoneLinkingConfig,
          tableConfig: {
            ...UserZoneLinkingConfig.tableConfig,
            columns: tableColumns,
          },
        }}
        data={paginatedData}
        total={data.length}
        isLoading={isLoadingActiveShifts}
        handleTableChange={() => {}}
        handlePaginationChange={() => {}}
        tableSize="middle"
        state={{ columnFilters: {} }}
        showPagination={false}
        rowKey={(record: InspectorData) => record.key}
        scroll={{ x: "max-content" }}
      />

      {/* Custom Pagination */}
      <div style={{ marginTop: 16, textAlign: "right" }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={data.length}
          onChange={handlePageChange}
          showSizeChanger
          pageSizeOptions={["5", "10", "20", "50"]}
        />
      </div>
    </Spin>
  );
}

export default UserZoneLinking;
