import React, { useEffect, useMemo, useState } from "react";
import { Space, Table, Select, Checkbox, notification, Button, Spin } from "antd";
import { SupervisorManagemnetConfig } from "../config/pageConfigs/SupervisorManagementConfig";
import { useTranslation } from "react-i18next";
import { useLazyGetShiftsQuery, useLazyGetZonesQuery } from "../services/rtkApiFactory";

interface SupervisorData {
  key: number;
  SupervisorName: string;
  zone?: string[];
  shift?: string;
  weekOffs?: string[];
}

interface Zone {
  zoneId: number;
  zoneName: string;
  zoneNameAr?: string;
  zoneCode?: string; // Added zoneCode based on your comment
  zone?: string; // Added zone name based on your comment
}

interface Shift {
  shiftTypeGUID: string;
  shiftTypeCode: string;
  shiftTypeNameEn: string;
  shiftTypeNameAr: string;
}


const { Option } = Select;

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const sampleData: SupervisorData[] = [
  { key: 1, SupervisorName: "John Doe" },
  { key: 2, SupervisorName: "Jane Smith" },
];

function SupervisorManagement() {
  
  const [data, setData] = useState<SupervisorData[]>(sampleData);
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [triggerGetZones] = useLazyGetZonesQuery();
  const [triggerGetShifts] = useLazyGetShiftsQuery();
  const { t, i18n } = useTranslation();
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);
  const [shifts, setShifts] = useState<Shift[]>([]);

  useEffect(() => {
    fetchZonesData();
     fetchShiftsData();
  }, [i18n.language]);

  

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
  const handleWeekOffChange = (checkedValues: string[], record: SupervisorData) => {
    setData((prev) => prev.map((item) => (item.key === record.key ? { ...item, weekOffs: checkedValues } : item)));
  };

  // const handleSubmit = () => {
  //   console.log("Supervisor Management Data to submit:", data);
  //   console.log("Available zones:", zones);
  //   console.log("Zone options:", zoneOptions);
  // };

  const columns = SupervisorManagemnetConfig.tableConfig.columns.map((col: any) => {
   if (col.key === "zone") {
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

  return (

    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* <Button onClick={handleSubmit} type="primary" style={{ marginBottom: 16 }}>
        Log Data to Console
      </Button> */}
      
      <Spin spinning={isLoadingZones}>
        <Table 
         
          dataSource={data} 
          columns={columns} 
          pagination={false} 
        />
      </Spin>
    </Space>
  );

}

export default SupervisorManagement;