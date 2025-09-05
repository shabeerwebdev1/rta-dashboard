import { useEffect, useState } from "react";
import { Image, Spin, Row, Col } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { useValidatecodeQuery } from "../services/rtkApiFactory";

const FALLBACK_CODE = "20250903DA9252B5C9EF497592CC480C";
const SPLASH_DELAY = 1300;

export default function SplashPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(true);

  // read from URL or use the provided fallback
  const codeFromUrl = new URLSearchParams(location.search).get("code") || "";
  const code = codeFromUrl || FALLBACK_CODE;

  // call RTK Query
  const { data, isLoading, isError } = useValidatecodeQuery(code);

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      if (isError || !data?.data?.sTafteeshToken) {
        localStorage.clear();
        navigate("/login", { replace: true });
      } else {
        const u = data.data;

        // store token + expiry + user profile
        localStorage.setItem("sTafteeshToken", u.sTafteeshToken);
        if (u.tokenExpiry) localStorage.setItem("tokenExpiry", u.tokenExpiry);

        localStorage.setItem("displayNameEn", u.displayNameEn ?? "");
        localStorage.setItem("displayNameAr", u.displayNameAr ?? "");
        localStorage.setItem("userImage", u.userImage ?? "");

        navigate("/dashboard", { replace: true });
      }

      setShowSplash(false);
    }, SPLASH_DELAY);

    return () => clearTimeout(timer);
  }, [isLoading, isError, data, navigate]);

  return (
    <Row style={{ height: "100vh", width: "100%" }} justify="center" align="middle">
      {showSplash && (
        <Col style={{ textAlign: "center" }}>
          <div style={{ marginBottom: 20 }}>
            <Image
              preview={false}
              src="https://images.seeklogo.com/logo-png/4/2/dubai-roads-transport-authority-logo-png_seeklogo-44110.png"
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
