type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogPayload = Record<string, unknown> | undefined;

function nowMs() {
  if (typeof globalThis.performance?.now === 'function') {
    return globalThis.performance.now();
  }

  return Date.now();
}

function shouldLog() {
  return __DEV__;
}

function stringifyPayload(payload: LogPayload) {
  if (!payload) {
    return '';
  }

  try {
    return ` ${JSON.stringify(payload)}`;
  } catch {
    return ' [payload_unserializable]';
  }
}

export function debugLog(scope: string, message: string, payload?: LogPayload, level: LogLevel = 'debug') {
  if (!shouldLog()) {
    return;
  }

  const prefix = `[NearMe][${scope}] ${message}`;
  const suffix = stringifyPayload(payload);

  if (level === 'error') {
    console.error(`${prefix}${suffix}`);
    return;
  }

  if (level === 'warn') {
    console.warn(`${prefix}${suffix}`);
    return;
  }

  console.log(`${prefix}${suffix}`);
}

export async function measureAsync<T>(
  scope: string,
  label: string,
  action: () => Promise<T>,
  payload?: LogPayload
) {
  const startedAt = nowMs();
  debugLog(scope, `${label}:start`, payload);

  try {
    const result = await action();
    const durationMs = Math.round(nowMs() - startedAt);
    debugLog(scope, `${label}:success`, { ...payload, durationMs }, 'info');
    return result;
  } catch (error) {
    const durationMs = Math.round(nowMs() - startedAt);
    debugLog(
      scope,
      `${label}:error`,
      {
        ...payload,
        durationMs,
        error: error instanceof Error ? error.message : String(error),
      },
      'error'
    );
    throw error;
  }
}
