// UserZoneLinking.tsx
import React, { useEffect, useState } from "react";
import { Space, Table, Select, Checkbox } from "antd";
import { UserZoneLinkingConfig } from "../config/pageConfigs/userZoneLinkingConfig";
import { usePage } from "../contexts/PageContext";
import { useTranslation } from "react-i18next";
import { SupervisorManagemnetConfig } from "../config/pageConfigs/SupervisorManagementConfig";

const { Option } = Select;

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const sampleData = [
  { key: 1, employeeId: "E123", employeeName: "John Doe" },
  { key: 2, employeeId: "E456", employeeName: "Jane Smith" },
];

function UserZoneLinking() {
  const { setPageTitle } = usePage();
  const { t } = useTranslation();
  const [data, setData] = useState(sampleData);

  useEffect(() => {
    setPageTitle(t(SupervisorManagemnetConfig.title));
  }, [setPageTitle, t]);

  const handleZoneChange = (value: string, record: any) => {
    const newData = data.map((item) => (item.key === record.key ? { ...item, zone: value } : item));
    setData(newData);
  };

  const handleShiftChange = (value: string, record: any) => {
    const newData = data.map((item) => (item.key === record.key ? { ...item, shift: value } : item));
    setData(newData);
  };

  const handleWeekOffChange = (checkedValues: string[], record: any) => {
    const newData = data.map((item) => (item.key === record.key ? { ...item, weekOffs: checkedValues } : item));
    setData(newData);
  };

  // Build columns dynamically
  const columns = UserZoneLinkingConfig.tableConfig.columns.map((col) => {
    if (col.key === "zone") {
      return {
        ...col,
        render: (_: any, record: any) => (
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

    if (col.key === "shift") {
      return {
        ...col,
        render: (_: any, record: any) => (
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

    if (col.key === "weekOffs") {
      return {
        ...col,
        render: (_: any, record: any) => (
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
      <Table rowSelection={{ type: "checkbox" }} dataSource={data} columns={columns} pagination={false} />
    </Space>
  );
}

export default UserZoneLinking;
