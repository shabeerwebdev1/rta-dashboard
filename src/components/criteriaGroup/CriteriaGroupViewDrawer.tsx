import React, { useState, useEffect } from "react";
import { Modal, Descriptions, Button, Spin, Tag, Table, Typography, Space } from "antd";
import { useTranslation } from "react-i18next";
import { ShareAltOutlined } from "@ant-design/icons";
import type { PageConfig } from "../../types/config";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CriteriaDetail {
  id: string;
  descriptionEn: string;
  descriptionAr: string;
  weight: number;
}

interface CriteriaGroupRecord {
  id: string;
  groupName_EN: string;
  groupName_AR: string;
  isActive: boolean;
  details: CriteriaDetail[];
}

interface CriteriaGroupViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: CriteriaGroupRecord | null;
  config: PageConfig;
  onShare?: () => void;
}

// ─── Helper: active tag — mirrors WhitelistPlatesViewDrawer getStatusTag ──────
const getActiveTag = (isActive: boolean, activeLabel: string, inactiveLabel: string) =>
  isActive ? <Tag color="green">{activeLabel}</Tag> : <Tag color="default">{inactiveLabel}</Tag>;

// ─── Component ────────────────────────────────────────────────────────────────
const CriteriaGroupViewDrawer: React.FC<CriteriaGroupViewDrawerProps> = ({
  open,
  onClose,
  record,
  config,
  onShare,
}) => {
  const { t, i18n } = useTranslation();
  const [mappedRecord, setMappedRecord] = useState<any>(null);

  // ── Map record to display shape (same pattern as WhitelistPlatesViewDrawer) ─
  useEffect(() => {
    if (!record) return;

    setMappedRecord({
      ...record,
      totalWeight: (record.details ?? []).reduce((sum, d) => sum + (d.weight ?? 0), 0),
    });
  }, [record, i18n.language]);

  if (!record) return null;

  // ── Summary fields — same displayFields pattern as WhitelistPlatesViewDrawer ─
  const displayFields = [
    {
      key: "groupName_EN",
      title: "form.groupNameEn",
      render: () => mappedRecord?.groupName_EN ?? t("common.noData"),
    },
    {
      key: "groupName_AR",
      title: "form.groupNameAr",
      render: () => <span dir="rtl">{mappedRecord?.groupName_AR ?? t("common.noData")}</span>,
    },
    {
      key: "isActive",
      title: "form.isActive",
      render: () =>
        getActiveTag(mappedRecord?.isActive, t("common.active") || "Active", t("common.inactive") || "Inactive"),
    },
    {
      key: "totalWeight",
      title: "form.totalWeight",
      render: () => {
        const total = mappedRecord?.totalWeight ?? 0;
        return <Tag color={total === 100 ? "green" : total > 100 ? "red" : "orange"}>{total}%</Tag>;
      },
    },
  ];

  // ── Criteria details table columns ─────────────────────────────────────────
  const detailColumns = [
    {
      title: t("form.criteriaName") || "Criteria",
      key: "name",
      render: (_: any, d: CriteriaDetail) => (i18n.language === "ar" ? d.descriptionAr : d.descriptionEn),
    },
    {
      title: t("form.weight") || "Weight",
      dataIndex: "weight",
      key: "weight",
      align: "center" as const,
      width: 90,
      render: (w: number) => <Tag color="blue">{w}%</Tag>,
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={650}
      title={t("page.viewTitle", { entity: t(config.name.singular) })}
      footer={[
        onShare ? (
          <Button key="share" icon={<ShareAltOutlined />} onClick={onShare}>
            {t("common.share")}
          </Button>
        ) : null,
        <Button key="close" type="primary" onClick={onClose}>
          {t("common.close")}
        </Button>,
      ].filter(Boolean)}
      styles={{
        body: {
          maxHeight: "70vh",
          overflowY: "auto",
          overflowX: "hidden",
          paddingRight: 4,
        },
      }}
    >
      <Spin spinning={!mappedRecord}>
        {mappedRecord && (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {/* ── Summary Descriptions — same as WhitelistPlatesViewDrawer ── */}
            <Descriptions bordered column={1} size="small" style={{ marginBottom: 8 }}>
              {displayFields.map((field) => (
                <Descriptions.Item label={t(field.title)} key={field.key}>
                  {field.render()}
                </Descriptions.Item>
              ))}
            </Descriptions>

            {/* ── Criteria details table ─────────────────────────────────── */}
            <div>
              <Typography.Title level={5} style={{ marginBottom: 10 }}>
                {t("form.criteriaSelection")}
              </Typography.Title>

              {mappedRecord.details?.length > 0 ? (
                <Table
                  rowKey="id"
                  size="small"
                  bordered
                  dataSource={mappedRecord.details}
                  columns={detailColumns}
                  pagination={false}
                  summary={() => (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}>
                        <Typography.Text strong>{t("form.totalWeight") || "Total Weight"}</Typography.Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="center">
                        <Tag
                          color={
                            mappedRecord.totalWeight === 100
                              ? "green"
                              : mappedRecord.totalWeight > 100
                                ? "red"
                                : "orange"
                          }
                        >
                          <strong>{mappedRecord.totalWeight}%</strong>
                        </Tag>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                />
              ) : (
                <Typography.Text type="secondary">{t("messages.noCriteriaAvailable")}</Typography.Text>
              )}
            </div>
          </Space>
        )}
      </Spin>
    </Modal>
  );
};

export default CriteriaGroupViewDrawer;
