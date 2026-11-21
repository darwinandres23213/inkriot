// Colocar la Api cuando este el backend
const API_URL = '/api/subscribe';

const form = document.getElementById('newsletter');
const msg = document.getElementById('newsMsg');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = form.email.value.trim();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  msg.classList.toggle('err', !valid);
  if (!valid) { msg.textContent = 'Escribe un correo válido.'; return; }

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!res.ok) throw new Error();
    msg.textContent = 'Listo. Ya eres parte del riot.';
    form.reset();
  } catch {
    msg.classList.add('err');
    msg.textContent = 'No pudimos suscribirte. Inténtalo de nuevo.';
  }
});

// Activa el glitch de los titulares cuando entran en pantalla
const revealGlitch = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('in'); revealGlitch.unobserve(en.target); }
  });
}, { threshold: 0.4 });
document.querySelectorAll('.script').forEach((el) => revealGlitch.observe(el));
