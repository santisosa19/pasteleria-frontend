export type AuthUser = {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: {
    id: string
    name: string
  }
  permissions: string[]
}

export type LoginCredentials = {
  username: string
  password: string
}

export type LoginResponse = {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export type AuthSession = LoginResponse
