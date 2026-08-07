import { useEffect, useState } from "react";
import { fetchGisLayers } from "../services/gis.service";
import type { GisLayerSummary } from "../gis/gis.types";

interface UseGisLayersState {
  layers: GisLayerSummary[];
  isLoading: boolean;
  error: string | null;
}

export function useGisLayers(): UseGisLayersState {
  const [state, setState] = useState<UseGisLayersState>({
    layers: [],
    isLoading: true,
    error: null
  });

  useEffect(() => {
    let isMounted = true;

    fetchGisLayers()
      .then((layers) => {
        if (isMounted) {
          setState({ layers, isLoading: false, error: null });
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setState({
            layers: [],
            isLoading: false,
            error: error instanceof Error ? error.message : "Unknown GIS layer error"
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
