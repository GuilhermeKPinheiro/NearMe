import { http } from '@/services/http';
import type {
  AuthResponse,
  ForgotPasswordResponse,
  GenericSuccessResponse,
  RegisterResponse
} from '@/types/domain';

export async function loginWithEmail(email: string, password: string) {
  const { data } = await http.post<AuthResponse>('/api/auth/login', {
    email,
    password
  });

  return data;
}

export async function registerWithEmail(name: string, email: string, password: string) {
  const { data } = await http.post<RegisterResponse>('/api/auth/register', {
    name,
    email,
    password
  });

  return data;
}

export async function loginWithGoogleIdToken(idToken: string) {
  const { data } = await http.post<AuthResponse>('/api/auth/google', {
    idToken
  });

  return data;
}

export async function requestPasswordReset(email: string) {
  const { data } = await http.post<ForgotPasswordResponse>('/api/auth/forgot-password', {
    email
  });

  return data;
}

export async function confirmEmailToken(token: string) {
  const { data } = await http.post<GenericSuccessResponse>('/api/auth/verify-email', {
    token
  });

  return data;
}

export async function resetPasswordWithToken(token: string, password: string) {
  const { data } = await http.post<GenericSuccessResponse>('/api/auth/reset-password', {
    token,
    password
  });

  return data;
}
