import { API_BASE_URL } from '../../../shared/config/api'
import { apiRequest } from '../../../shared/api/apiClient'
import { getRefreshToken } from '../model/authStorage'
import type { AuthUser, LoginCredentials, LoginResponse } from '../model/authTypes'

export async function loginRequest(credentials: LoginCredentials) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    body: JSON.stringify(credentials),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('Invalid credentials')
  }

  return (await response.json()) as LoginResponse
}

export function getCurrentUserRequest() {
  return apiRequest<AuthUser>('/auth/me')
}

export async function logoutRequest() {
  const refreshToken = getRefreshToken()

  if (!refreshToken) {
    return
  }

  await apiRequest<{ success: boolean }>('/auth/logout', {
    body: JSON.stringify({ refreshToken }),
    method: 'POST',
    retryOnUnauthorized: false,
  })
}
