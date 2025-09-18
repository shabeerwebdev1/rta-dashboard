import { useEffect, useState } from "react";
import { Image, Spin, Row, Col } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { useValidatecodeQuery } from "../services/rtkApiFactory";
import { useAuth } from "../contexts/AuthContext";

const FALLBACK_CODE = "20250912C044F1F1A4F64D338C2EC17A";

// 20250915CEC3A7E185164CBF92353511

const SPLASH_DELAY = 1300;

export default function SplashPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(true);

  // read code from URL or fallback
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
        navigate("/login", { replace: true });
      } else {
        const u = data.data;

        localStorage.setItem("sTafteeshToken", u.sTafteeshToken);
        if (u.tokenExpiry) localStorage.setItem("tokenExpiry", u.tokenExpiry);

        localStorage.setItem("displayNameEn", u.displayNameEn ?? "");
        localStorage.setItem("displayNameAr", u.displayNameAr ?? "");
        localStorage.setItem("userImage", u.userImage ?? "");
        localStorage.setItem("userGUID", u.userGUID ?? "");

        // ✅ Store role info
        localStorage.setItem("roleGUID", u.roleGUID ?? "");
        localStorage.setItem("rolePermissions", JSON.stringify(u.rolePermissions ?? []));

        // ✅ Tell AuthContext "we're logged in"
        login(u);

        // ✅ Redirect
        navigate("/dashboard", { replace: true });
      }

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
