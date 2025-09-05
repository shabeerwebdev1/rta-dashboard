import React, { useEffect, useState } from "react";
import { Card, Select, Button, Checkbox, Space } from "antd";
import { roleManagementConfig } from "../config/pageConfigs/roleManagementConfig";
import DataTableWrapper from "../components/common/DataTableWrapper";
import { usePage } from "../contexts/PageContext";
import { useTranslation } from "react-i18next";

const { Option } = Select;

const initialData = [
  { key: 1, menuItem: "Dashboard", create: -1, read: 1, update: 0, delete: 0 },
  { key: 2, menuItem: "Whitelist", create: 1, read: 1, update: 1, delete: 0 },
  { key: 3, menuItem: "Pledge", create: 0, read: 1, update: -1, delete: 0 },
  { key: 4, menuItem: "Observable", create: 1, read: 1, update: 0, delete: 1 },
];

const RoleManagementPage: React.FC = () => {
  const [role, setRole] = useState<string>("admin");
  const [tableData, setTableData] = useState(initialData);
    const { setPageTitle } = usePage();
    const { t } = useTranslation();

  const handleCheckboxChange = (recordKey: number, field: string, checked: boolean) => {
    const newData = tableData.map((row) =>
      row.key === recordKey ? { ...row, [field]: checked ? 1 : 0 } : row
    );
    setTableData(newData);
  };

  useEffect(() => {
      setPageTitle(t(roleManagementConfig.title));
    }, [setPageTitle, t]);

  // Custom columns with checkboxes
  roleManagementConfig.tableConfig.columns = [
    { key: "menuItem", title: "Menu Item", dataIndex: "menuItem" },
    ...["create", "read", "update", "delete"].map((field) => ({
      key: field,
      title: field.charAt(0).toUpperCase() + field.slice(1),
      dataIndex: field,
      render: (_: any, record: any) => (
        <Checkbox
          checked={record[field] === 1}
          disabled={record[field] === -1}
          onChange={(e) => handleCheckboxChange(record.key, field, e.target.checked)}
        />
      ),
    })),
  ];

  return (
    <Card  bordered={false}>
      <Space style={{ marginBottom: 16 }}>
        <span>Select Role:</span>
        <Select value={role} style={{ width: 200 }} onChange={(val) => setRole(val)}>
          <Option value="admin">Admin</Option>
          <Option value="manager">Manager</Option>
          <Option value="user">User</Option>
        </Select>
        <Button type="primary">Update</Button>
      </Space>

      <DataTableWrapper
        pageConfig={roleManagementConfig}   
        data={tableData}
        total={tableData.length}
        isLoading={false}
        apiParams={{ PageNumber: 1, PageSize: 10 }}
        handleTableChange={() => {}}
        handlePaginationChange={() => {}}
        tableSize="middle"
        state={{ columnFilters: {} }}
        pagination={false}
      />
    </Card>
  );
};

export default RoleManagementPage;
