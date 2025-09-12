/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useMemo } from "react";
import { Card, Select, Checkbox, Space, Spin, Alert, Table, Button } from "antd";
import { roleManagementConfig } from "../config/pageConfigs/roleManagementConfig";
import { usePage } from "../contexts/PageContext";
import { useTranslation } from "react-i18next";
import { useAppNotification } from "../utils/notificationManager";
import {
  useGetRolesQuery,
  useLazyGetRoleByIdQuery,
  useUpdateRolePermissionsMutation,
} from "../services/rtkApiFactory";
import DataTableWrapper from "../components/common/DataTableWrapper";

const { Option } = Select;

interface RolePermission {
  id: number;
  roleManagementCode: string;
  menuName: string;
  roleGUID: string;
  roleName: string | null;
  canCreate: number;
  canRead: number;
  canUpdate: number;
  canDelete: number;
  isActive: boolean;
}

interface TableRow {
  key: number;
  menuItem: string;
  create: number;
  read: number;
  update: number;
  delete: number;
  roleManagementCode: string;
  roleGUID: string;
}

const RoleManagementPage: React.FC = () => {
  const [selectedRoleId, setSelectedRoleId] = useState<string>("default");
  const [selectedRoleName, setSelectedRoleName] = useState<string>("");
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [originalData, setOriginalData] = useState<TableRow[]>([]);

  const { setPageTitle } = usePage();
  const { t } = useTranslation();
  const notification = useAppNotification();

  // API hooks
  const { data: rolesData, error: rolesError, isLoading: isLoadingRoles } = useGetRolesQuery(undefined);
  const [getRoleById, { data: rolePermissions, error: permissionsError, isLoading: isLoadingPermissions }] =
    useLazyGetRoleByIdQuery();
  const [updateRolePermissions, { isLoading: isUpdating }] = useUpdateRolePermissionsMutation();

  // Fetch permissions when role is selected
  useEffect(() => {
    if (selectedRoleId && selectedRoleId !== "default") {
      getRoleById(selectedRoleId);
    }
  }, [selectedRoleId, getRoleById]);

  // Transform API data → table rows
  useEffect(() => {
    if (rolePermissions?.data) {
      const transformedData: TableRow[] = rolePermissions.data.map((item: RolePermission) => ({
        key: item.id,
        menuItem: item.menuName,
        create: item.canCreate,
        read: item.canRead,
        update: item.canUpdate,
        delete: item.canDelete,
        roleManagementCode: item.roleManagementCode,
        roleGUID: item.roleGUID,
      }));
      setTableData(transformedData);
      setOriginalData(transformedData);
    }
  }, [rolePermissions]);

  // Handle checkbox toggle
  const handleCheckboxChange = (recordKey: number, field: keyof TableRow, checked: boolean) => {
    setTableData((prev) =>
      prev.map((row) => (row.key === recordKey ? { ...row, [field]: checked ? 1 : 0 } : row))
    );
  };

  // Handle role selection
  const handleRoleChange = (value: string, option: any) => {
    if (value === "default") {
      setSelectedRoleId("default");
      setSelectedRoleName("");
      setTableData([]);
      setOriginalData([]);
      return;
    }

    setSelectedRoleId(value);
    setSelectedRoleName(option.children || "");
  };

  // Prepare data for submission - only include modified permissions
  const prepareSubmissionData = () => {
    const modifiedData = tableData.filter((row, index) => {
      const originalRow = originalData[index];
      return (
        row.create !== originalRow.create ||
        row.read !== originalRow.read ||
        row.update !== originalRow.update ||
        row.delete !== originalRow.delete
      );
    });

    return modifiedData.map((row) => ({
      id: row.key,
      roleManagementCode: row.roleManagementCode,
      menuName: row.menuItem,
      roleGUID: row.roleGUID,
      roleName: selectedRoleName,
      canCreate: row.create,
      canRead: row.read,
      canUpdate: row.update,
      canDelete: row.delete,
    }));
  };

  // Handle update submission
  const handleUpdate = async () => {
    try {
      const submissionData = prepareSubmissionData();

      if (submissionData.length === 0) {
        notification.info(
          t("No changes detected"),
          t("Please modify at least one permission before updating.")
        );
        return;
      }

      await updateRolePermissions(submissionData).unwrap();

      notification.success(
        t("Permissions updated successfully"),
        t("Role permissions have been updated.")
      );

      // ✅ Reset to default state after update
      setSelectedRoleId("default");
      setSelectedRoleName("");
      setTableData([]);
      setOriginalData([]);
    } catch (error) {
      notification.error(
        t("Update failed"),
        t("Failed to update permissions. Please try again.")
      );
      console.error("Update error:", error);
    }
  };

  // Build columns directly from config
  const tableColumns = useMemo(() => {
    return roleManagementConfig.tableConfig.columns.map((col) => {
      if (col.type === "boolean") {
        return {
          ...col,
          render: (_: any, record: TableRow) => (
            <Checkbox
              checked={record[col.key as keyof TableRow] === 1}
              disabled={record[col.key as keyof TableRow] === -1}
              onChange={(e) => handleCheckboxChange(record.key, col.key as keyof TableRow, e.target.checked)}
            />
          ),
        };
      }
      return col;
    });
  }, [tableData]);

  useEffect(() => {
    setPageTitle(t(roleManagementConfig.title));
  }, [setPageTitle, t]);

  if (isLoadingRoles) {
    return <Spin size="large" style={{ display: "block", margin: "50px auto" }} />;
  }

  if (rolesError) {
    return <Alert message="Error" description="Failed to load roles. Please try again later." type="error" showIcon />;
  }

  return (
    <Card bordered={false}>
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <Select
          value={selectedRoleId || "default"}
          style={{ width: 200 }}
          onChange={handleRoleChange}
          loading={isLoadingRoles}
        >
          <Option value="default" disabled>
            {t("placeholders.selectRole")}
          </Option>

          {rolesData?.map((role: any, index: number) => {
            const keyValue = role.roleId ?? role.roleGUID ?? `role-${index}`;
            return (
              <Option key={keyValue} value={keyValue}>
                {role.roleName ?? "Unnamed Role"}
              </Option>
            );
          })}
        </Select>

        {/* Show Update button only when a valid role is selected */}
        {selectedRoleId !== "default" && (
          <Button type="primary" onClick={handleUpdate} loading={isUpdating} disabled={isLoadingPermissions}>
            {t("common.update")}
          </Button>
        )}

        {permissionsError && (
          <Alert message="Error" description="Failed to load permissions for this role." type="error" showIcon />
        )}

        {isLoadingPermissions ? (
          <Spin size="large" style={{ display: "block", margin: "50px auto" }} />
        ) : (
          //  Show table only when role is selected
          selectedRoleId !== "default" && (
            <DataTableWrapper
              pageConfig={{
                ...roleManagementConfig,
                tableConfig: {
                  ...roleManagementConfig.tableConfig,
                  columns: tableColumns,
                },
              }}
              data={tableData}
              total={tableData.length}
              isLoading={isLoadingPermissions}
              handleTableChange={() => {}}
              handlePaginationChange={() => {}}
              tableSize="middle"
              state={{ columnFilters: {} }}
              showPagination={false}
              rowKey={(record: TableRow) => record.key ?? record.roleGUID ?? Math.random()}
            />
          )
        )}
      </Space>
    </Card>
  );
};

export default RoleManagementPage;