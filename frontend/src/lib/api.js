// frontend/src/lib/api.js
// Centralized API client — all API calls should flow through here.
//
// Uses x402Fetch for payment-aware requests to /api/* endpoints.
// Regular /data/* fetches (static GeoJSON) use standard fetch.

import { x402Fetch } from './x402Client.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || '';

/**
 * Build a full API URL from a relative path.
 * @param {string} path - e.g., '/api/dashboard'
 * @returns {string}
 */
export function apiUrl(path) {
  return `${API_BASE}${path}`;
}

/**
 * x402-aware fetch for API endpoints.
 * Automatically handles HTTP 402 payment flow.
 *
 * Use this for all /api/* calls.
 * Do NOT use this for static /data/* fetches.
 *
 * @param {string} path - API path (e.g., '/api/agentic-plan')
 * @param {Object} options - fetch options
 * @returns {Promise<Response>}
 */
export function apiFetch(path, options = {}) {
  return x402Fetch(apiUrl(path), options);
}