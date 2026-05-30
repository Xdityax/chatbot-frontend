export function getApiBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (configuredUrl) {
    if (!/^https?:\/\//i.test(configuredUrl)) {
      throw new Error('NEXT_PUBLIC_API_URL must start with http:// or https:// (example: https://your-backend.up.railway.app).');
    }

    return configuredUrl.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    const { hostname } = window.location;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }

    throw new Error('NEXT_PUBLIC_API_URL is not set. Add your Railway backend URL in Netlify environment variables.');
  }

  return 'http://localhost:5000';
}