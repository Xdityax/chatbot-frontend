import api from './api';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthResponse = {
  user: AuthUser;
  token: string;
  message?: string;
};

export type AuthPayload = {
  name?: string;
  email: string;
  password: string;
};

export async function register(data: AuthPayload): Promise<AuthResponse> {
  return api.fetchJSON<AuthResponse>('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function login(data: Pick<AuthPayload, 'email' | 'password'>): Promise<AuthResponse> {
  return api.fetchJSON<AuthResponse>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export default { register, login };
