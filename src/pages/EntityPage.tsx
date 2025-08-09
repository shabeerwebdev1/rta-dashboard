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
  useGetHook: () => {
    data: unknown;
    isLoading: boolean;
    isError: boolean;
    error: unknown;
  };
  useDeleteHook?: () => [((id: string | number) => { unwrap: () => Promise<unknown> }) | null, { isLoading: boolean }];
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
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [globalSearch, setGlobalSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const { data, isLoading, isError, error: getError } = useGetHook();
  const [deleteItem, { isLoading: isDeleting }] = useDeleteHook ? useDeleteHook() : [null, { isLoading: false }];

  useEffect(() => {
    setPageTitle(t(config.title));
  }, [setPageTitle, t, config.title]);

  const handleEdit = (record: Record<string, unknown>) => {
    setModalMode("edit");
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleDelete = (record: Record<string, unknown>) => {
    if (!deleteItem) return;
    modal.confirm({
      title: t("messages.deleteConfirmTitle", { entity: t(config.name.singular) }),
      content: t("messages.deleteConfirmContent", { entity: t(config.name.singular).toLowerCase() }),
      okText: t("common.delete"),
      okType: "danger",
      cancelText: t("common.cancel"),
      onOk: async () => {
        try {
          const response = await deleteItem(record.id as string | number).unwrap();

          notification.success(response, t("messages.deleteSuccess", { entity: t(config.name.singular) }));
        } catch (err) {
          notification.error(err as { data?: { en_Msg?: string; ar_Msg?: string } }, `Failed to delete`);
        }
      },
    });
  };

  const handleDownloadCsv = () => {
    if (selectedRowKeys.length === 0) {
      notification.error({ data: { en_Msg: t("messages.selectRows") } }, t("messages.selectRows"));
      return;
    }
    modal.confirm({
      title: t("messages.csvConfirmTitle"),
      content: t("messages.csvConfirmContent"),
      onOk: () => {
        const selectedData = filteredData.filter((item: Record<string, unknown>) => selectedRowKeys.includes(item.id as React.Key));
        exportToCsv(selectedData, `${config.key}_export.csv`);
        notification.success({ data: { en_Msg: t("messages.csvDownloaded") } }, t("messages.csvDownloaded"));
        setSelectedRowKeys([]);
      },
    });
  };

  const filteredData = useMemo(() => {
    if (!data) return [];
    return (data as Record<string, unknown>[])
      .filter((item) => {
        if (!globalSearch) return true;
        const searchableValues = Object.values(item).join(" ").toLowerCase();
        return searchableValues.includes(globalSearch.toLowerCase());
      })
      .filter((item) => {
        if (!dateFilter || !dateFilter[0] || !dateFilter[1]) return true;
        const dateString = (item.toDate as string) || (item.pledgeDate as string) || (item.reportedAt as string) || (item.issueDate as string);
        if (!dateString) return true;
        const itemDate = dayjs(dateString);
        if (!itemDate.isValid()) return true;
        return itemDate.isBetween(dateFilter[0], dateFilter[1], "day", "[]");
      });
  }, [data, globalSearch, dateFilter]);

  if (isLoading) return <PageLoader />;
  if (isError) {
    notification.error(getError as { data?: { en_Msg?: string; ar_Msg?: string } }, "Failed to load data");
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
            <DatePicker.RangePicker onChange={(dates) => setDateFilter(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)} />
          </Space>
          <Space>
            <Tooltip title={t("common.downloadCsv")}>
              <Button icon={<DownloadOutlined />} onClick={handleDownloadCsv} disabled={selectedRowKeys.length === 0} />
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
      <Card bordered={false} bodyStyle={{ padding: 0 }} className="page-content-card">
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
