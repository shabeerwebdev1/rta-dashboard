// UserZoneLinking.tsx
import React, { useEffect, useState, useMemo } from "react";
import { Space, Select, Checkbox, notification, Spin, Alert, Button } from "antd";
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

const { Option } = Select;

interface InspectorData {
  key: string;
  InspectorName: string;
  zone?: string[];
  shift?: string;
  weekOffs?: string[];
  assignmentType?: number[];
  role: string;
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
  role: string;
  wO_Days: string;
  isActive: boolean;
  assignmentTypes: number[];
  zoneIds: number[];
  addOn: string;
}

function UserZoneLinking() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<InspectorData[]>([]);
  const [triggerGetLookups] = useLazyGetLookupsQuery();
  const [triggerGetZones] = useLazyGetZonesQuery();
  const [triggerGetShifts] = useLazyGetShiftsQuery();

  // Use the getActiveShifts query
  const {
    data: activeShiftsResponse,
    isLoading: isLoadingActiveShifts,
    error: activeShiftsError,
    refetch: refetchActiveShifts,
  } = useGetActiveShiftsQuery();

  // Add the update mutation
  const [updateShiftManagement, { isLoading: isUpdating }] = useUpdateShiftManagementMutation();

  const [isLoadingLookups, setIsLoadingLookups] = useState(false);
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);
  const [lookupOptions, setLookupOptions] = useState<LookupItem[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);

  useEffect(() => {
    fetchLookupData();
    fetchZonesData();
    fetchShiftsData();
  }, [i18n.language]);

  // Get all available shift IDs from the shifts dropdown
  const availableShiftIds = useMemo(() => {
    return shifts.map((shift) => shift.shiftTypeGUID);
  }, [shifts]);

  // Transform API data to table data when activeShiftsResponse changes
  useEffect(() => {
    console.log("Active shifts response:", activeShiftsResponse);
    console.log("Available shift IDs:", availableShiftIds);

    if (activeShiftsResponse) {
      // Handle both array response and object response with data property
      const activeShiftsData = Array.isArray(activeShiftsResponse)
        ? activeShiftsResponse
        : activeShiftsResponse.data || [];

      const transformedData: InspectorData[] = activeShiftsData
        .filter((item: ActiveShiftData) => item.role === "Inspector") // Only show Inspectors
        .map((item: ActiveShiftData, index: number) => {
          // Check if the shiftId exists in available shifts
          const isValidShift = item.shiftId && availableShiftIds.includes(item.shiftId);

          // Convert zoneIds from number[] to string[]
          const zoneIds = item.zoneIds?.map((id) => id.toString()) || [];

          console.log("Inspector:", item.employeeName, "zoneIds:", item.zoneIds, "converted:", zoneIds);
          console.log("Assignment types:", item.assignmentTypes);

          return {
            key: item.uswMcode || `inspector-${index}`,
            InspectorName: item.employeeName,
            zone: zoneIds,
            shift: isValidShift ? item.shiftId : undefined,
            weekOffs: item.wO_Days ? item.wO_Days.split(",") : [],
            assignmentType: item.assignmentTypes || [],
            role: item.role,
            employeeId: item.employeeId,
            uswMcode: item.uswMcode,
            isActive: item.isActive,
          };
        });

      console.log("Transformed data:", transformedData);
      setData(transformedData);
    }
  }, [activeShiftsResponse, availableShiftIds]);

  const fetchLookupData = async () => {
    setIsLoadingLookups(true);
    try {
      const result = await triggerGetLookups([1400]).unwrap();
      setLookupOptions(result);
    } catch (error) {
      notification.error({ message: "Failed to fetch lookup data." });
    } finally {
      setIsLoadingLookups(false);
    }
  };

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

  const assignmentTypeOptions = useMemo(() => {
    return lookupOptions
      .filter((item) => item.categoryId === 1400)
      .map((item) => ({
        value: item.value,
        label: i18n.language === "ar" ? item.labelAr : item.labelEn,
      }));
  }, [lookupOptions, i18n.language]);

  const zoneOptions = useMemo(() => {
    return zones.map((zone) => ({
      value: zone.zoneId.toString(),
      label: `${zone.zoneCode}-${zone.zone}`,
      original: zone,
    }));
  }, [zones, i18n.language]);

  const shiftOptions = useMemo(() => {
    return shifts.map((shift) => ({
      value: shift.shiftTypeGUID,
      label: `${shift.shiftTypeCode} - ${i18n.language === "ar" ? shift.shiftTypeNameAr : shift.shiftTypeNameEn}`,
      original: shift,
    }));
  }, [shifts, i18n.language]);

  // === Handlers ===
  const handleZoneChange = (value: string[], record: InspectorData) => {
    console.log("Zone changed for", record.InspectorName, ":", value);
    setData((prev) => prev.map((item) => (item.key === record.key ? { ...item, zone: value } : item)));
  };

  const handleShiftChange = (value: string, record: InspectorData) => {
    setData((prev) => prev.map((item) => (item.key === record.key ? { ...item, shift: value } : item)));
  };

  const handleWeekOffChange = (checkedValues: string[], record: InspectorData) => {
    setData((prev) => prev.map((item) => (item.key === record.key ? { ...item, weekOffs: checkedValues } : item)));
  };

  const handleAssignmentTypeChange = (value: number[], record: InspectorData) => {
    console.log("Assignment type changed for", record.InspectorName, ":", value);
    setData((prev) => prev.map((item) => (item.key === record.key ? { ...item, assignmentType: value } : item)));
  };

  // === Update Handler ===
  const handleUpdate = async (record: InspectorData) => {
    try {
      // Convert zoneIds from string[] to the required format
      // If zoneIds are UUID strings, send them as is
      const zoneIds = record.zone?.map((zoneId) => zoneId) || [];

      // assignmentTypes should be numbers (ddiCode values)
      const assignmentTypes = record.assignmentType?.map((type) => Number(type)) || [];

      // Prepare the data in the required format
      const updateData = {
        employeeId: record.employeeId,
        wO_Days: record.weekOffs?.join(",") || "", // Join with commas: "Monday,Tuesday,Wednesday"
        role: record.role,
        assignmentTypes: assignmentTypes, // Array of numbers
        zoneIds: zoneIds, // Array of strings (UUIDs)
      };

      console.log("Sending update data:", updateData);
      console.log("Zone IDs:", zoneIds);
      console.log("Assignment Types:", assignmentTypes);

      const result = await updateShiftManagement(updateData).unwrap();

      notification.success({
        message: t("Update successful"),
        description: t("Inspector data has been updated successfully."),
      });

      // Refresh the data
      refetchActiveShifts();
    } catch (error) {
      console.error("Update error:", error);
      notification.error({
        message: t("Update failed"),
        description: t("Failed to update inspector data. Please try again."),
      });
    }
  };

  // Add this useEffect to debug the data state
  useEffect(() => {
    console.log("Current data state:", data);
    if (data.length > 0) {
      console.log("First inspector data:", data[0]);
      console.log("First inspector zones:", data[0].zone);
      console.log("First inspector assignment types:", data[0].assignmentType);
    }
  }, [data]);

  // Custom tag renderer for chip-style tags
  const tagRender = (props: any) => {
    const { label, value, closable, onClose } = props;
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "2px 8px",
          margin: "2px",
          backgroundColor: "#e6f7ff",
          border: "1px solid #91d5ff",
          borderRadius: "12px",
          fontSize: "12px",
        }}
      >
        {label}
        {closable && (
          <span style={{ marginLeft: 6, cursor: "pointer", color: "#000000" }} onClick={onClose}>
            ✕
          </span>
        )}
      </span>
    );
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
            placeholder="Select Zone(s)"
            loading={isLoadingZones}
            tagRender={tagRender}
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

    if (col.key === "AssignmentType") {
      return {
        ...col,
        render: (_: any, record: InspectorData) => (
          <Select
            mode="multiple"
            value={record.assignmentType || []}
            style={{ width: 200 }}
            onChange={(val) => handleAssignmentTypeChange(val, record)}
            placeholder="Select Assignment Type(s)"
            loading={isLoadingLookups}
            tagRender={tagRender}
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
        options={UserZoneLinkingConfig.tableConfig.weekDays.map((day) => ({
          label: day,
          value: day,
        }))}
        value={record.weekOffs}
        onChange={(vals) => handleWeekOffChange(vals as string[], record)}
        style={{ display: "flex", flexDirection: "column", gap: 4 }} // ✅ Vertical checkboxes
      />
    ),
  };
}


    if (col.key === "Actions") {
      return {
        ...col,
        fixed: "right", // ✅ Keep Update button fixed on right
        width: 120, // ✅ Set width so it doesn't shrink
        render: (_: any, record: InspectorData) => (
          <Space>
            <Button type="primary" onClick={() => handleUpdate(record)} loading={isUpdating}>
              Update
            </Button>
          </Space>
        ),
      };
    }

    return {
      ...col,
      dataIndex: col.key,
    };
  });
}, [zones, shifts, lookupOptions, data, isLoadingZones, isLoadingShifts, isLoadingLookups, isUpdating]);
  // Show error if active shifts API fails
  if (activeShiftsError) {
    return (
      <div style={{ padding: 20 }}>
        <Alert
          message="Failed to load inspector data"
          description="Please check your API endpoint and try again."
          type="error"
        />
        <Button onClick={refetchActiveShifts} style={{ marginTop: 10 }}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <Spin spinning={isLoadingActiveShifts || isLoadingLookups || isLoadingZones || isLoadingShifts || isUpdating}>
      <DataTableWrapper
  pageConfig={{
    ...UserZoneLinkingConfig,
    tableConfig: {
      ...UserZoneLinkingConfig.tableConfig,
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
  rowKey={(record: InspectorData) => record.key}
  scroll={{ x: "max-content" }} // ✅ Enables horizontal scroll
/>
    </Spin>
  );
}

export default UserZoneLinking;
