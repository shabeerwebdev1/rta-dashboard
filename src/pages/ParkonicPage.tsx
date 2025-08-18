import React, { useEffect, useState, useMemo } from "react";
import { Table, Card, Space, Tag, Button, Dropdown, Input, DatePicker } from "antd";
import { EyeOutlined, MoreOutlined, DownloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { usePage } from "../contexts/PageContext";
import { useTranslation } from "react-i18next";
import { useSearchParkonicsQuery } from "../services/rtkApiFactory";
import useTableParams from "../hooks/useTableParams";
import ParkonicViewDrawer from "../components/parkonic/ParkonicViewDrawer";

const { RangePicker } = DatePicker;

const ParkonicPage: React.FC = () => {
  const { t } = useTranslation();
  const { setPageTitle } = usePage();
  const { apiParams, handleTableChange, setSearchFilters } = useTableParams();

  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, isLoading, isFetching } = useSearchParkonicsQuery(apiParams, {
    refetchOnMountOrArgChange: true,
  });

  const tableData = data?.data || [];
  const totalRecords = data?.total || 0;

  useEffect(() => {
    setPageTitle(t("page.title.parkonic"));
  }, [setPageTitle, t]);

  const handleGlobalSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchFilters({ searchTerm: e.target.value });
  };

  const handleDateFilter = (dates: any) => {
    setSearchFilters({
      ...apiParams.filters,
      dateFrom: dates ? dates[0].toISOString() : undefined,
      dateTo: dates ? dates[1].toISOString() : undefined,
    });
  };

  const showDrawer = (record: any) => {
    setSelectedRecord(record);
    setDrawerOpen(true);
  };

  const columns: ColumnsType<any> = useMemo(
    () => [
      {
        title: t("form.vehicleNumber"),
        dataIndex: "plateNumber",
        key: "plateNumber",
        sorter: true,
      },
      {
        title: t("form.reviewStatus"),
        dataIndex: "reviewStatus",
        key: "reviewStatus",
        sorter: true,
        render: (status: number) => {
          const statusMap: Record<number, { text: string; color: string }> = {
            0: { text: "Rejected", color: "red" },
            1: { text: "Approved", color: "green" },
            2: { text: "Pending", color: "blue" },
          };
          const { text, color } = statusMap[status] || { text: "Unknown", color: "default" };
          return <Tag color={color}>{text}</Tag>;
        },
      },
      {
        title: t("form.entryDateTime"),
        dataIndex: "entryDateTime",
        key: "entryDateTime",
        sorter: true,
      },
      {
        title: t("form.exitDateTime"),
        dataIndex: "exitDateTime",
        key: "exitDateTime",
        sorter: true,
      },
      {
        title: t("common.action"),
        key: "actions",
        width: 100,
        align: "center",
        render: (_, record) => (
          <Dropdown
            menu={{
              items: [
                {
                  key: "view",
                  icon: <EyeOutlined />,
                  label: t("common.view"),
                  onClick: () => showDrawer(record),
                },
              ],
            }}
            trigger={["click"]}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        ),
      },
    ],
    [t],
  );

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card bordered={false}>
        <Space wrap style={{ width: "100%", justifyContent: "space-between" }} size="middle">
          <Space wrap size="middle">
            <Input.Search
              placeholder={t("common.searchPlaceholder")}
              style={{ minWidth: "300px" }}
              onSearch={(value) => setSearchFilters({ searchTerm: value })}
              onChange={handleGlobalSearch}
              allowClear
            />
            <RangePicker onChange={handleDateFilter} />
          </Space>
          <Button icon={<DownloadOutlined />}>{t("common.downloadCsv")}</Button>
        </Space>
      </Card>

      <Card bordered={false} bodyStyle={{ padding: "5px 5px 0 5px" }}>
        <Table
          rowSelection={{ type: "checkbox" }}
          rowKey="fineId"
          columns={columns}
          dataSource={tableData}
          loading={isLoading || isFetching}
          onChange={handleTableChange}
          pagination={{
            current: apiParams.PageNumber,
            pageSize: apiParams.PageSize,
            total: totalRecords,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} ${t("common.items")}`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <ParkonicViewDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} record={selectedRecord} />
    </Space>
  );
};

export default ParkonicPage;