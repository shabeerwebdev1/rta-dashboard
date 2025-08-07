import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Input,
  Button,
  Space,
  Tooltip,
  Dropdown,
  Card,
  Tag,
  theme,
  App,
  DatePicker,
} from "antd";
import {
  DownloadOutlined,
  EyeOutlined,
  MoreOutlined,
  EnvironmentOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

import { usePage } from "../contexts/PageContext";
import usePageLoader from "../hooks/usePageLoader";
import PageLoader from "../components/common/PageLoader";
import { exportToCsv } from "../utils/csvExporter";
import FinesManagementViewDrawer from "../components/fines/FinesManagementViewDrawer";
import type { FineRecord } from "../types/fine";

const { RangePicker } = DatePicker;
const { useToken } = theme;

const FinesManagementPage: React.FC = () => {
  const { setPageTitle } = usePage();
  const pageLoading = usePageLoader();
  const { token } = useToken();
  const { message, modal } = App.useApp();

  const [tableData, setTableData] = useState<FineRecord[]>([]);
  const [filteredData, setFilteredData] = useState<FineRecord[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FineRecord | null>(null);
  const [tableSize, setTableSize] = useState<"middle" | "small">("middle");

  useEffect(() => {
    setPageTitle("Fines Management");

    const data: FineRecord[] = [
      {
        id: "1",
        fineNumber: "FINE2023001",
        inspectorDeviceNumber: "DEV-001",
        assignedArea: "Downtown Area",
        fineType: "Illegal Parking",
        fineAmount: 500,
        status: "Issued",
        issueDate: "01-08-2025",
        location: { lat: 25.2048, lng: 55.2708 },
        vehicleDetails: {
          plateNumber: "D12345",
          vehicleType: "Sedan",
        },
      },
      {
        id: "2",
        fineNumber: "FINE2023002",
        inspectorDeviceNumber: "DEV-002",
        assignedArea: "Business District",
        fineType: "No Parking Permit",
        fineAmount: 300,
        status: "Paid",
        issueDate: "15-08-2025",
        location: { lat: 25.2148, lng: 55.2808 },
        vehicleDetails: {
          plateNumber: "E67890",
          vehicleType: "SUV",
        },
      },
      {
        id: "3",
        fineNumber: "FINE2023003",
        inspectorDeviceNumber: "DEV-003",
        assignedArea: "Residential Zone",
        fineType: "Blocking Driveway",
        fineAmount: 400,
        status: "Disputed",
        issueDate: "20-08-2025",
        location: { lat: 25.2248, lng: 55.2908 },
        vehicleDetails: {
          plateNumber: "F13579",
          vehicleType: "Truck",
        },
      },
    ];
    setTableData(data);
    setFilteredData(data);
  }, [setPageTitle]);

  const handleGlobalSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    const filtered = tableData.filter((item) =>
      Object.values(item).some(
        (field) =>
          typeof field === "string" && field.toLowerCase().includes(value)
      )
    );
    setFilteredData(filtered);
  };

  const handleDateFilter = (dates: any) => {
    if (!dates) {
      setFilteredData(tableData);
      return;
    }
    const [start, end] = dates;
    const filtered = tableData.filter((item) => {
      const itemDate = dayjs(item.issueDate, "DD-MM-YYYY");
      return (
        itemDate.isAfter(start.startOf("day")) &&
        itemDate.isBefore(end.endOf("day"))
      );
    });
    setFilteredData(filtered);
  };

  const handleDownloadCsv = () => {
    const stats = {
      total: filteredData.length,
      issued: filteredData.filter((i) => i.status === "Issued").length,
      paid: filteredData.filter((i) => i.status === "Paid").length,
      disputed: filteredData.filter((i) => i.status === "Disputed").length,
    };

    modal.confirm({
      title: "Download CSV",
      icon: <DownloadOutlined />,
      content: (
        <div>
          <p>You're about to download the filtered fine data as CSV.</p>
          <ul>
            <li>
              <strong>Total Fines:</strong> {stats.total}
            </li>
            <li>
              <strong>Issued:</strong> {stats.issued}
            </li>
            <li>
              <strong>Paid:</strong> {stats.paid}
            </li>
            <li>
              <strong>Disputed:</strong> {stats.disputed}
            </li>
          </ul>
        </div>
      ),
      okText: "Download",
      cancelText: "Cancel",
      onOk() {
        try {
          exportToCsv(filteredData, "fines_management_export.csv");
          message.success("CSV downloaded successfully.");
        } catch (error) {
          console.error("CSV Export Failed:", error);
          message.error("Failed to download CSV.");
        }
      },
    });
  };

  const handleViewDetails = (record: FineRecord) => {
    setSelectedRecord(record);
    setIsDrawerOpen(true);
  };

  const handleMarkAsPaid = (record: FineRecord) => {
    modal.confirm({
      title: "Confirm Payment",
      content: `Are you sure you want to mark fine ${record.fineNumber} as paid?`,
      okText: "Yes, Mark as Paid",
      cancelText: "Cancel",
      onOk: () => {
        message.success(`Fine ${record.fineNumber} marked as paid.`);
      },
    });
  };

  const columns: ColumnsType<FineRecord> = useMemo(
    () => [
      
      {
        title: "Inspector Device",
        dataIndex: "inspectorDeviceNumber",
        key: "inspectorDeviceNumber",
        width: 150,
        ellipsis: true,
      },
      {
        title: "Assigned Area",
        dataIndex: "assignedArea",
        key: "assignedArea",
        width: 150,
        ellipsis: true,
      },
      {
        title: "Fine Type",
        dataIndex: "fineType",
        key: "fineType",
        width: 150,
        ellipsis: true,
      },
      {
        title: "Issued Fine Amount",
        dataIndex: "fineAmount",
        key: "fineAmount",
        width: 150,
        render: (amount) => (
          <span style={{ fontWeight: "bold" }}>{amount.toFixed(2)}</span>
        ),
        sorter: (a, b) => a.fineAmount - b.fineAmount,
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 120,
        render: (status) => {
          let color = "";
          switch (status) {
            case "Issued":
              color = "orange";
              break;
            case "Paid":
              color = "green";
              break;
            case "Disputed":
              color = "red";
              break;
            default:
              color = "default";
          }
          return <Tag color={color}>{status}</Tag>;
        },
      },
      {
        title: "",
        key: "action",
        fixed: "right",
        width: 120,
        align: "center",
        render: (_, record) => (
          <Space size="small">
            <Tooltip title="View on map">
              <Button
                icon={<EnvironmentOutlined />}
                type="text"
                onClick={() => handleViewDetails(record)}
              />
            </Tooltip>
            <Dropdown
              menu={{
                items: [
                  {
                    key: "view",
                    icon: <EyeOutlined />,
                    label: "View Details",
                    onClick: () => handleViewDetails(record),
                  },
                  {
                    key: "markAsPaid",
                    icon: <EyeOutlined />,
                    label: "Mark as Paid",
                    disabled: record.status !== "Issued",
                    onClick: () => handleMarkAsPaid(record),
                  },
                ],
              }}
              placement="bottomLeft"
              trigger={["click"]}
            >
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        ),
      },
    ],
    [token]
  );

  if (pageLoading) return <PageLoader />;

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card variant="borderless">
        <Space
          wrap
          style={{ width: "100%", justifyContent: "space-between" }}
          size="middle"
        >
          <Space wrap size="middle">
            <Input.Search
              placeholder="Search fines..."
              style={{ minWidth: "300px" }}
              onChange={handleGlobalSearch}
              allowClear
            />
            <RangePicker onChange={handleDateFilter} />
            <Tooltip
              title={tableSize === "middle" ? "Compact view" : "Standard view"}
            >
              <Button
                icon={
                  tableSize === "middle" ? (
                    <UnorderedListOutlined />
                  ) : (
                    <AppstoreOutlined />
                  )
                }
                onClick={() =>
                  setTableSize(tableSize === "middle" ? "small" : "middle")
                }
              />
            </Tooltip>
          </Space>
          <Button icon={<DownloadOutlined />} onClick={handleDownloadCsv}>
            Download CSV
          </Button>
        </Space>
      </Card>

      <Card variant="borderless" bodyStyle={{ padding: 0 }}>
        <Table
          rowKey="id"
          rowSelection={{ type: "checkbox" }}
          columns={columns}
          dataSource={filteredData}
          size={tableSize}
          sticky={{ offsetHeader: 64 }}
          scroll={{ x: 1200 }}
          pagination={{
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
            defaultPageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
          }}
        />
      </Card>

      <FinesManagementViewDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        record={selectedRecord}
      />
    </Space>
  );
};

export default FinesManagementPage;
