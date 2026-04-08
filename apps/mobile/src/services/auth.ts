import { http } from '@/services/http';
import type { AuthResponse } from '@/types/domain';

export async function loginWithEmail(email: string, password: string) {
  const { data } = await http.post<AuthResponse>('/api/auth/login', {
    email,
    password
  });

  return data;
}

export async function registerWithEmail(name: string, email: string, password: string) {
  const { data } = await http.post<AuthResponse>('/api/auth/register', {
    name,
    email,
    password
  });

  return data;
}

export async function loginWithGoogleDev(name: string, email: string) {
  const { data } = await http.post<AuthResponse>('/api/auth/google', {
    name,
    email
  });

  return data;
}
