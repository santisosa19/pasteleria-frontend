import { LoginForm } from '../../features/auth/components/LoginForm'

export function LoginPage() {
  return (
    <main className="login-shell">
      <div className="ambient ambient-cookie" aria-hidden="true" />
      <div className="ambient ambient-heart" aria-hidden="true" />
      <div className="ambient ambient-macaron" aria-hidden="true" />

      <section className="login-card" aria-label="Inicio de sesion">
        <img className="brand-watermark" src="/logo.jpeg" alt="" aria-hidden="true" />

        <div className="brand-strip">
          <img src="/logo.jpeg" alt="Agui Pasteleria" />
        </div>

        <LoginForm />
      </section>
    </main>
  )
}
