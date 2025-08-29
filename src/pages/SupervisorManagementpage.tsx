import React, { useEffect, useState } from "react";
import { Space, Table, Select, Checkbox } from "antd";
import { SupervisorManagemnetConfig } from "../config/pageConfigs/SupervisorManagementConfig";
import { usePage } from "../contexts/PageContext";
import { useTranslation } from "react-i18next";

const { Option } = Select;

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const sampleData = [
  { key: 1, SupervisorName: "John Doe" },
  { key: 2, SupervisorName: "Jane Smith" },
];

function UserZoneLinking() {
  const { setPageTitle } = usePage();
  const { t } = useTranslation();
  const [data, setData] = useState(sampleData);

  useEffect(() => {
    setPageTitle(t(SupervisorManagemnetConfig.title));
  }, [setPageTitle, t]);

  const handleZoneChange = (value: string, record: any) => {
    const newData = data.map((item) =>
      item.key === record.key ? { ...item, zone: value } : item
    );
    setData(newData);
  };

  const handleShiftChange = (value: string, record: any) => {
    const newData = data.map((item) =>
      item.key === record.key ? { ...item, shift: value } : item
    );
    setData(newData);
  };

  const handleWeekOffChange = (checkedValues: string[], record: any) => {
    const newData = data.map((item) =>
      item.key === record.key ? { ...item, weekOffs: checkedValues } : item
    );
    setData(newData);
  };

  const columns = SupervisorManagemnetConfig.tableConfig.columns.map((col) => {
    if (col.key === "zone") {
  return {
    ...col,
    render: (_: any, record: any) => (
      <Select
        mode="multiple"
        value={record.zone || []}
        style={{ width: 200 }}
        onChange={(val) => handleZoneChange(val, record)}
        placeholder="Select Zone(s)"
        tagRender={(props) => {
          const { label, closable, onClose } = props;
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

    return { ...col, dataIndex: col.key };
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