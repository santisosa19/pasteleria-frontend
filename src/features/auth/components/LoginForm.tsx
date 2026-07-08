import { FormEvent, useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export function LoginForm() {
  const { error, isLoading, login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await login({ username, password })
    setPassword('')
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <label>
        <span>Usuario</span>
        <input
          autoComplete="username"
          name="username"
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Usuario"
          type="text"
          value={username}
        />
      </label>

      <label>
        <span>Contrasena</span>
        <input
          autoComplete="current-password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Contrasena"
          type="password"
          value={password}
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <button className="primary-button" disabled={isLoading} type="submit">
        {isLoading ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  )
}
