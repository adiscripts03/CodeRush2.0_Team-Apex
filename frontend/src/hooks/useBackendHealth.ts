import { useEffect, useState } from "react";
import { fetchBackendHealth, type BackendHealth } from "../services/health.service";

interface UseBackendHealthState {
  health: BackendHealth | null;
  isLoading: boolean;
  error: string | null;
}

export function useBackendHealth(): UseBackendHealthState {
  const [state, setState] = useState<UseBackendHealthState>({
    health: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    let isMounted = true;

    fetchBackendHealth()
      .then((health) => {
        if (isMounted) {
          setState({ health, isLoading: false, error: null });
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setState({
            health: null,
            isLoading: false,
            error: error instanceof Error ? error.message : "Unknown health check error"
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
