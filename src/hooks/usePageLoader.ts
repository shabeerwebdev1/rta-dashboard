import { useState, useEffect } from "react";

const usePageLoader = (delay = 1000): boolean => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return loading;
};

export default usePageLoader;
