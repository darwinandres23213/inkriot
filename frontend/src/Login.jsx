import { useState } from 'react';

export default function Login() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    event.currentTarget.reset();
    setSubmitted(true);
  }

  return (
    <main className="login">
      <div className="login__photo" aria-hidden="true" />
      <div className="login__panel">
        <h1 className="script login__title" id="login-title">Iniciar <em>sesión</em></h1>
        <form className="login__form" aria-labelledby="login-title" method="post" onSubmit={handleSubmit} onChange={() => setSubmitted(false)}>
          <div className="login__field">
            <label htmlFor="login-email">Correo electrónico</label>
            <input id="login-email" name="email" type="email" autoComplete="username" placeholder="tu@correo.com" required />
          </div>
          <div className="login__field">
            <label htmlFor="login-password">Contraseña</label>
            <input id="login-password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <button className="btn login__submit" type="submit">Iniciar sesión <span aria-hidden="true">→</span></button>
          <p className="login__status" role="status">
            {submitted && 'Formulario de prueba. El acceso aún no está habilitado.'}
          </p>
        </form>
        <a className="login__back" href="/"><span aria-hidden="true">←</span> Volver al inicio</a>
      </div>
    </main>
  );
}
