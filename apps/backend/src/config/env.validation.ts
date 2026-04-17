type EnvShape = Record<string, string | undefined>;

export function validateEnv(env: EnvShape) {
  if (env.PORT && Number.isNaN(Number(env.PORT))) {
    throw new Error('PORT must be a number');
  }

  if ((env.SUPABASE_URL && !env.SUPABASE_SERVICE_ROLE_KEY) || (!env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY)) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured together');
  }

  const resendKeys = [env.RESEND_API_KEY, env.RESEND_FROM_EMAIL, env.APP_WEB_URL].filter(Boolean);
  if (resendKeys.length > 0 && resendKeys.length < 3) {
    throw new Error('Configure RESEND_API_KEY, RESEND_FROM_EMAIL e APP_WEB_URL juntos');
  }

  const googleIds = [env.GOOGLE_WEB_CLIENT_ID, env.GOOGLE_ANDROID_CLIENT_ID, env.GOOGLE_IOS_CLIENT_ID].filter(Boolean);
  if (googleIds.length > 0 && googleIds.length < 3) {
    throw new Error('Configure GOOGLE_WEB_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID and GOOGLE_IOS_CLIENT_ID together');
  }

  return env;
}
