// UserZoneLinking.tsx
import React, { useEffect, useState } from "react";
import { Space, Table, Select, Checkbox } from "antd";
import { UserZoneLinkingConfig } from "../config/pageConfigs/userZoneLinkingConfig";
import { usePage } from "../contexts/PageContext";
import { useTranslation } from "react-i18next";

const { Option } = Select;

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface InspectorData {
  key: number;
  InspectorName: string;
  zone?: string;
  shift?: string;
  weekOffs?: string[];
  inspectiontype?: string;
}

const sampleData: InspectorData[] = [
  { key: 1, InspectorName: "John Doe" },
  { key: 2, InspectorName: "Jane Smith" },
];

function UserZoneLinking() {
  const { setPageTitle } = usePage();
  const { t } = useTranslation();
  const [data, setData] = useState<InspectorData[]>(sampleData);

  useEffect(() => {
    setPageTitle(t(UserZoneLinkingConfig.title));
  }, [setPageTitle, t]);

  const handleZoneChange = (value: string, record: InspectorData) => {
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
      prev.map((item) => (item.key === record.key ? { ...item, weekOffs: checkedValues } : item))
    );
  };

  const handleInspectionTypeChange = (value: string, record: InspectorData) => {
    setData((prev) =>
      prev.map((item) =>
        item.key === record.key ? { ...item, inspectiontype: value } : item
      )
    );
  };

  // Build columns dynamically
  const columns = UserZoneLinkingConfig.tableConfig.columns.map((col: any) => {
    if (col.key === "Zone") {
      return {
        ...col,
        render: (_: any, record: InspectorData) => (
          <Select
            value={record.zone}
            style={{ width: 120 }}
            onChange={(val) => handleZoneChange(val, record)}
            placeholder="Select Zone"
          >
            <Option value="North">North</Option>
            <Option value="South">South</Option>
            <Option value="East">East</Option>
            <Option value="West">West</Option>
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
            style={{ width: 140 }}
            onChange={(val) => handleShiftChange(val, record)}
            placeholder="Select Shift"
          >
            <Option value="Morning">Morning</Option>
            <Option value="Afternoon">Afternoon</Option>
            <Option value="Night">Night</Option>
          </Select>
        ),
      };
    }

    if (col.key === "InspectionType") {
      return {
        ...col,
        render: (_: any, record: InspectorData) => (
          <Select
            value={record.inspectiontype}
            style={{ width: 160 }}
            onChange={(val) => handleInspectionTypeChange(val, record)}
            placeholder="Select Type"
          >
            <Option value="Plate Type">Car Plate</Option>
            <Option value="Trade Type">Trade License</Option>
          </Select>
        ),
      };
    }

    if (col.key === "WeekOffs") {
      return {
        ...col,
        render: (_: any, record: InspectorData) => (
          <Checkbox.Group
            options={days}
            value={record.weekOffs}
            onChange={(vals) => handleWeekOffChange(vals as string[], record)}
          />
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
      <Table
        rowSelection={{ type: "checkbox" }}
        dataSource={data}
        columns={columns}
        pagination={false}
      />
    </Space>
  );
}

export default UserZoneLinking;