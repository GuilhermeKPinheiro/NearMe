import axios from 'axios';
import { env } from '@/config/env';
import { debugLog } from '@/services/diagnostics';
import { sessionStorage } from '@/state/session-storage';

export const http = axios.create({
  baseURL: env.apiUrl || undefined,
  timeout: 15000
});

http.interceptors.request.use(async (config) => {
  const nextConfig = config as typeof config & {
    metadata?: { startedAt: number; requestId: string };
  };

  nextConfig.metadata = {
    startedAt: Date.now(),
    requestId: Math.random().toString(36).slice(2, 8),
  };

  const token = await sessionStorage.getToken();

  if (token) {
    nextConfig.headers.Authorization = `Bearer ${token}`;
  }

  debugLog('http', 'request', {
    requestId: nextConfig.metadata.requestId,
    method: nextConfig.method?.toUpperCase(),
    url: nextConfig.baseURL ? `${nextConfig.baseURL}${nextConfig.url ?? ''}` : nextConfig.url,
    params: nextConfig.params,
  });

  return nextConfig;
});

http.interceptors.response.use(
  (response) => {
    const config = response.config as typeof response.config & {
      metadata?: { startedAt: number; requestId: string };
    };
    const durationMs = config.metadata?.startedAt ? Date.now() - config.metadata.startedAt : undefined;

    debugLog('http', 'response', {
      requestId: config.metadata?.requestId,
      method: config.method?.toUpperCase(),
      url: config.url,
      status: response.status,
      durationMs,
    });

    return response;
  },
  (error) => {
    const config = error.config as
      | (typeof error.config & {
          metadata?: { startedAt: number; requestId: string };
        })
      | undefined;
    const durationMs = config?.metadata?.startedAt ? Date.now() - config.metadata.startedAt : undefined;

    debugLog(
      'http',
      'response_error',
      {
        requestId: config?.metadata?.requestId,
        method: config?.method?.toUpperCase(),
        url: config?.url,
        status: error.response?.status,
        durationMs,
        message: error.message,
      },
      'error'
    );

    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Falha de conexao.';
    }

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

  return 'Erro inesperado.';
}
