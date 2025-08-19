import React, { useEffect, useState, useMemo } from "react";
import { Table, Card, Space, Tag, Button, Dropdown, App, Input, DatePicker, notification } from "antd";
import {
  EyeOutlined,
  MoreOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  DownloadOutlined,
  CarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { usePage } from "../contexts/PageContext";
import { useTranslation } from "react-i18next";
import { useLazySearchParkonicsQuery } from "../services/rtkApiFactory";
import ParkonicViewDrawer from "../components/parkonic/ParkonicViewDrawer";
import StatsGroup from "../components/common/StatsGroup";

const { RangePicker } = DatePicker;

interface ParkonicRecord {
  id: string;
  fineId: string;
  plateNumber: string;
  area: string;
  reviewStatus: number;
  entryDateTime: string;
  exitDateTime: string;
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

  useEffect(() => {
    setPageTitle(t("page.title.parkonic"));
    searchParkonics({});
  }, [searchParkonics, setPageTitle, t]);

  useEffect(() => {
    if (data) {
      setTableData(data);
      setFilteredData(data);

      // ✅ Auto-open drawer if ?view=fineId in URL
      const params = new URLSearchParams(window.location.search);
      const viewId = params.get("view");
      if (viewId) {
        const found = data.find((x) => x.fineId === viewId);
        if (found) {
          setSelectedRecord(found);
          setDrawerOpen(true);
          notification.info({
            message: "Opened Shared Record",
            description: `Viewing shared record ${viewId}`,
          });

          // ✅ Remove ?view= param from URL so refresh doesn’t keep reopening
          params.delete("view");
          window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
        }
      }
    }
  }, [data]);

  const statsConfig = useMemo(
    () => [
      {
        title: "Total Records",
        value: (d: ParkonicRecord[]) => d.length,
        icon: <CarOutlined />,
        color: "#000",
      },
      {
        title: "Approved",
        value: (d: ParkonicRecord[]) => d.filter((x) => x.reviewStatus === 1).length,
        icon: <CheckCircleOutlined />,
        color: "green",
      },
      {
        title: "Rejected",
        value: (d: ParkonicRecord[]) => d.filter((x) => x.reviewStatus === 0).length,
        icon: <CloseCircleOutlined />,
        color: "red",
      },
    ],
    [],
  );

  const handleGlobalSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    const filtered = tableData.filter(
      (item) =>
        (item.plateNumber?.toLowerCase() || "").includes(value) || (item.area?.toLowerCase() || "").includes(value),
    );
    setFilteredData(filtered);
  };

  const handleDateFilter = (dates: any) => {
    if (!dates || dates.length === 0) {
      setFilteredData(tableData);
      return;
    }
    message.info(`Filtering from ${dates[0].format("YYYY-MM-DD")} to ${dates[1].format("YYYY-MM-DD")}`);
  };

  const showDrawer = (record: ParkonicRecord) => {
    setSelectedRecord(record);
    setDrawerOpen(true);
  };

  const columns: ColumnsType<ParkonicRecord> = useMemo(
    () => [
      {
        title: t("form.vehicleNumber"),
        dataIndex: "plateNumber",
        key: "plateNumber",
      },
      {
        title: t("form.reviewStatus"),
        dataIndex: "reviewStatus",
        key: "reviewStatus",
        render: (status: number) => {
          const labelMap = { 0: "Rejected", 1: "Approved" } as const;
          const colorMap = { 0: "red", 1: "green" } as const;
          return <Tag color={colorMap[status] || "blue"}>{labelMap[status] || "Unknown"}</Tag>;
        },
        filters: [
          { text: "Approved", value: 1 },
          { text: "Rejected", value: 0 },
        ],
        onFilter: (value, record) => record.reviewStatus === value,
      },
      {
        title: t("form.entryDateTime"),
        dataIndex: "entryDateTime",
        key: "entryDateTime",
      },
      {
        title: t("form.exitDateTime"),
        dataIndex: "exitDateTime",
        key: "exitDateTime",
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
                    label: "View",
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
      <StatsGroup config={statsConfig} data={filteredData} loading={isLoading} />

      {/* Filters */}
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
            <Button
              icon={tableSize === "middle" ? <AppstoreOutlined /> : <UnorderedListOutlined />}
              type="text"
              onClick={() => setTableSize(tableSize === "middle" ? "small" : "middle")}
            />
          </Space>
          <Button icon={<DownloadOutlined />}>{t("common.downloadCsv")}</Button>
        </Space>
      </Card>

      {/* Table */}
      <Card bordered={false} bodyStyle={{ padding: "5px 5px 0 5px" }}>
        <Table
          rowSelection={{ type: "checkbox" }}
          rowKey={(record) => record.id || record.fineId} 
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
