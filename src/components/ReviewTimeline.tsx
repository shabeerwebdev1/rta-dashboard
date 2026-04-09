import React, { useMemo, useState, useEffect } from "react";
import { Card, Typography, Tag, Empty, theme, Collapse } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import "dayjs/locale/ar";

const { Text } = Typography;
const EMPTY_TIMELINE_DATA: any[] = [];

interface ReviewTimelineProps {
  data: any[];
}

const ReviewTimeline: React.FC<ReviewTimelineProps> = ({ data }) => {
  const { i18n } = useTranslation();
  const { token } = theme.useToken();
  const isRTL = i18n.language === "ar";

  const [activeKeys, setActiveKeys] = useState<string[]>([]);

  const L = (en: string, ar: string) => (isRTL ? ar : en);

  const normalizeStatus = (value: unknown) =>
    String(value ?? "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[^\w\s]/g, "")
      .trim();

  const expandableStatuses = useMemo(
    () =>
      new Set([
        "accpet",
        "acceoeted",
        "accept",
        "accepted",
        "reject",
        "rejected",
        "approve",
        "approved",
        "submit feedback",
        "send to senior supervisor review",
        "send to senior supervior review",
        "senior supervisor review",
      ]),
    [],
  );

  const timelineData = useMemo(() => {
    if (!data?.length) return EMPTY_TIMELINE_DATA;

    return [...data].sort((a, b) => dayjs(b.ActionDateTime).valueOf() - dayjs(a.ActionDateTime).valueOf());
  }, [data]);

  const expandableKeys = useMemo(() => {
    if (!timelineData.length) return [];

    return timelineData
      .map((item, index) => {
        const actionText = normalizeStatus(item.ReviewStatus || item.ActionType);
        const panelKey = String(item.HistoryGUID || item.ReviewId || index);
        return expandableStatuses.has(actionText) ? panelKey : null;
      })
      .filter((key): key is string => Boolean(key));
  }, [expandableStatuses, timelineData]);

  useEffect(() => {
    setActiveKeys(expandableKeys);
  }, [expandableKeys]);

  const getActionColor = (action: string) => {
    const key = action.toLowerCase();

    if (key.includes("approve") || key.includes("accept")) return "#16a34a";
    if (key.includes("reject")) return "#dc2626";
    if (key.includes("review")) return "#2563eb";
    if (key.includes("send") || key.includes("assign") || key.includes("submit")) return "#0ea5e9";

    return token.colorTextSecondary;
  };

  const isTechnicalEntry = (item: any) => {
    const action = String(item.ReviewStatus || item.ActionType || "").toLowerCase();
    const comments = String(item.ReviewComments || item.Comments || "").toLowerCase();

    return (
      action.includes("failed") ||
      action.includes("error") ||
      comments.includes("exception") ||
      comments.includes("stack") ||
      comments.includes("timeout")
    );
  };

  if (!timelineData.length) {
    return (
      <Card
        title={
          <Text strong style={{ fontSize: 16 }}>
            {L("Review Timeline", "سجل المراجعة")}
          </Text>
        }
        size="small"
        style={{
          borderRadius: 12,
          background: token.colorBgContainer,
          height: 720,
          border: `1px solid ${token.colorBorder}`,
        }}
        bodyStyle={{
          padding: "20px 16px",
          height: "calc(100% - 56px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Empty description={L("No Review History", "لا يوجد سجل مراجعة")} />
      </Card>
    );
  }

  const collapseItems = timelineData.map((item, index) => {
    const actionText = item.ReviewStatus || item.ActionType || "—";
    const actionColor = getActionColor(String(actionText));
    const technical = isTechnicalEntry(item);

    const panelKey = String(item.HistoryGUID || item.ReviewId || index);

    return {
      key: panelKey,
      label: (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            width: "100%",
            direction: isRTL ? "rtl" : "ltr",
            cursor: "pointer",
          }}
        >
          {/* Activity Name */}
          <Text strong style={{ fontSize: 14 }}>
            {item.ActivityName || "—"}
          </Text>

          {/* Status Tag */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <Tag
              color={actionColor}
              style={{
                marginInlineEnd: 0,
                border: "none",
                fontWeight: 600,
              }}
            >
              {actionText}
            </Tag>
          </div>

          {/* Date */}
          <Text type="secondary" style={{ fontSize: 12 }}>
            {item.ActionDateTime || item.Date
              ? dayjs(item.ActionDateTime || item.Date)
                  .locale(isRTL ? "ar" : "en")
                  .format(isRTL ? "DD MMMM YYYY، hh:mm A" : "DD MMM YYYY, h:mm A")
              : "—"}
          </Text>
        </div>
      ),

      children: (
        <div
          style={{
            direction: isRTL ? "rtl" : "ltr",
            display: "grid",
            gap: 10,
          }}
        >
          {/* <div>
            <Text strong>{L("Action", "الإجراء")}:</Text> <Text>{actionText}</Text>
          </div> */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexDirection: isRTL ? "row-reverse" : "row",
            }}
          >
            <UserOutlined />
            <Text>
              <Text strong>{L("Actor", "المنفذ")}: </Text>
              {item.ActorName || item.UserName || "—"}
            </Text>
          </div>

          {!technical && (
            <div>
              <Text strong>{L("User Comments", "تعليقات المستخدم")}:</Text>

              <div
                style={{
                  background: token.colorBgLayout,
                  borderLeft: isRTL ? "none" : `3px solid ${actionColor}`,
                  borderRight: isRTL ? `3px solid ${actionColor}` : "none",
                  padding: "8px 10px",
                  marginTop: 4,
                }}
              >
                {item.ReviewComments || item.Comments || L("No comments", "لا توجد تعليقات")}
              </div>
            </div>
          )}

          {/* <div>
            <ClockCircleOutlined />

            <Text style={{ marginInlineStart: 6 }}>
              {item.ActionDateTime || item.Date
                ? dayjs(item.ActionDateTime || item.Date)
                    .locale(isRTL ? "ar" : "en")
                    .format(isRTL ? "DD MMMM YYYY، hh:mm A" : "DD MMM YYYY, h:mm A")
                : "—"}
            </Text>
          </div> */}
        </div>
      ),

      style: {
        marginBottom: 10,
        borderRadius: 10,
        border: `1px solid ${token.colorBorder}`,
        background: token.colorBgContainer,
      },
    };
  });

  return (
    <Card
      title={
        <Text strong style={{ fontSize: 16 }}>
          {L("Review Timeline", "سجل المراجعة")}
        </Text>
      }
      size="small"
      style={{
        borderRadius: 12,
        background: token.colorBgContainer,
        height: 720,
        border: `1px solid ${token.colorBorder}`,
        boxShadow: token.boxShadowTertiary,
      }}
      bodyStyle={{
        padding: "14px 12px",
        height: "calc(100% - 56px)",
        overflowY: "auto",
      }}
    >
      <Collapse
        items={collapseItems}
        activeKey={activeKeys}
        onChange={(keys) => setActiveKeys(Array.isArray(keys) ? (keys as string[]) : [String(keys)])}
        ghost
      />
    </Card>
  );
};

export default ReviewTimeline;
