import React, { createContext, useState, useMemo, useContext, ReactNode } from "react";

interface PageContextType {
  pageTitle: string;
  setPageTitle: (title: string) => void;
}

const PageContext = createContext<PageContextType | undefined>(undefined);

export const PageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pageTitle, setPageTitle] = useState("Dashboard");

  const value = useMemo(() => ({ pageTitle, setPageTitle }), [pageTitle]);

  return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
};

export const usePage = () => {
  const context = useContext(PageContext);
  if (context === undefined) {
    throw new Error("usePage must be used within a PageProvider");
  }
  return context;
};
