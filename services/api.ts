import { getApiBaseUrl } from './baseUrl';

const API_BASE = getApiBaseUrl();

type FetchJSONOptions = RequestInit;

export async function fetchJSON<T = unknown>(path: string, opts: FetchJSONOptions = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, opts);

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed with status ${res.status}`);
  }

  return (await res.json()) as T;
}

export default { fetchJSON };
