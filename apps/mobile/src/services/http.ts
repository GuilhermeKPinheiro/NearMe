import axios from 'axios';
import { env } from '@/config/env';
import { sessionStorage } from '@/state/session-storage';

export const http = axios.create({
  baseURL: env.apiUrl || undefined,
  timeout: 15000
});

http.interceptors.request.use(async (config) => {
  const token = await sessionStorage.getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(', ');
    }

    if (typeof message === 'string') {
      return message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unexpected error';
}
