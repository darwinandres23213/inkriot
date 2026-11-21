import { useState } from 'react';

function Newsletter() {
  const [feedback, setFeedback] = useState({ state: 'idle', message: '' });
  const sending = feedback.state === 'sending';

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = form.elements.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFeedback({ state: 'error', message: 'Escribe un correo válido.' });
      return;
    }

    setFeedback({ state: 'sending', message: '' });
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error('Suscripción rechazada');
      form.reset();
      setFeedback({ state: 'success', message: 'Listo. Ya eres parte del riot.' });
    } catch {
      setFeedback({ state: 'error', message: 'No pudimos suscribirte. Inténtalo de nuevo.' });
    }
  }

  return (
    <form className="news" id="newsletter" noValidate onSubmit={handleSubmit}>
      <h2 className="script">Únete al Riot</h2>
      <label htmlFor="email">Suscríbete para recibir drops exclusivos, noticias y más.</label>
      <div className="news__row">
        <input id="email" name="email" type="email" placeholder="Tu email" autoComplete="email" required readOnly={sending} />
        <button type="submit" aria-label="Suscribirme" disabled={sending}>→</button>
      </div>
      <p className={feedback.state === 'error' ? 'news__msg err' : 'news__msg'} id="newsMsg" role="status">{feedback.message}</p>
    </form>
  );
}

export default function Footer() {
  return (
    <footer className="footer" id="contacto">
      <Newsletter />
      <svg className="star" viewBox="0 0 40 120" aria-hidden="true"><path d="M20 0l3 52 17 8-17 8-3 52-3-52L0 60l17-8z" /></svg>
      <div className="footer__right">
        <p>Síguenos en:</p>
        <div className="social">
          <a href="#" aria-label="Instagram" target="_blank" rel="noopener"><i className="fa-brands fa-instagram" /></a>
          <a href="#" aria-label="TikTok" target="_blank" rel="noopener"><i className="fa-brands fa-tiktok" /></a>
          <a href="#" aria-label="WhatsApp" target="_blank" rel="noopener"><i className="fa-brands fa-whatsapp" /></a>
        </div>
        <small>
          Inkriot © 2025. Todos los derechos reservados.<br />
          <a href="#">Términos y Condiciones</a> | <a href="#">Política y Privacidad</a> | <a href="#">Contacto</a>
        </small>
      </div>
    </footer>
  );
}
