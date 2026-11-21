import { createRoot } from 'react-dom/client';
import Header from './Header.jsx';
import Home from './Home.jsx';
import Login from './Login.jsx';

const isLogin = /^\/login\/?$/i.test(window.location.pathname);
if (isLogin) document.title = 'Iniciar sesión — INKRIOT';

createRoot(document.getElementById('root')).render(
  <>
    <Header isLogin={isLogin} />
    {isLogin ? <Login /> : <Home />}
  </>,
);
