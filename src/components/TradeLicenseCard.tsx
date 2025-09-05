import React from "react";
import { useTranslation } from "react-i18next";

interface TradeLicenseProps {
  code: string; // TL Number
  number: string; // TL Name (English)
  emirateAr?: string; // TL Name (Arabic)
}

const TradeLicenseCard: React.FC<TradeLicenseProps> = ({ code, number, emirateAr }) => {
  const { i18n } = useTranslation();

  const displayName = i18n.language === "ar" ? emirateAr || number : number || emirateAr;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column", // stack vertically
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid rgba(0, 0, 0, 0.2)",
        borderRadius: "8px",
        padding: "6px",
        maxWidth: "160px",
        width: "60%",
        height: "40px",
        background: "#fff",
        fontFamily: "Arial, sans-serif",
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
