import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DeveloperModeContextType {
  isDeveloperMode: boolean;
  toggleDeveloperMode: () => void;
}

const DeveloperModeContext = createContext<DeveloperModeContextType | undefined>(undefined);

export const DeveloperModeProvider = ({ children }: { children: ReactNode }) => {
  const [isDeveloperMode, setIsDeveloperMode] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem('developerMode');
    return saved === 'true';
  });

  const toggleDeveloperMode = () => {
    setIsDeveloperMode(prev => {
      const newValue = !prev;
      localStorage.setItem('developerMode', String(newValue));
      return newValue;
    });
  };

  return (
    <DeveloperModeContext.Provider value={{ isDeveloperMode, toggleDeveloperMode }}>
      {children}
    </DeveloperModeContext.Provider>
  );
};

export const useDeveloperMode = () => {
  const context = useContext(DeveloperModeContext);
  if (context === undefined) {
    throw new Error('useDeveloperMode must be used within a DeveloperModeProvider');
  }
  return context;
};
