// src/pages/ComingSoonPage.tsx
import { useEffect } from "react";
import { usePage } from "../contexts/PageContext";
import { useTranslation } from "react-i18next";
import { Empty } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import { useLocation } from "react-router-dom";
import { FULL_PATHS } from "../constants/paths";

function ComingSoonPage() {
  const { setPageTitle } = usePage();
  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    const pathToTitle: Record<string, string> = {
      [FULL_PATHS.INSPECTIONS]: t("sidebar.inspections"),
      [FULL_PATHS.TOWING]: t("sidebar.towing"),

      [FULL_PATHS.TEAM_EVALUATION]: t("sidebar.teamEvaluation"),
      [FULL_PATHS.TEAM_TRAINING]: t("sidebar.training"),

      [FULL_PATHS.ANALYTICS]: t("sidebar.analytics"),
    };

    const currentTitle = pathToTitle[location.pathname] || "Coming Soon";
    setPageTitle(`${currentTitle} `);
  }, [location.pathname, setPageTitle, t]);

  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 100px)", // adjust for header/sidebar
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        textAlign: "center",
      }}
    >
      <Empty description={<span style={{ fontSize: 20, fontWeight: 600 }}>Coming Soon</span>} image={null}>
        <ClockCircleOutlined style={{ fontSize: 80, color: "#999" }} />
      </Empty>
    </div>
  );
}

export default ComingSoonPage;
