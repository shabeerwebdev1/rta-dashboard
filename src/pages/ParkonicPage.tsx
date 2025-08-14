import React, { useEffect, useState, useMemo } from "react";
import { Table, Card, Space, Tag, Button, Tooltip, Dropdown, App, Input, DatePicker } from "antd";
import {
  EyeOutlined,
  MoreOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { usePage } from "../contexts/PageContext";
import { useTranslation } from "react-i18next";
import { useLazySearchParkonicsQuery } from "../services/rtkApiFactory";
import ParkonicViewDrawer from "../components/parkonic/ParkonicViewDrawer";

const { RangePicker } = DatePicker;

interface ParkonicRecord {
  id: string;
  vehicleNumber: string;
  area: string;
  status: string;
  issuedAt: string;
}

const ParkonicPage: React.FC = () => {
  const { t } = useTranslation();
  const { setPageTitle } = usePage();
  const { message } = App.useApp();

  const [tableData, setTableData] = useState<ParkonicRecord[]>([]);
  const [filteredData, setFilteredData] = useState<ParkonicRecord[]>([]);
  const [tableSize, setTableSize] = useState<"small" | "middle">("middle");
  const [selectedRecord, setSelectedRecord] = useState<ParkonicRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [searchParkonics, { data, isLoading }] = useLazySearchParkonicsQuery();

  // Fetch data on mount
  useEffect(() => {
    setPageTitle(t("page.title.parkonic"));
    searchParkonics({});
  }, [searchParkonics, setPageTitle, t]);

  // Update table when API data changes
  useEffect(() => {
    if (data) {
      setTableData(data);
      setFilteredData(data);
    }
  }, [data]);

  // Global search
  const handleGlobalSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    const filtered = tableData.filter(
      (item) => item.vehicleNumber.toLowerCase().includes(value) || item.area.toLowerCase().includes(value),
    );
    setFilteredData(filtered);
  };

  // Date filter (placeholder)
  const handleDateFilter = (dates: any) => {
    if (!dates || dates.length === 0) {
      setFilteredData(tableData);
      return;
    }
    message.info(`Filtering from ${dates[0].format("YYYY-MM-DD")} to ${dates[1].format("YYYY-MM-DD")}`);
  };

  // Show drawer
  const showDrawer = (record: ParkonicRecord) => {
    setSelectedRecord(record);
    setDrawerOpen(true);
  };

  // Table columns
  const columns: ColumnsType<ParkonicRecord> = useMemo(
    () => [
      {
        title: t("form.vehicleNumber"),
        dataIndex: "plateNumber",
        key: "vehicleNumber",
      },

      {
        title: t("form.reviewStatus"),
        dataIndex: "reviewStatus",
        key: "reviewStatus",
        render: (status: number) => {
          const labelMap = {
            0: "Rejected",
            1: "Approved",
          } as const;

          const colorMap = {
            0: "red",
            1: "green",
          } as const;

          return <Tag color={colorMap[status] || "blue"}>{labelMap[status] || "Unknown"}</Tag>;
        },
      },
      {
        title: t("form.entryDateTime"),
        dataIndex: "entryDateTime",
        key: "issuedAt",
      },
      {
        title: t("form.exitDateTime"),
        dataIndex: "exitDateTime",
        key: "area",
      },
      {
        title: "",
        key: "actions",
        width: 100,
        align: "center",
        fixed: "left",
        render: (_, record) => (
          <Space size="small">
            <Dropdown
              menu={{
                items: [
                  {
                    key: "view",
                    icon: <EyeOutlined />,
                    label: "View ",
                    onClick: () => showDrawer(record),
                  },
                ],
              }}
              trigger={["click"]}
            >
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        ),
      },
    ],
    [t],
  );

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card variant="borderless">
        <Space wrap style={{ width: "100%", justifyContent: "space-between" }} size="middle">
          <Space wrap size="middle">
            <Input.Search
              placeholder="Search..."
              style={{ minWidth: "300px" }}
              onChange={handleGlobalSearch}
              allowClear
            />
            <RangePicker onChange={handleDateFilter} />
            <Tooltip title={tableSize === "middle" ? "Compact view" : "Standard view"}>
              <Button
                icon={tableSize === "middle" ? <AppstoreOutlined /> : <UnorderedListOutlined />}
                type="text"
                onClick={() => setTableSize(tableSize === "middle" ? "small" : "middle")}
              />
            </Tooltip>
          </Space>
          <Button icon={<DownloadOutlined />}>{t("common.downloadCsv")}</Button>
        </Space>
      </Card>

      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Table
          rowSelection={{ type: "checkbox" }}
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          size={tableSize}
          loading={isLoading}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          }}
          scroll={{ x: 1000 }}
          sticky={{ offsetHeader: 64 }}
        />
      </Card>

      {/* Drawer */}
      <ParkonicViewDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} record={selectedRecord} />
    </Space>
  );
};

export default ParkonicPage;
