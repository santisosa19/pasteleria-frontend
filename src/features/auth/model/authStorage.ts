import type { AuthSession, AuthUser } from './authTypes'

const storageKeys = {
  accessToken: 'pasteleria:accessToken',
  refreshToken: 'pasteleria:refreshToken',
  user: 'pasteleria:user',
} as const

export function getStoredUser() {
  const storedUser = localStorage.getItem(storageKeys.user)

  if (!storedUser) {
    return null
  }

  try {
    return JSON.parse(storedUser) as AuthUser
  } catch {
    clearAuthSession()
    return null
  }
}

export function getAccessToken() {
  return localStorage.getItem(storageKeys.accessToken)
}

export function getRefreshToken() {
  return localStorage.getItem(storageKeys.refreshToken)
}

export function getStoredSession(): AuthSession | null {
  const accessToken = getAccessToken()
  const refreshToken = getRefreshToken()
  const user = getStoredUser()

  if (!accessToken || !refreshToken || !user) {
    return null
  }

  return { accessToken, refreshToken, user }
}

export function saveAuthSession(session: AuthSession) {
  localStorage.setItem(storageKeys.accessToken, session.accessToken)
  localStorage.setItem(storageKeys.refreshToken, session.refreshToken)
  localStorage.setItem(storageKeys.user, JSON.stringify(session.user))
}

export function clearAuthSession() {
  localStorage.removeItem(storageKeys.accessToken)
  localStorage.removeItem(storageKeys.refreshToken)
  localStorage.removeItem(storageKeys.user)
}
