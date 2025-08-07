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
import ParkonicViewDrawer from "../components/parkonic/ParkonicViewDrawer";
import type { ParkonicRecord } from "../types/parkonic";

const { RangePicker } = DatePicker;
const { useToken } = theme;

type ParkonicRecord = {
  id: string;
  fineNumber: string;
  issuedBy: string;
  fineAmount: number;
  type: string;
  status: "Approved" | "Rejected";
  issuedDate: string;
  location: { lat: number; lng: number };
};

const ParkonicPage: React.FC = () => {
  const { setPageTitle } = usePage();
  const pageLoading = usePageLoader();
  const { token } = useToken();
  const { message, modal } = App.useApp();

  const [tableData, setTableData] = useState<ParkonicRecord[]>([]);
  const [filteredData, setFilteredData] = useState<ParkonicRecord[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ParkonicRecord | null>(
    null,
  );
  const [tableSize, setTableSize] = useState<"middle" | "small">("middle");

  useEffect(() => {
    setPageTitle("Parkonic");

    const data: ParkonicRecord[] = [
      {
        id: "1",
        fineNumber: "FINE00123",
        issuedBy: "Dubai Police",
        fineAmount: 500,
        type: "Parkonic",
        status: "Approved",
        issuedDate: "01-08-2025",
        location: { lat: 25.2048, lng: 55.2708 },
      },
      {
        id: "2",
        fineNumber: "FINE00124",
        issuedBy: "RTA",
        fineAmount: 300,
        type: "RTA",
        status: "Rejected",
        issuedDate: "15-08-2025",
        location: { lat: 25.2148, lng: 55.2808 },
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
      const itemDate = dayjs(item.issuedDate, "DD-MM-YYYY");
      return (
        itemDate.isAfter(start.startOf("day")) &&
        itemDate.isBefore(end.endOf("day"))
      );
    });
    setFilteredData(filtered);
  };

  const handleDownloadCsv = () => {
    modal.confirm({
      title: "Download CSV",
      icon: <DownloadOutlined />,
      content: <p>You're about to download the filtered fine data as CSV.</p>,
      okText: "Download",
      cancelText: "Cancel",
      onOk() {
        try {
          exportToCsv(filteredData, "fines_export.csv");
          message.success("CSV downloaded successfully.");
        } catch (error) {
          console.error("CSV Export Failed:", error);
          message.error("Failed to download CSV.");
        }
      },
    });
  };

  const handleViewDetails = (record: ParkonicRecord) => {
    setSelectedRecord(record);
    setIsDrawerOpen(true);
  };

  const columns: ColumnsType<ParkonicRecord> = useMemo(
    () => [
      {
        title: "Fine Number",
        dataIndex: "fineNumber",
        key: "fineNumber",
        width: 150,
        ellipsis: true,
      },
      {
        title: "Issued By",
        dataIndex: "issuedBy",
        key: "issuedBy",
        width: 150,
      },
      {
        title: "Issued Fine Amount",
        dataIndex: "fineAmount",
        key: "fineAmount",
        width: 120,
        render: (amount) => `AED ${amount.toFixed(2)}`,
        sorter: (a, b) => a.fineAmount - b.fineAmount,
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 100,
        render: (status) => {
          const color =
            status === "Approved"
              ? "green"
              : status === "Rejected"
                ? "volcano"
                : "orange";
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
                    key: "revoke",
                    icon: <EyeOutlined />,
                    label: "Mark as Paid",
                    disabled: record.status === "Approved",
                    onClick: () =>
                      message.success(
                        `Fine ${record.fineNumber} marked as paid.`,
                      ),
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
    [token],
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

      <ParkonicViewDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        record={selectedRecord}
      />
    </Space>
  );
};

export default ParkonicPage;
