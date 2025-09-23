import React from "react";
import { useTranslation } from "react-i18next";
import { theme } from "antd";

interface TradeLicenseProps {
  code: string; // TL Number
  number: string; // TL Name (English)
  emirateAr?: string; // TL Name (Arabic)
}

const TradeLicenseCard: React.FC<TradeLicenseProps> = ({ code, number, emirateAr }) => {
  const { i18n } = useTranslation();
  const { token } = theme.useToken();

  const displayName = i18n.language === "ar" ? emirateAr || number : number || emirateAr;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        border: `1px solid ${token.colorBorder}`,
        borderRadius: token.borderRadius,
        padding: "6px",
        maxWidth: "160px",
        width: "60%",
        height: "40px",
        background: token.colorBgContainer, // theme background
        fontFamily: token.fontFamily,
        boxSizing: "border-box",
      }}
    >
      {/* TL Number (Top) */}
      <span
        style={{
          fontWeight: 600,
          fontSize: "12px",
          lineHeight: "14px",
          marginBottom: "2px",
          whiteSpace: "nowrap",
        }}
      >
        {code || "---"}
      </span>

      {/* TL Name (Bottom, based on language) */}
      <span
        style={{
          fontSize: "11px",
          fontWeight: 500,
          lineHeight: "12px",
          textAlign: "center",
          direction: i18n.language === "ar" ? "rtl" : "ltr",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "140px",
        }}
      >
        {displayName || "---"}
      </span>
    </div>
  );
};

export default TradeLicenseCard;
