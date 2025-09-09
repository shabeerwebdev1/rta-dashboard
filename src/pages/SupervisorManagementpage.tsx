import React, { useEffect, useMemo, useState } from "react";
import { Space, Select, Checkbox, notification, Button, Spin, Alert } from "antd";
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
  shift?: string;
  weekOffs?: string[];
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
  role: string;
  wO_Days: string;
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

  // Use the getActiveShifts query
  const { 
    data: activeShiftsResponse, 
    isLoading: isLoadingActiveShifts, 
    error: activeShiftsError,
    refetch: refetchActiveShifts 
  } = useGetActiveShiftsQuery();
  
  // Add the update mutation
  const [updateShiftManagement, { isLoading: isUpdating }] = useUpdateShiftManagementMutation();

  useEffect(() => {
    fetchZonesData();
    fetchShiftsData();
  }, [i18n.language]);

  // Get all available shift IDs from the shifts dropdown
  const availableShiftIds = useMemo(() => {
    return shifts.map(shift => shift.shiftTypeGUID);
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
      
      const transformedData: SupervisorData[] = activeShiftsData
        .filter((item: ActiveShiftData) => item.role === "Manager") // Only show Supervisors
        .map((item: ActiveShiftData, index: number) => {
          // Check if the shiftId exists in available shifts
          const isValidShift = item.shiftId && availableShiftIds.includes(item.shiftId);
          
          // Convert zoneIds from number[] to string[]
          const zoneIds = item.zoneIds?.map(id => id.toString()) || [];
          
          console.log("Supervisor:", item.employeeName, "zoneIds:", item.zoneIds, "converted:", zoneIds);
          
          return {
            key: item.uswMcode || `supervisor-${index}`,
            SupervisorName: item.employeeName,
            zone: zoneIds,
            shift: isValidShift ? item.shiftId : undefined, // Only set shift if it exists in dropdown
            weekOffs: item.wO_Days ? item.wO_Days.split(',') : [],
            role: item.role,
            employeeId: item.employeeId,
            uswMcode: item.uswMcode,
            isActive: item.isActive
          };
        });
      
      console.log("Transformed supervisor data:", transformedData);
      setData(transformedData);
    }
  }, [activeShiftsResponse, availableShiftIds]);

  const fetchZonesData = async () => {
    setIsLoadingZones(true);
    try {
      const result = await triggerGetZones().unwrap();
      console.log("Fetched zones data:", result);
      setZones(result);
    } catch (error) {
      console.log("Error fetching zones:", error);
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
      console.log("Error fetching shifts:", error);
      notification.error({ message: "Failed to fetch shifts data." });
    } finally {
      setIsLoadingShifts(false);
    }
  };

  const zoneOptions = useMemo(() => {
    return zones.map((zone) => ({
      value: zone.zoneId.toString(),
      label: `${zone.zoneCode}-${zone.zone}`,
      original: zone
    }));
  }, [zones, i18n.language]);

  const shiftOptions = useMemo(() => {
    return shifts.map((shift) => ({
      value: shift.shiftTypeGUID,
      label: `${shift.shiftTypeCode} - ${
        i18n.language === "ar" ? shift.shiftTypeNameAr : shift.shiftTypeNameEn
      }`,
      original: shift,
    }));
  }, [shifts, i18n.language]);

  const handleZoneChange = (value: string[], record: SupervisorData) => {
    console.log("Selected zoneIds:", value);
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

  const handleWeekOffChange = (checkedValues: string[], record: SupervisorData) => {
    setData((prev) => prev.map((item) => (item.key === record.key ? { ...item, weekOffs: checkedValues } : item)));
  };

  // === Update Handler ===
  const handleUpdate = async (record: SupervisorData) => {
    try {
      // Convert zoneIds from string[] to the required format
      const zoneIds = record.zone?.map(zoneId => zoneId) || [];
      
      // For supervisors, assignmentTypes should always be [0]
      const assignmentTypes = [0];

      // Prepare the data in the required format
      const updateData = {
        employeeId: record.employeeId,
        wO_Days: record.weekOffs?.join(',') || "", // Join with commas: "Monday,Tuesday,Wednesday"
        role: "Supervisor", // Always Supervisor
        assignmentTypes: assignmentTypes, // Always [0] for supervisors
        zoneIds: zoneIds // Array of strings
      };

      console.log("Sending update data for supervisor:", updateData);
      console.log("Zone IDs:", zoneIds);

      const result = await updateShiftManagement(updateData).unwrap();
      
      notification.success({
        message: t("Update successful"),
        description: t("Supervisor data has been updated successfully."),
      });

      // Refresh the data
      refetchActiveShifts();

    } catch (error) {
      console.error("Update error:", error);
      notification.error({
        message: t("Update failed"),
        description: t("Failed to update supervisor data. Please try again."),
      });
    }
  };

  // Add this useEffect to debug the data state
  useEffect(() => {
    console.log("Current supervisor data state:", data);
    if (data.length > 0) {
      console.log("First supervisor data:", data[0]);
      console.log("First supervisor zones:", data[0].zone);
    }
  }, [data]);

  // === Columns with custom render ===
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
              tagRender={(props) => {
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
                      <span
                        style={{ marginLeft: 6, cursor: "pointer", color: "#1890ff" }}
                        onClick={onClose}
                      >
                        ✕
                      </span>
                    )}
                  </span>
                );
              }}
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
              options={days.map((day) => ({
                label: day,
                value: day,
              }))}
              value={record.weekOffs}
              onChange={(vals) => handleWeekOffChange(vals as string[], record)}
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
                loading={isUpdating}
              >
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
  }, [zones, shifts, data, isLoadingZones, isLoadingShifts, isUpdating]);

  // Show error if active shifts API fails
  // if (activeShiftsError) {
  //   return (
  //     <div style={{ padding: 20 }}>
  //       <Alert 
  //         message="Failed to load supervisor data" 
  //         description="Please check your API endpoint and try again." 
  //         type="error" 
  //       />
  //       <Button onClick={refetchActiveShifts} style={{ marginTop: 10 }}>
  //         Retry
  //       </Button>
  //     </div>
  //   );
  // }

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