import { useEffect, useState } from "react";
import { Image, Spin, Row, Col } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { useValidatecodeQuery } from "../services/rtkApiFactory";
import { useAuth } from "../contexts/AuthContext";
import { EXTERNAL_LOGIN_URL } from "../config/envConfig";
import { getDefaultAuthorizedPath } from "../utils/accessRoutes";

const SPLASH_DELAY = 1300;

export default function SplashPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(true);

  const code = new URLSearchParams(location.search).get("code")?.trim() || "";

  // API call
  const { data, isLoading, isError } = useValidatecodeQuery(code);
  const { login } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      if (!code || isError || !data?.data?.sTafteeshToken) {
        localStorage.clear();
        window.location.href = EXTERNAL_LOGIN_URL;
        return;
      }

      login(data.data);

      const defaultPath = getDefaultAuthorizedPath(data.data.rolePermissions ?? []);
      navigate(defaultPath, { replace: true });

      setShowSplash(false);
    }, SPLASH_DELAY);

    return () => clearTimeout(timer);
  }, [code, isLoading, isError, data, navigate, login]);

  return (
    <Row style={{ height: "100vh", width: "100%" }} justify="center" align="middle">
      {showSplash && (
        <Col style={{ textAlign: "center" }}>
          <div style={{ marginBottom: 20 }}>
            <Image
              preview={false}
              src="/images/LOGO.png"
              alt="Dubai Roads Transport Authority"
              width={300}
              height={300}
              style={{ borderRadius: "50%" }}
            />
          </div>
          <Spin size="large" />
        </Col>
      )}
    </Row>
  );
}
