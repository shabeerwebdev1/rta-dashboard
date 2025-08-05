// import { useState } from "react";

// export function useApi<T = any>(apiFunc: (...args: any[]) => Promise<any>) {
//   const [data, setData] = useState<T | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<any>(null);

//   const request = async (...args: any[]) => {
//     setLoading(true);
//     setError(null);
//     try {
//       const response = await apiFunc(...args);
//       setData(response.data);
//       return response.data;
//     } catch (err: any) {
//       setError(err);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   };

//   return {
//     data,
//     loading,
//     error,
//     request,
//   };
// }


// hooks/useApi.ts
import { useState, useEffect } from "react";

interface UseApiOptions {
  manual?: boolean; // default is false
  defaultParams?: any[]; // optional default parameters
}

export function useApi<T = any>(
  apiFunc: (...args: any[]) => Promise<any>,
  options?: UseApiOptions
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const request = async (...args: any[]): Promise<T> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFunc(...args);
      setData(response.data);
      return response.data;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!options?.manual) {
      request(...(options?.defaultParams || []));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    data,
    loading,
    error,
    request,
  };
}
