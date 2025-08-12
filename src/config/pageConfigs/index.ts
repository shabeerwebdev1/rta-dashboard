import type { PageConfig } from "../../types/config";
import { whitelistPlateConfig } from "./whitelistPlateConfig";
import { whitelistTradeLicenseConfig } from "./whitelistTradeLicenseConfig";
import { pledgeConfig } from "./pledgeConfig";
import { inspectionObstacleConfig } from "./inspectionObstacleConfig";
import { disputeManagementConfig } from "./DisputeManagementConfig";

export const pageConfigs: Record<string, PageConfig> = {
  [whitelistPlateConfig.key]: whitelistPlateConfig,
  [whitelistTradeLicenseConfig.key]: whitelistTradeLicenseConfig,
  [pledgeConfig.key]: pledgeConfig,
  [inspectionObstacleConfig.key]: inspectionObstacleConfig,
  [disputeManagementConfig.key]: disputeManagementConfig,
};
