import React, { useEffect, useState, useMemo } from "react";
import { Table, Card, Space, Tag, Button, Tooltip, Dropdown, App, Input, DatePicker } from "antd";
import {
  AppstoreOutlined,
  DownloadOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  MoreOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { usePage } from "../contexts/PageContext";
import { useTranslation } from "react-i18next";

const { RangePicker } = DatePicker;

interface FineRecord {
  id: string;
  fineNumber: string;
  inspectorDeviceNumber: string;
  assignedArea: string;
  fineType: string;
  fineAmount: number;
  status: "Issued" | "Paid" | "Disputed";
}

const ParkonicPage: React.FC = () => {
  const { t } = useTranslation();
  const { setPageTitle } = usePage();
  const { message, modal } = App.useApp();

  const [tableData, setTableData] = useState<FineRecord[]>([]);
  const [filteredData, setFilteredData] = useState<FineRecord[]>([]);
  const [tableSize, setTableSize] = useState<"small" | "middle">("middle");

  useEffect(() => {
    setPageTitle(t("page.title.parkonic"));

    const data: FineRecord[] = [
      {
        id: "1",
        fineNumber: "FINE2023001",
        inspectorDeviceNumber: "DEV-001",
        assignedArea: "Downtown Area",
        fineType: "Illegal Parking",
        fineAmount: 500,
        status: "Issued",
      },
    ];

    setTableData(data);
    setFilteredData(data);
  }, [setPageTitle, t]);

  const handleViewDetails = (record: FineRecord) => {
    message.info(`Viewing details for ${record.fineNumber}`);
  };

  const handleMarkAsPaid = (record: FineRecord) => {
    modal.confirm({
      title: "Confirm Payment",
      content: `Mark fine ${record.fineNumber} as paid?`,
      onOk: () => {
        message.success(`Fine ${record.fineNumber} marked as paid.`);
      },
    });
  };

  const handleGlobalSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    const filtered = tableData.filter(
      (item) =>
        item.fineNumber.toLowerCase().includes(value) || item.inspectorDeviceNumber.toLowerCase().includes(value),
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

  const columns: ColumnsType<FineRecord> = useMemo(
    () => [
      {
        title: t("form.fineNumber"),
        dataIndex: "fineNumber",
        key: "fineNumber",
        width: 160,
        ellipsis: true,
      },
      {
        title: t("form.issuedBy"),
        dataIndex: "inspectorDeviceNumber",
        key: "inspectorDeviceNumber",
        width: 160,
        ellipsis: true,
      },
      {
        title: t("form.issuedAmount"),
        dataIndex: "fineAmount",
        key: "fineAmount",
        width: 160,
        render: (amount) => <span style={{ fontWeight: "bold" }}>AED {amount.toFixed(2)}</span>,
        sorter: (a, b) => a.fineAmount - b.fineAmount,
      },
      {
        title: t("form.status"),
        dataIndex: "status",
        key: "status",
        width: 130,
        render: (status) => {
          const colorMap = {
            Issued: "orange",
            Paid: "green",
            Disputed: "red",
          } as const;
          return <Tag color={colorMap[status]}>{status}</Tag>;
        },
      },
      {
        title: "",
        key: "actions",
        width: 100,
        align: "center",
        render: (_, record) => (
          <Space size="small">
            <Tooltip title="View on map">
              <Button icon={<EnvironmentOutlined />} type="text" onClick={() => handleViewDetails(record)} />
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
                    key: "markPaid",
                    icon: <EyeOutlined />,
                    label: "Mark as Paid",
                    disabled: record.status !== "Issued",
                    onClick: () => handleMarkAsPaid(record),
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
              placeholder="Search fines..."
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
          rowKey="id"
          rowSelection={{ type: "checkbox" }}
          columns={columns}
          dataSource={filteredData}
          size={tableSize}
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
    </Space>
  );
};

export default ParkonicPage;
