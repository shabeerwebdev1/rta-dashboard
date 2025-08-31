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
  zone?: string[];
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
            mode="multiple"
            value={record.zone || []}
            style={{ width: 200 }}
            onChange={(val) => handleZoneChange(val, record)}
            placeholder="Select Zone(s)"
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
            <Option value="North">North</Option>
            <Option value="South">South</Option>
            <Option value="East">East</Option>
            <Option value="West">West</Option>
            <Option value="Central">Central</Option>
            <Option value="North-East">North-East</Option>
            <Option value="South-West">South-West</Option>
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
            <Option value="Food Safety">Food Safety</Option>
            <Option value="Building Inspection">Building Inspection</Option>
          </Select>
        ),
      };
    }

    if (col.key === "WeekOffs") {
      return {
        ...col,
        render: (_: any, record: InspectorData) => (
          <Checkbox.Group
            options={days.map(day => ({ label: day, value: day }))}
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
        scroll={{ x: true }}
      />
    </Space>
  );
}

export default UserZoneLinking;