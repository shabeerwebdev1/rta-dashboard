import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Button,
  Space,
  Card,
  message,
  Tag,
  App,
  Tooltip,
  Input,
  DatePicker,
  Badge,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  DownloadOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import { usePage } from "../contexts/PageContext";
import PageLoader from "../components/common/PageLoader";
import WhitelistPlateDrawer from "../components/whitelist/plate/WhitelistPlateDrawer";
import {
  useGetWhitelistPlatesQuery,
  useDeleteWhitelistPlateMutation,
} from "../store/api/whitelistApi";
import dayjs, { type Dayjs } from "dayjs";
import { exportToCsv } from "../utils/csvExporter";
import isBetween from "dayjs/plugin/isBetween";
import type { WhitelistPlateResponseDto } from "../types/api";
import { Typography } from "antd";

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;
const { Text: AntText } = Typography;

const WhitelistPlatesPage: React.FC = () => {
  const { t } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"add" | "edit">("add");
  const [editingRecord, setEditingRecord] =
    useState<WhitelistPlateResponseDto | null>(null);

  const [tableSize, setTableSize] = useState<"middle" | "small">("middle");
  const [globalSearch, setGlobalSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const {
    data: plates,
    isLoading,
    isError,
    error,
  } = useGetWhitelistPlatesQuery();
  const [deletePlate, { isLoading: isDeleting }] =
    useDeleteWhitelistPlateMutation();

  useEffect(() => {
    setPageTitle(t("whitelist.plate.title"));
  }, [setPageTitle, t]);

  useEffect(() => {
    if (isError) {
      message.error(
        "Failed to load whitelist plates: " + (error as any).toString(),
      );
    }
  }, [isError, error]);

  const showAddDrawer = () => {
    setDrawerMode("add");
    setEditingRecord(null);
    setIsDrawerOpen(true);
  };

  const showEditDrawer = (record: WhitelistPlateResponseDto) => {
    setDrawerMode("edit");
    setEditingRecord(record);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingRecord(null);
  };

  const handleDelete = (record: WhitelistPlateResponseDto) => {
    modal.confirm({
      title: t("messages.confirmDeleteTitle"),
      content: `${t("messages.confirmDeleteContent")} plate "${record.plateNumber}"?`,
      okText: t("common.delete"),
      okType: "danger",
      cancelText: t("common.cancel"),
      onOk: async () => {
        try {
          await deletePlate(record.id).unwrap();
          message.success(
            `Plate "${record.plateNumber}" ${t("messages.deletedSuccess")}`,
          );
        } catch (err) {
          message.error(`Failed to delete plate: ${err}`);
        }
      },
    });
  };

  const filteredData = useMemo(() => {
    return plates
      ?.filter((item) => {
        if (!globalSearch) return true;
        return Object.values(item).some((value) =>
          String(value).toLowerCase().includes(globalSearch.toLowerCase()),
        );
      })
      .filter((item) => {
        if (!dateFilter || !dateFilter[0] || !dateFilter[1]) return true;
        const itemDate = dayjs(item.toDate);
        return itemDate.isBetween(dateFilter[0], dateFilter[1], null, "[]");
      });
  }, [plates, globalSearch, dateFilter]);
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
              <AntText strong>{t("messages.totalEntries")}:</AntText>{" "}
              {stats.total}
            </li>
            <li>
              <AntText strong>{t("messages.active")}:</AntText> {stats.active}
            </li>
            <li>
              <AntText strong>{t("messages.expired")}:</AntText> {stats.expired}
            </li>
            <li>
              <AntText strong>{t("messages.pending")}:</AntText> {stats.pending}
            </li>
          </ul>
        </div>
      ),
      okText: t("common.download"),
      cancelText: t("common.cancel"),
      onOk() {
        try {
          exportToCsv(filteredData, "whitelist_export.csv");
          message.success(t("messages.csvDownloaded"));
        } catch (error) {
          console.error("CSV Export Failed:", error);
          message.error("Failed to download CSV.");
        }
      },
    });
  };

  const columns: ColumnsType<WhitelistPlateResponseDto> = useMemo(
    () => [
      {
        title: t("form.plateNumber"),
        dataIndex: "plateNumber",
        key: "plateNumber",
      },
      {
        title: t("form.plateSource"),
        dataIndex: "plateSource",
        key: "plateSource",
      },
      { title: t("form.plateType"), dataIndex: "plateType", key: "plateType" },
      {
        title: t("form.plateColor"),
        dataIndex: "plateColor",
        key: "plateColor",
        render: (color) =>
          color ? <Badge color={color.toLowerCase()} text={color} /> : "-",
      },
      {
        title: t("form.endDate"),
        dataIndex: "toDate",
        key: "toDate",
        render: (date) => (date ? dayjs(date).format("DD MMMM, YYYY") : "-"),
      },
      {
        title: t("form.plateStatus"),
        dataIndex: "plateStatus",
        key: "plateStatus",
        render: (status) =>
          status ? (
            <Tag color={status.toLowerCase() === "active" ? "green" : "red"}>
              {status}
            </Tag>
          ) : (
            "-"
          ),
      },
      {
        title: t("common.action"),
        key: "action",
        fixed: "right",
        width: 100,
        align: "center",
        render: (_, record) => (
          <Space size="small">
            <Tooltip title={t("whitelist.edit")}>
              <Button
                icon={<EditOutlined />}
                type="text"
                onClick={() => showEditDrawer(record)}
              />
            </Tooltip>
            <Tooltip title={t("whitelist.delete")}>
              <Button
                icon={<DeleteOutlined />}
                type="text"
                danger
                loading={isDeleting}
                onClick={() => handleDelete(record)}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [t, isDeleting],
  );

  if (isLoading) return <PageLoader />;

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
              onSearch={(value) => setGlobalSearch(value)}
              onChange={(e) => setGlobalSearch(e.target.value)}
              allowClear
            />
            <RangePicker onChange={(dates) => setDateFilter(dates as any)} />
            <Tooltip
              title={tableSize === "middle" ? "Compact View" : "Standard View"}
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
              {t("common.download")}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={showAddDrawer}
            >
              {t("whitelist.addNew")}
            </Button>
          </Space>
        </Space>
      </Card>

      <Card variant="borderless" bodyStyle={{ padding: "10px 10px 0px 10px" }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          size={tableSize}
          scroll={{ x: 1000 }}
          pagination={{
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} ${t("common.items")}`,
          }}
        />
      </Card>

      <WhitelistPlateDrawer
        open={isDrawerOpen}
        mode={drawerMode}
        initialData={editingRecord}
        onClose={closeDrawer}
      />
    </Space>
  );
};

export default WhitelistPlatesPage;
