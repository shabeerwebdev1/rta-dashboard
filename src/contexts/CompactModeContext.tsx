import React, {
  createContext,
  useState,
  useMemo,
  useContext,
  ReactNode,
} from "react";

interface CompactModeContextType {
  isCompact: boolean;
  toggleCompactMode: () => void;
}

const CompactModeContext = createContext<CompactModeContextType | undefined>(
  undefined,
);

export const CompactModeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isCompact, setIsCompact] = useState(false);

  const toggleCompactMode = () => {
    setIsCompact((prev) => !prev);
  };

  const value = useMemo(() => ({ isCompact, toggleCompactMode }), [isCompact]);

  return (
    <CompactModeContext.Provider value={value}>
      {children}
    </CompactModeContext.Provider>
  );
};

export const useCompactMode = () => {
  const context = useContext(CompactModeContext);
  if (context === undefined) {
    throw new Error("useCompactMode must be used within a CompactModeProvider");
  }
  return context;
};
