const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
