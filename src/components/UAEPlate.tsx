import React from "react";

interface PlateProps {
  code: string;
  number: string | number;
  emirateEn?: string;
  emirateAr?: string;
}

const UAEPlate: React.FC<PlateProps> = ({ code, number, emirateEn, emirateAr }) => {
  const safeNumber = String(number);
  const truncatedNumber = safeNumber.length > 6 ? safeNumber.slice(0, 6) : safeNumber;

  const showArabic = emirateAr && emirateAr !== emirateEn;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        border: "1px solid rgba(0, 0, 0, 0.2)",
        borderRadius: "8px",
        padding: "6px",
        maxWidth: "160px",
        width: "fit-content",
        height: "35px",
        background: "#fff",
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <span style={{ fontWeight: "semi-bold", fontSize: "12px", marginRight: "6px" }}>{code}</span>

      <div style={{ textAlign: "center", flexGrow: 1 }}>
        {showArabic && <div style={{ fontSize: "10px", lineHeight: "14px" }}>{emirateAr}</div>}
        {emirateEn && <div style={{ fontSize: "10px", lineHeight: "10px" }}>{emirateEn}</div>}
      </div>

      <span
        style={{
          fontWeight: "semi-bold",
          fontSize: "12px",
          marginLeft: "6px",
          maxWidth: "90px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {truncatedNumber}
      </span>
    </div>
  );
};

export default UAEPlate;
