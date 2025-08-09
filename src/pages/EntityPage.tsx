import React, { useState, useMemo, useEffect } from "react";
import { Card, Space, App, Input, DatePicker, Button, Tooltip } from "antd";
import { DownloadOutlined, PlusOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { usePage } from "../contexts/PageContext";
import DynamicTable from "../components/dynamic/DynamicTable";
import DynamicFormModal from "../components/dynamic/DynamicFormModal";
import PageLoader from "../components/common/PageLoader";
import { exportToCsv } from "../utils/csvExporter";

import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import type { PageConfig } from "../types/config";
import { useAppNotification } from "../utils/notificationManager";

dayjs.extend(isBetween);

interface EntityPageProps {
  pageKey: string;
  config: PageConfig;
  useGetHook: () => any;
  useDeleteHook?: () => any;
}

const EntityPage: React.FC<EntityPageProps> = ({
  pageKey,
  config,
  useGetHook,
  useDeleteHook,
}) => {
  const { t } = useTranslation();
  const { setPageTitle } = usePage();
  const { modal } = App.useApp();
  const notification = useAppNotification();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [globalSearch, setGlobalSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<any>(null);

  const { data, isLoading, isError, error: getError } = useGetHook();
  const [deleteItem, { isLoading: isDeleting }] = useDeleteHook
    ? useDeleteHook()
    : [null, { isLoading: false }];

  useEffect(() => {
    setPageTitle(t(config.title));
  }, [setPageTitle, t, config.title]);

  const handleEdit = (record: any) => {
    setModalMode("edit");
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleDelete = (record: any) => {
    if (!deleteItem) return;
    modal.confirm({
      title: t("messages.deleteConfirmTitle", {
        entity: t(config.name.singular),
      }),
      content: t("messages.deleteConfirmContent", {
        entity: t(config.name.singular).toLowerCase(),
      }),
      okText: t("common.delete"),
      okType: "danger",
      cancelText: t("common.cancel"),
      onOk: async () => {
        try {
          const response = await deleteItem(record.id).unwrap();

          notification.success(
            response,
            t("messages.deleteSuccess", { entity: t(config.name.singular) }),
          );
        } catch (err) {
          notification.error(err as any, `Failed to delete`);
        }
      },
    });
  };

  const handleDownloadCsv = () => {
    if (selectedRowKeys.length === 0) {
      notification.error(
        { data: { en_Msg: t("messages.selectRows") } },
        t("messages.selectRows"),
      );
      return;
    }
    modal.confirm({
      title: t("messages.csvConfirmTitle"),
      content: t("messages.csvConfirmContent"),
      onOk: () => {
        const selectedData = filteredData.filter((item: any) =>
          selectedRowKeys.includes(item.id),
        );
        exportToCsv(selectedData, `${config.key}_export.csv`);
        notification.success(
          { data: { en_Msg: t("messages.csvDownloaded") } },
          t("messages.csvDownloaded"),
        );
        setSelectedRowKeys([]);
      },
    });
  };

  const filteredData = useMemo(() => {
    if (!data) return [];
    return (data as any[])
      .filter((item) => {
        if (!globalSearch) return true;
        const searchableValues = Object.values(item).join(" ").toLowerCase();
        return searchableValues.includes(globalSearch.toLowerCase());
      })
      .filter((item) => {
        if (!dateFilter || !dateFilter[0] || !dateFilter[1]) return true;
        const dateString =
          item.toDate || item.pledgeDate || item.reportedAt || item.issueDate;
        if (!dateString) return true;
        const itemDate = dayjs(dateString);
        if (!itemDate.isValid()) return true;
        return itemDate.isBetween(dateFilter[0], dateFilter[1], "day", "[]");
      });
  }, [data, globalSearch, dateFilter]);

  if (isLoading) return <PageLoader />;
  if (isError) {
    notification.error(getError as any, "Failed to load data");
    return <div>Error loading data. See notifications for details.</div>;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card bordered={false} className="page-header-card">
        <Space style={{ width: "100%", justifyContent: "space-between" }} wrap>
          <Space wrap>
            <Input.Search
              placeholder={t("common.searchPlaceholder")}
              onSearch={setGlobalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
            <DatePicker.RangePicker onChange={setDateFilter} />
          </Space>
          <Space>
            <Tooltip title={t("common.downloadCsv")}>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleDownloadCsv}
                disabled={selectedRowKeys.length === 0}
              />
            </Tooltip>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setModalMode("add");
                setSelectedRecord(null);
                setIsModalOpen(true);
              }}
            >
              {t("common.addNew")}
            </Button>
          </Space>
        </Space>
      </Card>
      <Card
        bordered={false}
        bodyStyle={{ padding: 0 }}
        className="page-content-card"
      >
        <DynamicTable
          config={config}
          data={filteredData}
          loading={isLoading || isDeleting}
          onEdit={handleEdit}
          onDelete={config.api.delete ? handleDelete : undefined}
          selectedRowKeys={selectedRowKeys}
          setSelectedRowKeys={setSelectedRowKeys}
        />
      </Card>
      {isModalOpen && (
        <DynamicFormModal
          pageKey={pageKey}
          mode={modalMode}
          open={isModalOpen}
          initialData={selectedRecord}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </Space>
  );
};

export default EntityPage;
