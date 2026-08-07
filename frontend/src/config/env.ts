interface FrontendEnvironment {
  apiBaseUrl: string;
  mapboxAccessToken: string;
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

export const frontendEnv: FrontendEnvironment = {
  apiBaseUrl: readString(import.meta.env.VITE_API_BASE_URL, "http://localhost:4000"),
  mapboxAccessToken: readString(import.meta.env.VITE_MAPBOX_ACCESS_TOKEN, "")
};
