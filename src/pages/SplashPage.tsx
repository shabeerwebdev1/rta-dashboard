import { useEffect, useState } from "react";
import { Image, Spin } from "antd";
import { useNavigate } from "react-router-dom";
import "../styles/splash.css";

export default function SplashPage() {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      navigate("/dashboard", { replace: true });
    }, 5000); 

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="splash-container">
      {isLoading && (
        <div className="splash-content">
          <div className="logo-wrapper">
            <Image
              preview={false}
              src="https://images.seeklogo.com/logo-png/4/2/dubai-roads-transport-authority-logo-png_seeklogo-44110.png"
              alt="Dubai Roads Transport Authority"
              width={400}
              height={400}
              className="splash-logo"
            />
          </div>
          <Spin size="large" className="loader" />
        </div>
      )}
    </div>
  );
}