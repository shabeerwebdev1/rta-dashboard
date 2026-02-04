import { useEffect, useState } from "react";
import { Image, Spin, Row, Col } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { useValidatecodeQuery } from "../services/rtkApiFactory";
import { useAuth } from "../contexts/AuthContext";
import { EXTERNAL_LOGIN_URL } from "../config/envConfig";

const FALLBACK_CODE = "20260204D8DADA6822FA4207BCE03F27";
const SPLASH_DELAY = 1300;
// const EXTERNAL_LOGIN_URL = "https://sso.kandaprojects.live/webapp/ui/common/login.aspx";

// const EXTERNAL_LOGIN_URL = "http://localhost:7000/webapp/ui/common/login.aspx";

export default function SplashPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(true);

  // Read code from URL or fallback
  const codeFromUrl = new URLSearchParams(location.search).get("code") || "";
  const code = codeFromUrl || FALLBACK_CODE;

  // API call
  const { data, isLoading, isError } = useValidatecodeQuery(code);
  const { login } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      if (isError || !data?.data?.sTafteeshToken) {
        localStorage.clear();
        window.location.href = EXTERNAL_LOGIN_URL;
        return;
      }

      // Successful validation
      const u = data.data;

      localStorage.setItem("sTafteeshToken", u.sTafteeshToken);
      if (u.tokenExpiry) localStorage.setItem("tokenExpiry", u.tokenExpiry);

      localStorage.setItem("displayNameEn", u.displayNameEn ?? "");
      localStorage.setItem("displayNameAr", u.displayNameAr ?? "");
      localStorage.setItem("userImage", u.userImage ?? "");
      localStorage.setItem("userGUID", u.userGUID ?? "");

      //  Store role info
      localStorage.setItem("roleGUID", u.roleGUID ?? "");
      localStorage.setItem("rolePermissions", JSON.stringify(u.rolePermissions ?? []));

      //  Tell AuthContext "we're logged in"
      login(u);

      //  Redirect to dashboard
      navigate("/dashboard", { replace: true });

      setShowSplash(false);
    }, SPLASH_DELAY);

    return () => clearTimeout(timer);
  }, [isLoading, isError, data, navigate, login]);

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
