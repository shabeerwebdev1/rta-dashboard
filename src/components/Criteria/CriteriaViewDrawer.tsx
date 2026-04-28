import React, { useState, useEffect } from "react";
import { Drawer, Descriptions, Button, Spin, Tag } from "antd";
import { useTranslation } from "react-i18next";
import { ShareAltOutlined } from "@ant-design/icons";

interface CriteriaViewDrawerProps {
  open: boolean;
  onClose: () => void;
  record: Record<string, unknown> | null;
  onShare?: () => void;
}

// ── Static lookup maps (mirrors the pattern in WhitelistPlatesViewDrawer) ──────

const objectiveTypeLabels: Record<string, { en: string; ar: string }> = {
  target: { en: "Target", ar: "هدف" },
  competence: { en: "Competence", ar: "كفاءة" },
};

// ── Display field definitions ─────────────────────────────────────────────────

const DISPLAY_FIELDS = [
  { key: "descriptionEn", titleKey: "form.descriptionEn", type: "text" },
  { key: "descriptionAr", titleKey: "form.descriptionAr", type: "text" },
  { key: "objectiveTypeLabel", titleKey: "form.objectiveType", type: "objectiveType" },
  { key: "weightFormatted", titleKey: "form.weight", type: "weight" },
  { key: "activeStatus", titleKey: "form.isActive", type: "status" },
];

// ── Component ─────────────────────────────────────────────────────────────────

const CriteriaViewDrawer: React.FC<CriteriaViewDrawerProps> = ({ open, onClose, record, onShare }) => {
  const { t, i18n } = useTranslation();

  const isRtl = i18n.dir() === "rtl";

  // Mirrors WhitelistPlatesViewDrawer: mapped/resolved record + loading state
  const [mappedRecord, setMappedRecord] = useState<Record<string, unknown> | null>(null);
  const [isMapping, setIsMapping] = useState(false);

  // Re-map whenever the drawer opens or the language changes
  useEffect(() => {
    if (open && record) {
      mapRecord(record);
    }
  }, [open, record, i18n.language]);

  const getObjectiveLabel = (value: string) => {
    const entry = objectiveTypeLabels[value];
    if (!entry) return value ?? "";
    return i18n.language === "ar" ? entry.ar : entry.en;
  };

  const mapRecord = (raw: Record<string, unknown>) => {
    setIsMapping(true);
    try {
      const mapped: Record<string, unknown> = {
        ...raw,
        // Pre-resolve labels so the render loop stays simple (same pattern as
        // WhitelistPlatesViewDrawer's mapRecordToLabels)
        objectiveTypeLabel: getObjectiveLabel(String(raw.objectiveType ?? "")),
        weightFormatted: raw.weight != null ? raw.weight : "",
        activeStatus: raw.active, // boolean — rendered as Tag
      };
      setMappedRecord(mapped);
    } finally {
      setIsMapping(false);
    }
  };

  if (!record) return null;

  // ── Value renderer — identical switch structure to WhitelistPlatesViewDrawer ─

  const renderValue = (field: (typeof DISPLAY_FIELDS)[number], value: unknown) => {
    if (value === null || value === undefined || value === "") {
      return t("common.noData");
    }

    switch (field.type) {
      case "weight":
        return <strong>{String(value)}%</strong>;

      case "objectiveType":
        // label already resolved in mapRecord; wrap in Tag for visual parity
        return value;
      case "status":
        return value ? (
          <Tag color="green">{t("common.active")}</Tag>
        ) : (
          <Tag color="default">{t("common.inactive")}</Tag>
        );

      default:
        return String(value);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={500}
      title={t("page.viewTitle", { entity: t("entity.criteria") })}
      placement={isRtl ? "left" : "right"}
      extra={
        onShare ? (
          <Button icon={<ShareAltOutlined />} onClick={onShare}>
            {t("common.share")}
          </Button>
        ) : null
      }
    >
      {/* Spin wrapper — identical to WhitelistPlatesViewDrawer */}
      <Spin spinning={isMapping}>
        {mappedRecord && (
          <Descriptions bordered column={1} size="small" style={{ marginBottom: 24 }}>
            {DISPLAY_FIELDS.map((field) => {
              const value = mappedRecord[field.key];

              return (
                <Descriptions.Item label={t(field.titleKey)} key={field.key}>
                  {renderValue(field, value)}
                </Descriptions.Item>
              );
            })}
          </Descriptions>
        )}
      </Spin>
    </Drawer>
  );
};

export default CriteriaViewDrawer;
