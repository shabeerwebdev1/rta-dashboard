import { Result, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { FULL_PATHS } from "../constants/paths";
import { getDefaultAuthorizedPath } from "../utils/accessRoutes";

const ForbiddenPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const defaultPath = getDefaultAuthorizedPath(user?.rolePermissions ?? []);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <Result
        status="403"
        title="403"
        subTitle="Sorry, you are not authorized to access this page."
        extra={
          <Button type="primary" onClick={() => navigate(user ? defaultPath : FULL_PATHS.SPLASH, { replace: true })}>
            Go to Allowed Page
          </Button>
        }
      />
    </div>
  );
};

export default ForbiddenPage;
