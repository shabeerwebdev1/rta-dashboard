import { App, ConfigProvider, theme } from "antd";
import { useTranslation } from "react-i18next";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import {
  CompactModeProvider,
  useCompactMode,
} from "./contexts/CompactModeContext";
import { PageProvider } from "./contexts/PageContext";
import AppRoutes from "./router";
import { availableThemes } from "./config/antdTheme";
import "./config/i18n";
import "./styles/global.css";

const AppContent = () => {
  const { themeName } = useTheme();
  const { isCompact } = useCompactMode();
  const { i18n } = useTranslation();

  const isRtl = i18n.dir() === "rtl";

  const activeThemeConfig = availableThemes[themeName];

  let algorithms = [];

  if (activeThemeConfig.algorithm) {
    algorithms.push(activeThemeConfig.algorithm);
  }

  if (isCompact) {
    algorithms.push(theme.compactAlgorithm);
  }

  const finalTheme = {
    ...activeThemeConfig,
    algorithm: algorithms.length > 0 ? algorithms : undefined,
  };

  return (
    <ConfigProvider direction={isRtl ? "rtl" : "ltr"} theme={finalTheme}>
      <App>
        <AppRoutes />
      </App>
    </ConfigProvider>
  );
};

function AppContainer() {
  return (
    <ThemeProvider>
      <CompactModeProvider>
        <PageProvider>
          <AppContent />
        </PageProvider>
      </CompactModeProvider>
    </ThemeProvider>
  );
}

export default AppContainer;
