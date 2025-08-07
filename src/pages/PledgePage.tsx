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
  Typography,
  theme,
  App,
  DatePicker,
} from "antd";
import {
  PlusOutlined,
  DownloadOutlined,
  EyeOutlined,
  MoreOutlined,
  EnvironmentOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { PledgeRecord } from "../types/pledge";
import AddPledgeModal from "../components/pledges/AddPledgeModal";
import { usePage } from "../contexts/PageContext";
import usePageLoader from "../hooks/usePageLoader";
import PageLoader from "../components/common/PageLoader";
import { exportToCsv } from "../utils/csvExporter";
import PledgeViewDrawer from "../components/pledges/PledgeViewDrawer";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { useToken } = theme;
const { Text } = Typography;

const getInitials = (name: string) => {
  const names = name.split(" ");
  const initials = names.map((n) => n[0]).join("");
  return initials.slice(0, 2).toUpperCase();
};

const PledgePage: React.FC = () => {
  const { setPageTitle } = usePage();
  const pageLoading = usePageLoader();
  const { token } = useToken();
  const { message, modal } = App.useApp();

  const [tableData, setTableData] = useState<PledgeRecord[]>([]);
  const [filteredData, setFilteredData] = useState<PledgeRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PledgeRecord | null>(
    null,
  );
  const [tableSize, setTableSize] = useState<"middle" | "small">("middle");

  useEffect(() => {
    setPageTitle("Pledge Management");
    const data: PledgeRecord[] = [
      {
        id: "1",
        pledgeNumber: "PL0001237",
        tradeLicenseNumber: "TL123456",
        tradeLicenseName: "ABC Trading LLC",
        businessName: "ABC Trading",
        pledgeType: "Corporate",
        fromDate: "01-08-2025",
        toDate: "31-12-2025",
        status: "Active",
        createdBy: "Admin User",
        createdAt: "01-08-2025",
        documents: [
          {
            id: "1",
            url: "https://example.com/doc1.pdf",
            type: "license",
            name: "Trade License",
          },
        ],
        location: { lat: 25.2048, lng: 55.2708 },
      },
      {
        id: "2",
        pledgeNumber: "PL0001337",
        tradeLicenseNumber: "TL654321",
        tradeLicenseName: "XYZ Enterprises",
        businessName: "XYZ Corp",
        pledgeType: "Corporate",
        fromDate: "15-08-2025",
        toDate: "15-12-2025",
        status: "Pending",
        createdBy: "Officer 1",
        createdAt: "15-08-2025",
        documents: [
          {
            id: "2",
            url: "https://example.com/doc2.pdf",
            type: "license",
            name: "Trade License",
          },
        ],
        location: { lat: 25.2148, lng: 55.2808 },
      },
      // Add more sample data as needed
    ];
    setTableData(data);
    setFilteredData(data);
  }, [setPageTitle]);

  const handleGlobalSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    const filtered = tableData.filter((item) =>
      Object.values(item).some(
        (field) =>
          typeof field === "string" && field.toLowerCase().includes(value),
      ),
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
      const itemDate = dayjs(item.fromDate, "DD-MM-YYYY");
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
      active: filteredData.filter((i) => i.status === "Active").length,
      pending: filteredData.filter((i) => i.status === "Pending").length,
      expired: filteredData.filter((i) => i.status === "Expired").length,
    };

    modal.confirm({
      title: "Download CSV",
      icon: <DownloadOutlined />,
      content: (
        <div>
          <p>You're about to download the filtered data as CSV.</p>
          <ul>
            <li>
              <Text strong>Total Entries:</Text> {stats.total}
            </li>
            <li>
              <Text strong>Active:</Text> {stats.active}
            </li>
            <li>
              <Text strong>Pending:</Text> {stats.pending}
            </li>
            <li>
              <Text strong>Expired:</Text> {stats.expired}
            </li>
          </ul>
        </div>
      ),
      okText: "Download",
      cancelText: "Cancel",
      onOk() {
        try {
          exportToCsv(filteredData, "pledge_export.csv");
          message.success("CSV downloaded successfully.");
        } catch (error) {
          console.error("CSV Export Failed:", error);
          message.error("Failed to download CSV.");
        }
      },
    });
  };

  const handleViewDetails = (record: PledgeRecord) => {
    setSelectedRecord(record);
    setIsDrawerOpen(true);
  };

  const handleRevoke = (record: PledgeRecord) => {
    modal.confirm({
      title: "Confirm Revocation",
      content: `Are you sure you want to revoke pledge ${record.pledgeType}?`,
      okText: "Yes, Revoke",
      cancelText: "Cancel",
      onOk: () => {
        message.success("Pledge revoked successfully.");
      },
    });
  };

  const columns: ColumnsType<PledgeRecord> = useMemo(
    () => [
      {
        title: "Pledge Type",
        dataIndex: "pledgeType",
        key: "pledgeNumber",
        width: 150,
        ellipsis: true,
        sorter: (a, b) => a.pledgeType.localeCompare(b.pledgeType),
      },
      {
        title: "TL Number",
        dataIndex: "tradeLicenseNumber",
        key: "tradeLicenseNumber",
        width: 120,
        ellipsis: true,
        sorter: (a, b) =>
          a.tradeLicenseNumber.localeCompare(b.tradeLicenseNumber),
      },

      {
        title: "From Date",
        dataIndex: "fromDate",
        key: "fromDate",
        width: 120,
        sorter: (a, b) => dayjs(a.fromDate).diff(dayjs(b.fromDate)),
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
                    key: "revoke",
                    icon: <EyeOutlined />,
                    label: "Revoke Pledge",
                    onClick: () => handleRevoke(record),
                    disabled: record.status !== "Active",
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
    [tableData, token],
  );

  const handleFormSubmit = (values: any) => {
    setIsSubmitting(true);
    setTimeout(() => {
      const newRecord: PledgeRecord = {
        id: Date.now().toString(),
        pledgeNumber: `PL000${1000 + tableData.length}`,
        tradeLicenseNumber: values.tradeLicenseNumber,
        tradeLicenseName: values.tradeLicenseName,
        businessName: values.businessName,
        pledgeType: values.pledgeType,
        fromDate: new Date().toLocaleDateString(),
        toDate: values.toDate,
        status: "Pending",
        createdBy: "Current User",
        createdAt: new Date().toLocaleDateString(),
        documents: values.documents || [],
        location: values.location || {
          lat: 25.2048 + (Math.random() - 0.5) * 0.1,
          lng: 55.2708 + (Math.random() - 0.5) * 0.1,
        },
      };
      setTableData([newRecord, ...tableData]);
      setFilteredData([newRecord, ...tableData]);
      setIsSubmitting(false);
      setIsModalOpen(false);
      message.success("Pledge added successfully.");
    }, 1500);
  };

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
              placeholder="Search pledges..."
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
          <Space>
            <Button icon={<DownloadOutlined />} onClick={handleDownloadCsv}>
              Download CSV
            </Button>
            <Button type="primary" onClick={() => setIsModalOpen(true)}>
              Add New
              <PlusOutlined />
            </Button>
          </Space>
        </Space>
      </Card>

      <Card variant="borderless" bodyStyle={{ padding: 0 }}>
        <Table
          rowKey={"id"}
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

      <AddPledgeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />
      <PledgeViewDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        record={selectedRecord}
      />
    </Space>
  );
};

export default PledgePage;
