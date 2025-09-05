// UserZoneLinking.tsx
import React, { useEffect, useState, useMemo } from "react";
import { Space, Table, Select, Checkbox, notification, Spin, Button } from "antd";
import { UserZoneLinkingConfig } from "../config/pageConfigs/userZoneLinkingConfig";
import { useTranslation } from "react-i18next";
import { useLazyGetLookupsQuery, useLazyGetZonesQuery, useLazyGetShiftsQuery } from "../services/rtkApiFactory";

const { Option } = Select;

interface InspectorData {
  key: number;
  InspectorName: string;
  zone?: string[];
  shift?: string;
  weekOffs?: string[];
  assignmentType?: number[];
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
  zoneName: string;
  zoneNameAr?: string;
  // Add other properties based on your API response
}

interface Shift {
  shiftTypeGUID: string;
  shiftTypeCode: string;
  shiftTypeNameEn: string;
  shiftTypeNameAr: string;
}


const sampleData: InspectorData[] = [
  { key: 1, InspectorName: "John Doe" },
  { key: 2, InspectorName: "Jane Smith" },
];

function UserZoneLinking() {

  const { t, i18n } = useTranslation();
  const [data, setData] = useState<InspectorData[]>(sampleData);
  const [triggerGetLookups] = useLazyGetLookupsQuery();
  const [triggerGetZones] = useLazyGetZonesQuery();
  const [triggerGetShifts] = useLazyGetShiftsQuery();
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

const fetchLookupData = async () => {
  setIsLoadingLookups(true);
  try {
    const result = await triggerGetLookups([1400]).unwrap();

    // 🔹 Show the transformed data from RTK query
    console.log("📌 Lookup API Result (transformed):", result);

    setLookupOptions(result);
  } catch (error) {
    console.log("❌ Error fetching lookups:", error);
    notification.error({ message: "Failed to fetch lookup data." });
  } finally {
    setIsLoadingLookups(false);
  }
};


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

const assignmentTypeOptions = useMemo(() => {
  return lookupOptions
    .filter((item) => item.categoryId === 1400) // ✅ only use InspectionType
    .map((item) => ({
      value: item.value,
      label: i18n.language === "ar" ? item.labelAr : item.labelEn,
    }));
}, [lookupOptions, i18n.language]);

const zoneOptions = useMemo(() => {
  return zones.map((zone) => ({
    value: zone.zoneId, // ✅ store zoneId for submission
    label: `${zone.zoneCode}-${zone.zone}`, // ✅ display zoneCode-zone
    original: zone
  }));
}, [zones, i18n.language]);


const shiftOptions = useMemo(() => {
  return shifts.map((shift) => ({
    value: shift.shiftTypeGUID, // ✅ store only GUID for submission
    label: `${shift.shiftTypeCode} - ${
      i18n.language === "ar" ? shift.shiftTypeNameAr : shift.shiftTypeNameEn
    }`,
    original: shift,
  }));
}, [shifts, i18n.language]);





  const handleZoneChange = (value: string[], record: InspectorData) => {
  console.log("Selected zoneIds:", value);
  setData((prev) =>
    prev.map((item) =>
      item.key === record.key ? { ...item, zone: value } : item
    )
  );
};

  const handleShiftChange = (value: string, record: InspectorData) => {
  setData((prev) =>
    prev.map((item) =>
      item.key === record.key ? { ...item, shift: value } : item
    )
  );
};


  const handleWeekOffChange = (checkedValues: string[], record: InspectorData) => {
    setData((prev) => prev.map((item) => (item.key === record.key ? { ...item, weekOffs: checkedValues } : item)));
  };

  const handleAssignmentTypeChange = (value: number[], record: InspectorData) => {
    setData((prev) => prev.map((item) => (item.key === record.key ? { ...item, assignmentType: value } : item)));
  };

  const columns = UserZoneLinkingConfig.tableConfig.columns.map((col: any) => {
   if (col.key === "Zone") {
  return {
    ...col,
    render: (_: any, record: InspectorData) => (
      <Select
        mode="multiple"
        value={record.zone || []} // stores zoneIds
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
              {label} {/* ✅ will show like ZONE002-North Zone */}
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


    // ... rest of your column definitions remain the same
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
        style={{ width: 250 }}
        onChange={(val) => handleAssignmentTypeChange(val, record)}
        placeholder="Select Assignment Type(s)"
        loading={isLoadingLookups}
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
          />
        ),
      };
    }

    if (col.key === "Actions") {
      return {
        ...col,
        render: (_: any, record: InspectorData) => (
          <Space>
            <Button type="primary">Update</Button>
          </Space>
        ),
      };
    }

    return {
      ...col,
      dataIndex: col.key,
    };
  });

  // const handleSubmit = () => {
  //   console.log("Data to submit:", data);
  //   console.log("Available zones:", zones);
  //   console.log("Zone options:", zoneOptions);
  // };

  

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* <Button onClick={handleSubmit} type="primary" style={{ marginBottom: 16 }}>
        Log Data to Console
      </Button> */}
      
      <Spin spinning={isLoadingLookups || isLoadingZones}>
        <Table
          dataSource={data}
          columns={columns}
          pagination={true}
          scroll={{ x: true }}
        />
      </Spin>
    </Space>
  );
}

export default UserZoneLinking;