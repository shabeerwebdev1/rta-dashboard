/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Input,
  DatePicker,
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
} from "antd";
import {
  PlusOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FilterOutlined,
  MoreOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import { usePage } from "../contexts/PageContext";
import usePageLoader from "../hooks/usePageLoader";
import PageLoader from "../components/common/PageLoader";
import { generateWhitelistData } from "../utils/mockData";
import { exportToCsv } from "../utils/csvExporter";
import MapDrawer from "../components/whitelist/MapDrawer";
import dayjs from "dayjs";
import AddWhitelistModal from "../components/whitelist/AddWhitelistModal";

const { RangePicker } = DatePicker;
const { useToken } = theme;
const { Text } = Typography;

interface WhitelistRecord {
  key: string;
  tradeLicenseName: string;
  licenseNumber: string;
  date: string;
  status: "Active" | "Expired" | "Pending";
  type: string;
  addedBy: string;
  location: {
    lat: number;
    lng: number;
  };
  priority?: boolean;
}

const getInitials = (name: string) => {
  const names = name.split(" ");
  const initials = names.map((n) => n[0]).join("");
  return initials.slice(0, 2).toUpperCase();
};

const PlatePage: React.FC = () => {
  const { t } = useTranslation();
  const { setPageTitle } = usePage();
  const pageLoading = usePageLoader();
  const { token } = useToken();
  const { message, modal } = App.useApp();

  const [tableData, setTableData] = useState<WhitelistRecord[]>([]);
  const [filteredData, setFilteredData] = useState<WhitelistRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<WhitelistRecord | null>(
    null
  );
  const [tableSize, setTableSize] = useState<"middle" | "small">("middle");

  useEffect(() => {
    setPageTitle(t("sidebar.addPlate"));
    const allData = generateWhitelistData(50);
    const plateData = allData.filter((item) => item.type === "Plate");
    setTableData(plateData);
    setFilteredData(plateData);
  }, [setPageTitle, t]);

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
      expired: filteredData.filter((i) => i.status === "Expired").length,
      pending: filteredData.filter((i) => i.status === "Pending").length,
    };

    modal.confirm({
      title: t("messages.csvConfirmTitle"),
      icon: <DownloadOutlined />,
      content: (
        <div>
          <p>{t("messages.csvConfirmContent")}</p>
          <ul>
            <li>
              <Text strong>{t("messages.totalEntries")}:</Text> {stats.total}
            </li>
            <li>
              <Text strong>{t("messages.active")}:</Text> {stats.active}
            </li>
            <li>
              <Text strong>{t("messages.expired")}:</Text> {stats.expired}
            </li>
            <li>
              <Text strong>{t("messages.pending")}:</Text> {stats.pending}
            </li>
          </ul>
        </div>
      ),
      okText: t("common.download"),
      cancelText: t("common.cancel"),
      onOk() {
        try {
          exportToCsv(filteredData, "plates_export.csv");
          message.success(t("messages.csvDownloaded"));
        } catch (error) {
          console.error("CSV Export Failed:", error);
          message.error("Failed to download CSV.");
        }
      },
    });
  };

  const handleDelete = (record: WhitelistRecord) => {
    modal.confirm({
      title: t("messages.confirmDeleteTitle"),
      content: `${t("messages.confirmDeleteContent")} "${record.tradeLicenseName}"?`,
      okText: t("common.delete"),
      okType: "danger",
      cancelText: t("common.cancel"),
      onOk() {
        message.success(
          `"${record.tradeLicenseName}" ${t("messages.deletedSuccess")}`
        );
        const newData = tableData.filter((item) => item.key !== record.key);
        setTableData(newData);
        setFilteredData(newData);
      },
    });
  };

  const handleViewMap = (record: WhitelistRecord) => {
    setSelectedRecord(record);
    setIsDrawerOpen(true);
  };

  const handleFormSubmit = (values: any) => {
    setIsSubmitting(true);
    setTimeout(() => {
      const newRecord: WhitelistRecord = {
        key: Date.now().toString(),
        tradeLicenseName: "Vehicle Owner", // You might want to add this field to your form
        licenseNumber: values.plateNumber,
        date: values.endDate,
        status: "Active",
        type: "Plate",
        addedBy: "Administrator",
        location: { lat: 25.2048, lng: 55.2708 },
        priority: values.priority || false,
      };
      setTableData([newRecord, ...tableData]);
      setFilteredData([newRecord, ...tableData]);
      setIsSubmitting(false);
      setIsModalOpen(false);
      message.success(t("messages.plateAdded"));
    }, 1500);
  };

  const columns: ColumnsType<WhitelistRecord> = useMemo(
    () => [
      {
        title: t("whitelist.platenumber"),
        dataIndex: "licenseNumber",
        key: "licenseNumber",
        width: 150,
        ellipsis: true,
        sorter: (a, b) => a.licenseNumber.localeCompare(b.licenseNumber),
        filterDropdown: ({
          setSelectedKeys,
          selectedKeys,
          confirm,
          clearFilters,
        }) => (
          <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
            <Input
              placeholder={t("common.search")}
              value={selectedKeys[0]}
              onChange={(e) =>
                setSelectedKeys(e.target.value ? [e.target.value] : [])
              }
              onPressEnter={() => confirm()}
              style={{ marginBottom: 8, display: "block" }}
            />
            <Space>
              <Button
                type="primary"
                onClick={() => confirm()}
                icon={<FilterOutlined />}
                size="small"
                style={{ width: 90 }}
              >
                {t("common.filter")}
              </Button>
              <Button
                onClick={() => clearFilters && clearFilters()}
                size="small"
                style={{ width: 90 }}
              >
                {t("common.reset")}
              </Button>
            </Space>
          </div>
        ),
        filterIcon: (filtered: boolean) => (
          <FilterOutlined
            style={{ color: filtered ? token.colorPrimary : undefined }}
          />
        ),
        onFilter: (value, record) =>
          record.licenseNumber
            .toLowerCase()
            .includes((value as string).toLowerCase()),
      },
      {
        title: t("whitelist.vehicleowner"),
        dataIndex: "tradeLicenseName",
        key: "tradeLicenseName",
        width: 150,
        ellipsis: true,
        sorter: (a, b) => a.tradeLicenseName.localeCompare(b.tradeLicenseName),
      },
      {
        title: t("whitelist.addedBy"),
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
        title: t("whitelist.date"),
        dataIndex: "date",
        key: "date",
        width: 120,
        align: "center",
        sorter: (a, b) =>
          dayjs(a.date, "DD-MM-YYYY").unix() -
          dayjs(b.date, "DD-MM-YYYY").unix(),
      },
      {
        title: t("whitelist.status"),
        dataIndex: "status",
        key: "status",
        width: 110,
        align: "center",
        filters: [
          { text: "Active", value: "Active" },
          { text: "Expired", value: "Expired" },
          { text: "Pending", value: "Pending" },
        ],
        onFilter: (value, record) => record.status === value,
        render: (status: string) => {
          const color =
            status === "Active"
              ? "green"
              : status === "Expired"
                ? "red"
                : "gold";
          return <Tag color={color}>{t(`status.${status.toLowerCase()}`)}</Tag>;
        },
      },
      {
        title: "",
        key: "action",
        fixed: "right",
        width: 90,
        align: "center",
        render: (_, record) => (
          <Space size="small">
            <Dropdown
              menu={{
                items: [
                  {
                    key: "view",
                    icon: <EyeOutlined />,
                    label: t("whitelist.view"),
                    onClick: () => handleViewMap(record),
                  },
                  {
                    key: "edit",
                    icon: <EditOutlined />,
                    label: t("whitelist.edit"),
                  },
                  {
                    key: "delete",
                    icon: <DeleteOutlined />,
                    label: t("whitelist.delete"),
                    danger: true,
                    onClick: () => handleDelete(record),
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
    [t, token]
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
              placeholder={t("whitelist.searchPlaceholder")}
              style={{ minWidth: "300px" }}
              onChange={handleGlobalSearch}
              allowClear
            />
            <RangePicker onChange={handleDateFilter} />
            <Tooltip
              title={
                tableSize === "middle"
                  ? t("whitelist.compactView")
                  : t("whitelist.standardView")
              }
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
              {t("whitelist.downloadCsv")}
            </Button>
            <Button type="primary" onClick={() => setIsModalOpen(true)}>
              {t("whitelist.addplate")}
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
              `${range[0]}-${range[1]} of ${total} ${t("common.items")}`,
            defaultPageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
          }}
        />
      </Card>

      <AddWhitelistModal
        type="plate" // No possibility of null, we ensure it's always "plate" or "trade"
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

export default PlatePage;
