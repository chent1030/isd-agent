import * as dotenv from 'dotenv'
import path from 'node:path'
import fs from 'node:fs'

// 加载 .env：优先 server 目录，其次 web 根目录
const envCandidates = [
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), '..', '.env'),
]
for (const candidate of envCandidates) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate })
    break
  }
}

function firstDefined(...values: unknown[]) {
  return values.find(value => value !== undefined && value !== null && value !== '')
}

function isEnabledEnv(value: string | undefined) {
  return ['1', 'true', 'yes', 'on'].includes(String(value ?? '').trim().toLowerCase())
}

function toNumber(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const DEFAULT_CABINET_API_BASE_URL = 'https://cshzeroapi.uabcbattery.com/unify/v1/1'
const DEFAULT_LOCK_SERVER_IP = '10.134.231.111'
const DEFAULT_LOCK_SERVER_PORT = 10123
const DEFAULT_TWIN_LEFT_CABINET_NO = '1'
const DEFAULT_TWIN_RIGHT_CABINET_NO = '2'
const DEFAULT_IDLE_TIMEOUT_MINUTES = 5

export const env = {
  port: toNumber(process.env.PORT, 3000),

  faceApiUrl: process.env.FACE_API_URL ?? '',

  skipFaceAuth: isEnabledEnv(process.env.SKIP_FACE_AUTH),
  skipFaceAuthUser: {
    empName: firstDefined(process.env.SKIP_FACE_AUTH_EMP_NAME, process.env.VITE_SKIP_FACE_AUTH_EMP_NAME) ?? '',
    empWorkNo: firstDefined(process.env.SKIP_FACE_AUTH_EMP_WORK_NO, process.env.VITE_SKIP_FACE_AUTH_EMP_WORK_NO) ?? '',
  },

  idleTimeoutMinutes: (() => {
    const minutes = Number(String(process.env.TERMINAL_IDLE_TIMEOUT_MINUTES ?? '').trim())
    return Number.isFinite(minutes) && minutes > 0 ? minutes : DEFAULT_IDLE_TIMEOUT_MINUTES
  })(),

  cabinetApiBaseUrl: (process.env.CABINET_LEDGER_API_BASE_URL || DEFAULT_CABINET_API_BASE_URL).replace(/\/+$/, ''),

  lockServerIp: firstDefined(process.env.CABINET_LOCK_SERVER_IP, process.env.CABINET_SERVER_IP) as string || DEFAULT_LOCK_SERVER_IP,
  lockServerPort: (() => {
    const value = toNumber(firstDefined(process.env.CABINET_LOCK_SERVER_PORT, process.env.CABINET_SERVER_PORT), DEFAULT_LOCK_SERVER_PORT)
    return value > 0 ? value : DEFAULT_LOCK_SERVER_PORT
  })(),

  twinLeftCabinetNo: String(firstDefined(process.env.CABINET_TWIN_LEFT_CABINET_NO, process.env.CABINET_LEFT_CABINET_NO) || DEFAULT_TWIN_LEFT_CABINET_NO).trim(),
  twinRightCabinetNo: String(firstDefined(process.env.CABINET_TWIN_RIGHT_CABINET_NO, process.env.CABINET_RIGHT_CABINET_NO) || DEFAULT_TWIN_RIGHT_CABINET_NO).trim(),

  webClientDist: process.env.WEB_CLIENT_DIST ?? '',
}

export const appConfig = {
  skipFaceAuth: env.skipFaceAuth,
  skipFaceAuthUser: env.skipFaceAuthUser,
  idleTimeoutMinutes: env.idleTimeoutMinutes,
  idleTimeoutMs: Math.round(env.idleTimeoutMinutes * 60 * 1000),
}

export function normalizeOperator(operator?: { empName?: string; empWorkNo?: string }) {
  const empWorkNo = String(operator?.empWorkNo || '').trim()
  const empName = String(operator?.empName || '').trim()
  if (!empWorkNo || !empName) throw new Error('缺少操作人身份信息，请先完成人脸认证')
  return { empWorkNo, empName }
}
