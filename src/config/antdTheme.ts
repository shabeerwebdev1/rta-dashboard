import type { ThemeConfig } from "antd";

const baseConfig: ThemeConfig = {
  token: {
    fontFamily: "NoirPro, -apple-system, sans-serif",
    borderRadius: 8,
  },
};

const paletteCorporateLight = {
  brightRed: "#EB2D2F",
  darkRed: "#B92324",
  vibrantGreen: "#017B4A",
  darkGreen: "#01613B",
  goldYellow: "#FCB500",
  royalBlue: "#093D9E",
  darkRoyalBlue: "#073180",
  offWhiteCream: "#EDE7D1",
  stoneBeige: "#C4BCA9",
  black: "#000000",
  white: "#FFFFFF",
  white2: "#eef0f2",
};

export const corporateLightThemeConfig: ThemeConfig = {
  ...baseConfig,
  token: {
    ...baseConfig.token,
    colorPrimary: paletteCorporateLight.vibrantGreen,
    colorError: paletteCorporateLight.brightRed,
    colorWarning: paletteCorporateLight.goldYellow,
    colorInfo: paletteCorporateLight.royalBlue,
    colorBgLayout: paletteCorporateLight.white,
    colorBgContainer: paletteCorporateLight.white,
  },
  components: {
    Layout: {
      headerBg: paletteCorporateLight.white,
      siderBg: paletteCorporateLight.darkGreen,
    },
    Menu: {
      colorItemBg: "transparent",
      colorItemText: paletteCorporateLight.stoneBeige,
      colorItemTextHover: paletteCorporateLight.white,
      colorItemTextSelected: paletteCorporateLight.goldYellow,
      colorItemBgSelected: "rgba(252, 181, 0, 0.15)",
    },
    Button: {
      primaryShadow: "none",
    },
  },
};
