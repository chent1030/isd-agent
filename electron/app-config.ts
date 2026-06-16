const DEFAULT_IDLE_TIMEOUT_MINUTES = 5

export function normalizeIdleTimeoutMinutes(value: string | undefined) {
  const minutes = Number(String(value ?? '').trim())
  if (!Number.isFinite(minutes) || minutes <= 0) return DEFAULT_IDLE_TIMEOUT_MINUTES
  return minutes
}

export function getAppConfigFromEnv(env: NodeJS.ProcessEnv) {
  const idleTimeoutMinutes = normalizeIdleTimeoutMinutes(env.TERMINAL_IDLE_TIMEOUT_MINUTES)

  return {
    skipFaceAuth: ['1', 'true', 'yes', 'on'].includes(String(env.SKIP_FACE_AUTH ?? env.VITE_SKIP_FACE_AUTH ?? '').trim().toLowerCase()),
    skipFaceAuthUser: {
      empName: env.SKIP_FACE_AUTH_EMP_NAME ?? env.VITE_SKIP_FACE_AUTH_EMP_NAME ?? '',
      empWorkNo: env.SKIP_FACE_AUTH_EMP_WORK_NO ?? env.VITE_SKIP_FACE_AUTH_EMP_WORK_NO ?? '',
    },
    idleTimeoutMinutes,
    idleTimeoutMs: Math.round(idleTimeoutMinutes * 60 * 1000),
  }
}
