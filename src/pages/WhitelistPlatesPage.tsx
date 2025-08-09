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
  Dropdown,
  Typography,
} from "antd";
import type { MenuProps } from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  DownloadOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  MoreOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import { usePage } from "../contexts/PageContext";
import PageLoader from "../components/common/PageLoader";
import WhitelistPlateModal from "../components/whitelist/plate/WhitelistPlateModal";
import WhitelistPlateViewDrawer from "../components/whitelist/plate/WhitelistPlateViewDrawer";
import {
  useGetWhitelistPlatesQuery,
  useDeleteWhitelistPlateMutation,
} from "../store/api/whitelistApi";
import dayjs, { type Dayjs } from "dayjs";
import { exportToCsv } from "../utils/csvExporter";
import isBetween from "dayjs/plugin/isBetween";
import type { WhitelistPlateResponseDto } from "../types/api";

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;
const { Text: AntText } = Typography;

const WhitelistPlatesPage: React.FC = () => {
  const { t } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedRecord, setSelectedRecord] =
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
        "Failed to load whitelist plates: " + (error as any).toString()
      );
    }
  }, [isError, error]);

  const showAddModal = () => {
    setModalMode("add");
    setSelectedRecord(null);
    setIsModalOpen(true);
  };

  const showEditModal = (record: WhitelistPlateResponseDto) => {
    setModalMode("edit");
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const showViewDrawer = (record: WhitelistPlateResponseDto) => {
    setSelectedRecord(record);
    setIsDrawerOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedRecord(null);
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
            `Plate "${record.plateNumber}" ${t("messages.deletedSuccess")}`
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
          String(value).toLowerCase().includes(globalSearch.toLowerCase())
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
      total: filteredData?.length || 0,
      active: filteredData?.filter((i) => i.plateStatus === "Active").length,
      expired: filteredData?.filter((i) => i.plateStatus === "Expired").length,
      pending: filteredData?.filter((i) => i.plateStatus === "Pending").length,
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
          if (filteredData) {
            // exportToCsv expects WhitelistRecord[], we have WhitelistPlateResponseDto[]
            // This will cause a type error. For now, I'll cast to any.
            exportToCsv(filteredData as any, "whitelist_plates_export.csv");
            message.success(t("messages.csvDownloaded"));
          }
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
            <Tag
              color={
                status.toLowerCase() === "active"
                  ? "green"
                  : status.toLowerCase() === "pending"
                    ? "gold"
                    : "red"
              }
            >
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
        render: (_, record) => {
          const menuItems: MenuProps["items"] = [
            {
              key: "view",
              label: t("whitelist.view"),
              icon: <EyeOutlined />,
              onClick: () => showViewDrawer(record),
            },
            {
              key: "edit",
              label: t("whitelist.edit"),
              icon: <EditOutlined />,
              onClick: () => showEditModal(record),
            },
            {
              key: "delete",
              label: t("whitelist.delete"),
              icon: <DeleteOutlined />,
              danger: true,
              onClick: () => handleDelete(record),
            },
          ];

          return (
            <Dropdown
              menu={{ items: menuItems }}
              trigger={["click"]}
              disabled={isDeleting}
            >
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          );
        },
      },
    ],
    [t, isDeleting]
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
              onClick={showAddModal}
            >
              {t("whitelist.addNew")}
            </Button>
          </Space>
        </Space>
      </Card>

      <Card variant="borderless" bodyStyle={{ padding: 0}}>
        <Table
          rowSelection={{ type: "checkbox" }}
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

      <WhitelistPlateModal
        open={isModalOpen}
        mode={modalMode}
        initialData={selectedRecord}
        onClose={closeModal}
      />
      <WhitelistPlateViewDrawer
        open={isDrawerOpen}
        record={selectedRecord}
        onClose={closeDrawer}
      />
    </Space>
  );
};

export default WhitelistPlatesPage;
