import { useEffect, useState } from "react";
import { Image, Spin, Row, Col } from "antd";
import { useNavigate } from "react-router-dom";

export default function SplashPage() {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      navigate("/dashboard", { replace: true });
    }, 1300);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Row
      style={{
        height: "100vh",
        width: "100%",
      }}
      justify="center"
      align="middle"
    >
      {isLoading && (
        <Col style={{ textAlign: "center" }}>
          <div style={{ marginBottom: 20 }}>
            <Image
              preview={false}
              src="https://images.seeklogo.com/logo-png/4/2/dubai-roads-transport-authority-logo-png_seeklogo-44110.png"
              alt="Dubai Roads Transport Authority"
              width={300}
              height={300}
              style={{
                borderRadius: "50%",
              }}
            />
          </div>
          <Spin size="large" />
        </Col>
      )}
    </Row>
  );
}
