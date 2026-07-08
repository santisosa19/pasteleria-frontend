import { clearAuthSession, getAccessToken, getRefreshToken, saveAuthSession } from '../../features/auth/model/authStorage'
import type { AuthSession } from '../../features/auth/model/authTypes'
import { API_BASE_URL } from '../config/api'

type ApiRequestOptions = RequestInit & {
  retryOnUnauthorized?: boolean
  skipAuth?: boolean
}

let unauthorizedHandler: (() => void) | null = null
let refreshPromise: Promise<AuthSession | null> | null = null

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}) {
  const response = await request(path, options)

  if (response.status === 401 && options.retryOnUnauthorized !== false) {
    const refreshedSession = await refreshSession()

    if (refreshedSession) {
      const retryResponse = await request(path, { ...options, retryOnUnauthorized: false })
      return parseResponse<T>(retryResponse)
    }

    unauthorizedHandler?.()
  }

  return parseResponse<T>(response)
}

async function request(path: string, options: ApiRequestOptions) {
  const headers = new Headers(options.headers)

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (!options.skipAuth) {
    const accessToken = getAccessToken()

    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`)
    }
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })
}

async function refreshSession() {
  const refreshToken = getRefreshToken()

  if (!refreshToken) {
    clearAuthSession()
    return null
  }

  refreshPromise ??= fetch(`${API_BASE_URL}/auth/refresh`, {
    body: JSON.stringify({ refreshToken }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
    .then(async (response) => {
      if (!response.ok) {
        clearAuthSession()
        return null
      }

      const session = (await response.json()) as AuthSession
      saveAuthSession(session)
      return session
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

async function parseResponse<T>(response: Response) {
  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('Content-Type') ?? ''
  const payload = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    throw new ApiError(getErrorMessage(payload, response.status), response.status)
  }

  return payload as T
}

function getErrorMessage(payload: unknown, status: number) {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = (payload as { message?: unknown }).message

    if (Array.isArray(message)) {
      return message.join(' ')
    }

    if (typeof message === 'string') {
      return message
    }
  }

  return status === 401 ? 'Tu sesion expiro. Volve a ingresar.' : 'No se pudo completar la operacion.'
}
