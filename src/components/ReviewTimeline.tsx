import React, { useMemo } from "react";
import { Card, Typography, Tag, Empty, theme } from "antd";
import { CheckOutlined, RightOutlined, ClockCircleOutlined, UserOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import "dayjs/locale/ar";

const { Text } = Typography;

interface ReviewTimelineProps {
  data: any[];
}

const ReviewTimeline: React.FC<ReviewTimelineProps> = ({ data }) => {
  const { i18n } = useTranslation();
  const { token } = theme.useToken();
  const isRTL = i18n.language === "ar";

  const L = (en: string, ar: string) => (isRTL ? ar : en);

  const timelineData = useMemo(() => {
    if (!data?.length) return [];
    return [...data].sort((a, b) => dayjs(b.ActionDateTime).valueOf() - dayjs(a.ActionDateTime).valueOf());
  }, [data]);

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

  const ACTION_COLOR_MAP: Record<string, string> = {
    approve: "#16a34a",
    accept: "#16a34a",
    accepted: "#16a34a",
    rejected: "#dc2626",
    reject: "#dc2626",
    review: "#7c3aed",
    reviewed: "#7c3aed",
    submit: "#0ea5e9",
    init: "#0ea5e9",
    assigned: "#0ea5e9",
    send_back: "#f97316",
    rfi: "#2563eb",
    feedback: "#7c3aed",
    "dispute created": "#2563eb",
    "send to director review": "#f97316",
    "send to manager review": "#f97316",
    "send to senior supervisor review": "#f97316",
  };

  const ROLE_COLOR_MAP: Record<string, string> = {
    Submit: "#2563eb",
    "Supervisor Review": "#7c3aed",
    Review: "#7c3aed",
    Parkonic: "#0ea5e9",
    "Manager Review": "#16a34a",
    "Director Review": "#f59e0b",
    "Parking Portal User": "#0ea5e9",
    "مستخدم بوابة المواقف": "#0ea5e9",
    "Dispute Coordinator Review": "#2563eb",
    "منسق المنازعات": "#2563eb",
    Supervisor: "#7c3aed",
    المشرف: "#7c3aed",
    "Senior Supervisor Review": "#9333ea",
    "المشرف الأول": "#9333ea",
    المدير: "#16a34a",
    "المدير العام": "#f59e0b",
  };

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
        padding: "20px 16px",
        height: "calc(100% - 56px)",
        overflowY: "auto",
      }}
    >
      <div style={{ position: "relative" }}>
        {/* Timeline vertical line */}
        <div
          style={{
            position: "absolute",
            left: isRTL ? "auto" : 12,
            right: isRTL ? 12 : "auto",
            top: 0,
            bottom: 0,
            width: 2,
            background: token.colorBorderSecondary,
            zIndex: 0,
          }}
        />

        {timelineData.map((item, index) => {
          const actionKey = (item.ReviewStatus || item.ActionType || "").toLowerCase();

          const actionColor = ACTION_COLOR_MAP[actionKey] || token.colorTextSecondary;

          const roleColor = ROLE_COLOR_MAP[item.ActivityName] || ROLE_COLOR_MAP[item.Role] || token.colorTextSecondary;

          return (
            <div
              key={item.HistoryGUID || item.ReviewId || index}
              style={{
                display: "flex",
                marginBottom: 24,
                position: "relative",
                zIndex: 1,
                flexDirection: isRTL ? "row-reverse" : "row",
              }}
            >
              {/* Icon */}
              <div style={{ width: 30, textAlign: "center" }}>
                <div
                  style={{
                    background: token.colorBgContainer,
                    padding: "2px",
                    marginTop: "4px",
                  }}
                >
                  {index === timelineData.length - 1 ? (
                    <RightOutlined
                      style={{
                        color: actionColor,
                        fontSize: 14,
                        transform: isRTL ? "scaleX(-1)" : "none",
                      }}
                    />
                  ) : (
                    <CheckOutlined
                      style={{
                        color: actionColor,
                        fontSize: 14,
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Card */}
              <div
                style={{
                  flex: 1,
                  background: token.colorBgContainer,
                  border: `1px solid ${token.colorBorder}`,
                  borderRadius: 12,
                  padding: 16,
                  position: "relative",
                }}
              >
                {/* Role ribbon */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: isRTL ? "auto" : 0,
                    left: isRTL ? 0 : "auto",
                    background: roleColor,
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 12px",
                    borderRadius: isRTL ? "0 0 0 12px" : "0 12px 0 0",
                  }}
                >
                  {item.ActivityName || item.Role || "—"}
                </div>

                {/* Action */}
                <div style={{ marginBottom: 12, textAlign: isRTL ? "right" : "left", marginTop: 18 }}>
                  <Text strong>{L("Action", "الإجراء")}:</Text>{" "}
                  <Tag color={actionColor} style={{ border: "none", fontWeight: 600 }}>
                    {item.ReviewStatus || item.ActionType || "—"}
                  </Tag>
                </div>

                {/* Actor */}
                <div style={{ marginBottom: 12, textAlign: isRTL ? "right" : "left" }}>
                  <Text strong>{L("Actor", "المنفذ")}:</Text>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexDirection: isRTL ? "row-reverse" : "row",
                    }}
                  >
                    <UserOutlined />
                    <Text>{item.ActorName || item.UserName || "—"}</Text>
                  </div>
                </div>

                {/* Comments */}
                <div style={{ marginBottom: 12, textAlign: isRTL ? "right" : "left" }}>
                  <Text strong>{L("Comments", "التعليقات")}:</Text>
                  <div
                    style={{
                      background: token.colorBgLayout,
                      padding: 12,
                      borderLeft: isRTL ? "none" : `4px solid ${actionColor}`,
                      borderRight: isRTL ? `4px solid ${actionColor}` : "none",
                      marginTop: 4,
                    }}
                  >
                    {item.ReviewComments || item.Comments || L("No comments", "لا توجد تعليقات")}
                  </div>
                </div>

                {/* Date */}
                <div
                  style={{
                    borderTop: `1px dashed ${token.colorBorderSecondary}`,
                    paddingTop: 8,
                    textAlign: isRTL ? "right" : "left",
                  }}
                >
                  <ClockCircleOutlined />
                  <Text style={{ marginLeft: 6 }}>
                    {item.ActionDateTime || item.Date
                      ? dayjs(item.ActionDateTime || item.Date)
                          .locale(isRTL ? "ar" : "en")
                          .format(isRTL ? "DD MMMM YYYY، hh:mm A" : "DD MMM YYYY, hh:mm A")
                      : "—"}
                  </Text>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default ReviewTimeline;
