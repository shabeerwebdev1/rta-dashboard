import React from "react";
import { Spin } from "antd";

interface MapComponentProps {
  lat: number;
  lng: number;
}

const MapComponent: React.FC<MapComponentProps> = ({ lat, lng }) => {
  const [loading, setLoading] = React.useState(true);
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <div
      style={{
        height: 300,
        width: "100%",
        borderRadius: 8,
        overflow: "hidden",
        position: "relative",
        border: "1px solid #d9d9d9",
      }}
    >
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "#fff",
            zIndex: 1,
          }}
        >
          <Spin tip="Loading map..." size="large" />
        </div>
      )}
      <iframe
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        src={mapUrl}
        onLoad={() => setLoading(false)}
      ></iframe>
    </div>
  );
};

export default MapComponent;
