type EnvShape = Record<string, string | undefined>;

export function validateEnv(env: EnvShape) {
  if (env.PORT && Number.isNaN(Number(env.PORT))) {
    throw new Error('PORT must be a number');
  }

  return env;
}
