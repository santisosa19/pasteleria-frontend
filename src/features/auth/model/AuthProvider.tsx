import { PropsWithChildren, useEffect, useState } from 'react'
import { setUnauthorizedHandler } from '../../../shared/api/apiClient'
import { getCurrentUserRequest, loginRequest, logoutRequest } from '../api/authApi'
import { AuthContext } from './AuthContext'
import { clearAuthSession, getStoredSession, saveAuthSession } from './authStorage'
import type { AuthUser, LoginCredentials } from './authTypes'

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredSession()?.user ?? null)
  const [isInitializing, setIsInitializing] = useState(() => Boolean(getStoredSession()))
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    setUnauthorizedHandler(() => {
      clearAuthSession()
      setUser(null)
      setError('Tu sesion expiro. Volve a ingresar.')
    })

    async function loadSession() {
      if (!getStoredSession()) {
        setIsInitializing(false)
        return
      }

      try {
        const currentUser = await getCurrentUserRequest()

        if (isMounted) {
          setUser(currentUser)
        }
      } catch {
        clearAuthSession()

        if (isMounted) {
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false)
        }
      }
    }

    void loadSession()

    return () => {
      isMounted = false
      setUnauthorizedHandler(null)
    }
  }, [])

  async function login(credentials: LoginCredentials) {
    setError('')

    const cleanUsername = credentials.username.trim()

    if (!cleanUsername || !credentials.password) {
      setError('Completa usuario y contrasena para entrar.')
      return
    }

    setIsLoading(true)

    try {
      const session = await loginRequest({
        password: credentials.password,
        username: cleanUsername,
      })

      saveAuthSession(session)
      setUser(session.user)
    } catch {
      setError('Usuario o contrasena incorrectos.')
    } finally {
      setIsLoading(false)
    }
  }

  async function logout() {
    try {
      await logoutRequest()
    } catch {
      // Local logout must still work if the API is unavailable.
    }

    clearAuthSession()
    setError('')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ error, isInitializing, isLoading, login, logout, user }}>
      {children}
    </AuthContext.Provider>
  )
}
