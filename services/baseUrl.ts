export function getApiBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL;

  if (configuredUrl) {
    return configuredUrl;
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