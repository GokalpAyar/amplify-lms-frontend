// src/context/LoadingContext.tsx
import { createContext, useContext, useState } from "react";

const LoadingContext = createContext<{
  loading: boolean;
  setLoading: (val: boolean) => void;
}>({
  loading: false,
  setLoading: () => {},
});

export const LoadingProvider = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(false);
  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {children}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="border-t-4 border-blue-500 rounded-full w-12 h-12 animate-spin border-4 border-gray-300" />
        </div>
      )}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);
