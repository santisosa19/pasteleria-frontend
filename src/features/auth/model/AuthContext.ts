import { createContext } from 'react'
import type { AuthUser, LoginCredentials } from './authTypes'

export type AuthContextValue = {
  error: string
  isInitializing: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  user: AuthUser | null
}

export const AuthContext = createContext<AuthContextValue | null>(null)
