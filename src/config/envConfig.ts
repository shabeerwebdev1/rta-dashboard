interface AppConfig {
  RTA_API_TARGET: string;
  EXTERNAL_FILES_URL: string;
  EXTERNAL_LOGIN_URL: string;
}

export const getAppConfig = (): AppConfig => {
  const config = (window as any).APP_CONFIG;
  const requiredKeys: Array<keyof AppConfig> = ["RTA_API_TARGET", "EXTERNAL_FILES_URL", "EXTERNAL_LOGIN_URL"];

  if (!config || requiredKeys.some((key) => typeof config[key] !== "string" || !config[key].trim())) {
    throw new Error("Runtime configuration is missing or incomplete. Check public/config.js.");
  }

  return config;
};

// ✅ Initialize safely — will throw if config missing
const { RTA_API_TARGET, EXTERNAL_FILES_URL, EXTERNAL_LOGIN_URL } = getAppConfig();

export { RTA_API_TARGET, EXTERNAL_FILES_URL, EXTERNAL_LOGIN_URL };
