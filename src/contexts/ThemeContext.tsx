import React, {
  createContext,
  useState,
  useMemo,
  useContext,
  ReactNode,
} from "react";
import { availableThemes } from "../config/antdTheme";

export type ThemeName = keyof typeof availableThemes | "dark";

interface ThemeContextType {
  themeName: ThemeName;
  setThemeName: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [themeName, setThemeName] = useState<ThemeName>("corporateRed");

  const value = useMemo(() => ({ themeName, setThemeName }), [themeName]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
