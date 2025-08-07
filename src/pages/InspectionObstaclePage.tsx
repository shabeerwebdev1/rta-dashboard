import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Input,
  Button,
  Space,
  Avatar,
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
import type { InspectionRecord } from "../types/inspection";
import AddInspectionModal from "../components/inspection/AddInspectionModal";
import { usePage } from "../contexts/PageContext";
import usePageLoader from "../hooks/usePageLoader";
import PageLoader from "../components/common/PageLoader";
import { exportToCsv } from "../utils/csvExporter";
import MapDrawer from "../components/inspection/InspectionViewDrawer";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { useToken } = theme;
const { Text } = Typography;

const getInitials = (name: string) => {
  const names = name.split(" ");
  const initials = names.map((n) => n[0]).join("");
  return initials.slice(0, 2).toUpperCase();
};

const InspectionObstaclePage: React.FC = () => {
  const { setPageTitle } = usePage();
  const pageLoading = usePageLoader();
  const { token } = useToken();
  const { message, modal } = App.useApp();

  const [tableData, setTableData] = useState<InspectionRecord[]>([]);
  const [filteredData, setFilteredData] = useState<InspectionRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<InspectionRecord | null>(
    null,
  );
  const [tableSize, setTableSize] = useState<"middle" | "small">("middle");

  useEffect(() => {
    setPageTitle("Inspection Obstacles");
    const data = [
      {
        key: "1",
        obstacleNumber: "OB0001237",
        area: "Area 1",
        zone: "Zone A",
        status: "Removed",
        date: "01-08-2025",
        addedBy: "Admin User",
        priority: false,
        comments: "",
        location: { lat: 25.2048, lng: 55.2708 },
      },
      {
        key: "2",
        obstacleNumber: "OB0001337",
        area: "Area 2",
        zone: "Zone B",
        status: "Active",
        date: "01-08-2025",
        addedBy: "Inspector 1",
        priority: false,
        comments: "",
        location: { lat: 25.2048, lng: 55.2708 },
      },
      {
        key: "3",
        obstacleNumber: "OB0001437",
        area: "Area 3",
        zone: "Zone C",
        status: "Removed",
        date: "01-08-2025",
        addedBy: "Admin User",
        priority: false,
        comments: "",
        location: { lat: 25.2048, lng: 55.2708 },
      },
      {
        key: "4",
        obstacleNumber: "OB0001537",
        area: "Area 4",
        zone: "Zone A",
        status: "Active",
        date: "01-08-2025",
        addedBy: "Inspector 2",
        priority: false,
        comments: "",
        location: { lat: 25.2048, lng: 55.2708 },
      },
      {
        key: "5",
        obstacleNumber: "OB0001637",
        area: "Area 5",
        zone: "Zone B",
        status: "Removed",
        date: "01-08-2025",
        addedBy: "Inspector 1",
        priority: false,
        comments: "",
        location: { lat: 25.2048, lng: 55.2708 },
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
      const itemDate = dayjs(item.date, "DD-MM-YYYY");
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
      removed: filteredData.filter((i) => i.status === "Removed").length,
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
              <Text strong>Removed:</Text> {stats.removed}
            </li>
          </ul>
        </div>
      ),
      okText: "Download",
      cancelText: "Cancel",
      onOk() {
        try {
          exportToCsv(filteredData, "inspection_export.csv");
          message.success("CSV downloaded successfully.");
        } catch (error) {
          console.error("CSV Export Failed:", error);
          message.error("Failed to download CSV.");
        }
      },
    });
  };

  const handleViewMap = (record: InspectionRecord) => {
    setSelectedRecord(record);
    setIsDrawerOpen(true);
  };

  const handleRemove = (record: InspectionRecord) => {
    modal.confirm({
      title: "Confirm Removal",
      content: `Are you sure you want to mark obstacle ${record.obstacleNumber} as removed?`,
      okText: "Yes, Remove",
      cancelText: "Cancel",
      onOk: () => {
        message.success("Obstacle marked as removed.");
      },
    });
  };

  const columns: ColumnsType<InspectionRecord> = useMemo(
    () => [
      {
        title: "Obstacle Number",
        dataIndex: "obstacleNumber",
        key: "obstacleNumber",
        width: 150,
        ellipsis: true,
        sorter: (a, b) => a.obstacleNumber.localeCompare(b.obstacleNumber),
      },
      {
        title: "Area",
        dataIndex: "area",
        key: "area",
        width: 150,
        ellipsis: true,
        sorter: (a, b) => a.area.localeCompare(b.area),
      },
      {
        title: "Zone",
        dataIndex: "zone",
        key: "zone",
        width: 120,
        ellipsis: true,
        sorter: (a, b) => a.zone.localeCompare(b.zone),
      },
      {
        title: "Added By",
        dataIndex: "addedBy",
        key: "addedBy",
        width: 150,
        ellipsis: true,
        sorter: (a, b) => a.addedBy.localeCompare(b.addedBy),
        render: (name: string) => (
          <Space>
            <Avatar
              style={{
                backgroundColor: token.colorPrimary,
                verticalAlign: "middle",
              }}
            >
              {getInitials(name)}
            </Avatar>
            <Text>{name}</Text>
          </Space>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 110,
        align: "center",
        filters: [
          { text: "Active", value: "Active" },
          { text: "Removed", value: "Removed" },
        ],
        onFilter: (value, record) => record.status === value,
        render: (status: string) => {
          const color = status === "Active" ? "red" : "green";
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
                onClick={() => handleViewMap(record)}
              />
            </Tooltip>
            <Dropdown
              menu={{
                items: [
                  {
                    key: "view",
                    icon: <EyeOutlined />,
                    label: "View Details",
                    onClick: () => handleViewMap(record),
                  },
                  {
                    key: "remove",
                    icon: <EyeOutlined />,
                    label: "Remove Obstacle",
                    onClick: () => handleRemove(record),
                    disabled: record.status === "Resolved",
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
      const newRecord: InspectionRecord = {
        key: Date.now().toString(),
        obstacleNumber: `OB000${1000 + tableData.length}`,
        area: values.area,
        zone: values.zone,
        status: "Active",
        date: new Date().toLocaleDateString(),
        addedBy: "Current User",
        priority: !!values.priority,
        comments: values.comments || "",
        location: {
          lat: 25.2048 + (Math.random() - 0.5) * 0.1,
          lng: 55.2708 + (Math.random() - 0.5) * 0.1,
        },
      };
      setTableData([newRecord, ...tableData]);
      setFilteredData([newRecord, ...tableData]);
      setIsSubmitting(false);
      setIsModalOpen(false);
      message.success("Obstacle added successfully.");
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
              placeholder="Search obstacles..."
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

      <AddInspectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />
      <MapDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        record={selectedRecord}
      />
    </Space>
  );
};

export default InspectionObstaclePage;
