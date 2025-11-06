/* eslint-disable @typescript-eslint/no-explicit-any */
interface AppConfig {
  RTA_API_TARGET: string;
  EXTERNAL_FILES_URL: string;
  EXTERNAL_LOGIN_URL: string;
}

export const getAppConfig = (): AppConfig => {
  const config = (window as any).APP_CONFIG;
  if (!config) {
    const errorMessage = `
`;
    console.error(errorMessage);
    // 🚫 Stop execution immediately
    alert("Runtime config (config.js) missing. Application cannot start.");
  }
  return config;
};

// ✅ Initialize safely — will throw if config missing
const { RTA_API_TARGET, EXTERNAL_FILES_URL, EXTERNAL_LOGIN_URL } = getAppConfig();

export { RTA_API_TARGET, EXTERNAL_FILES_URL, EXTERNAL_LOGIN_URL };
