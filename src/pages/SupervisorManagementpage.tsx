import React, { useEffect, useMemo, useState } from "react";
import { Space, Select, Checkbox, notification, Button, Spin } from "antd";
import { SupervisorManagemnetConfig } from "../config/pageConfigs/SupervisorManagementConfig";
import { useTranslation } from "react-i18next";
import {
  useLazyGetShiftsQuery,
  useLazyGetZonesQuery,
  useGetActiveShiftsQuery,
  useUpdateShiftManagementMutation,
} from "../services/rtkApiFactory";
import DataTableWrapper from "../components/common/DataTableWrapper";

interface SupervisorData {
  key: string;
  SupervisorName: string;
  zone?: string[];
  shift?: string; // shiftGUID
  weekOffs?: number[]; // store numbers (3 = Wednesday, etc.)
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
  role: string;
  wO_Days: string; // "3,4,5"
  isActive: boolean;
  assignmentTypes: number[];
  zoneIds: number[];
  addOn: string;
}

const { Option } = Select;

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function SupervisorManagement() {
  const [data, setData] = useState<SupervisorData[]>([]);
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [triggerGetZones] = useLazyGetZonesQuery();
  const [triggerGetShifts] = useLazyGetShiftsQuery();
  const { t, i18n } = useTranslation();
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);
  const [shifts, setShifts] = useState<Shift[]>([]);

  const { 
    data: activeShiftsResponse, 
    isLoading: isLoadingActiveShifts, 
    refetch: refetchActiveShifts 
  } = useGetActiveShiftsQuery();

  const [updateShiftManagement, { isLoading: isUpdating }] = useUpdateShiftManagementMutation();

  useEffect(() => {
    fetchZonesData();
    fetchShiftsData();
  }, [i18n.language]);

  const availableShiftIds = useMemo(() => shifts.map(shift => shift.shiftTypeGUID), [shifts]);

  useEffect(() => {
    if (activeShiftsResponse) {
      const activeShiftsData = Array.isArray(activeShiftsResponse) 
        ? activeShiftsResponse 
        : activeShiftsResponse.data || [];

      const transformedData: SupervisorData[] = activeShiftsData
        .filter((item: ActiveShiftData) => item.roleGUID === "9C09B416-3AE4-406A-8627-71A23532A809")
        .map((item: ActiveShiftData, index: number) => {
          const isValidShift = item.shiftId && availableShiftIds.includes(item.shiftId);
          const zoneIds = item.zoneIds?.map(id => id.toString()) || [];

          return {
            key: item.uswMcode || `supervisor-${index}`,
            SupervisorName: item.employeeName,
            zone: zoneIds,
            shift: isValidShift ? item.shiftId : undefined,
            weekOffs: item.wO_Days ? item.wO_Days.split(",").map((d) => parseInt(d)) : [],
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
    } catch (error) {
      notification.error({ message: "Failed to fetch zones data." });
    } finally {
      setIsLoadingZones(false);
    }
  };

  const fetchShiftsData = async () => {
    setIsLoadingShifts(true);
    try {
      const result = await triggerGetShifts().unwrap();
      setShifts(result);
    } catch (error) {
      notification.error({ message: "Failed to fetch shifts data." });
    } finally {
      setIsLoadingShifts(false);
    }
  };

  const zoneOptions = useMemo(() => zones.map((zone) => ({
    value: zone.zoneId.toString(),
    label: `${zone.zoneCode}-${zone.zone}`,
    original: zone,
  })), [zones, i18n.language]);

  const shiftOptions = useMemo(() => shifts.map((shift) => ({
    value: shift.shiftTypeGUID,
    label: `${shift.shiftTypeCode} - ${i18n.language === "ar" ? shift.shiftTypeNameAr : shift.shiftTypeNameEn}`,
    original: shift,
  })), [shifts, i18n.language]);

  const handleZoneChange = (value: string[], record: SupervisorData) => {
    setData((prev) => prev.map((item) => (item.key === record.key ? { ...item, zone: value } : item)));
  };

  const handleShiftChange = (value: string, record: SupervisorData) => {
    setData((prev) => prev.map((item) => (item.key === record.key ? { ...item, shift: value } : item)));
  };

  const handleWeekOffChange = (checkedValues: number[], record: SupervisorData) => {
    setData((prev) => prev.map((item) => (item.key === record.key ? { ...item, weekOffs: checkedValues } : item)));
  };

  const handleUpdate = async (record: SupervisorData) => {
    try {
      const zoneIds = record.zone?.map((zoneId) => zoneId) || [];
      const assignmentTypes = [0];

      const updateData = {
        employeeId: record.employeeId,
        shiftId: record.shift || "", // ✅ send shiftGUID
        wO_Days: record.weekOffs?.join(",") || "", // ✅ send numbers like "3,4,5"
        role: "Supervisor",
        assignmentTypes,
        zoneIds,
      };
      

      await updateShiftManagement(updateData).unwrap();
      notification.success({
        message: t("Update successful"),
        description: t("Supervisor data has been updated successfully."),
      });
      refetchActiveShifts();
    } catch (error) {
      notification.error({
        message: t("Update failed"),
        description: t("Failed to update supervisor data. Please try again."),
      });
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
              placeholder="Select Zone(s)"
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
              placeholder="Select Shift"
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
              options={days.map((day, idx) => ({ label: day, value: idx + 1 }))}
              value={record.weekOffs}
              onChange={(vals) => handleWeekOffChange(vals as number[], record)}
            />
          ),
        };
      }

      if (col.key === "Actions") {
        return {
          ...col,
          render: (_: any, record: SupervisorData) => (
            <Space>
              <Button type="primary" onClick={() => handleUpdate(record)} loading={isUpdating}>
                Update
              </Button>
            </Space>
          ),
        };
      }

      return { ...col, dataIndex: col.key };
    });
  }, [zones, shifts, data, isLoadingZones, isLoadingShifts, isUpdating]);

  return (
    <Spin spinning={isLoadingActiveShifts || isLoadingZones || isLoadingShifts || isUpdating}>
      <DataTableWrapper
        pageConfig={{
          ...SupervisorManagemnetConfig,
          tableConfig: {
            ...SupervisorManagemnetConfig.tableConfig,
            columns: tableColumns,
          },
        }}
        data={data}
        total={data.length}
        isLoading={isLoadingActiveShifts}
        handleTableChange={() => {}}
        handlePaginationChange={() => {}}
        tableSize="middle"
        state={{ columnFilters: {} }}
        showPagination={false}
        rowKey={(record: SupervisorData) => record.key}
      />
    </Spin>
  );
}

export default SupervisorManagement;
