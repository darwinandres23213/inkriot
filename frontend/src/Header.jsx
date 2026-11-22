import logo from '../assets/icons/logo-nav.png';

export default function Header({ isLogin }) {
  return (
    <header className="nav">
      <nav className="nav__links" aria-label="Principal">
        <a href="/#drop">Tienda</a>
        <a href="/#manifiesto">Acerca de</a>
        <a className="nav__lookbook" href="/#lookbook">Lookbook</a>
      </nav>
      <a className="nav__logo glitch" href="/#top" aria-label="Inkriot, inicio" style={{ '--img': `url("${logo}")` }}>
        <img src={logo} alt="Inkriot" />
      </a>
      <div className="nav__right">
        <a className="nav__contact" href="/#contacto">Contacto</a>
        <button type="button" className="icon" aria-label="Buscar">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
        </button>
        <a className="icon" href="/login" aria-label="Cuenta" title="Cuenta" aria-current={isLogin ? 'page' : undefined}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c1-5 15-5 16 0" /></svg>
        </a>
        <button type="button" className="icon" aria-label="Carrito">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h3l2 12h11l2-8H7" /><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></svg>
        </button>
      </div>
    </header>
  );
}
