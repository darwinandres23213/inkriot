import { useEffect } from 'react';
import Footer from './Footer.jsx';
import LookbookSection from './modules/lookbook/components/LookbookSection.jsx';
import ShirtDesignerEntry from './modules/shirt-designer/components/ShirtDesignerEntry.jsx';
import logo from '../assets/icons/logo.png';
import heroLeft from '../assets/images/hero-left.png';
import heroRight from '../assets/images/hero-right.png';
import shirtItadori from '../assets/images/product-shirt1.png';
import shirtToji from '../assets/images/product-shirt2.png';
import shirtHakari from '../assets/images/product-shirt3.png';
import manifestoModel from '../assets/images/manifesto-model.png';
import manifestoEye from '../assets/images/manifesto-eye.png';

const dropProducts = [
  { image: shirtItadori, name: 'Camiseta Itadori' },
  { image: shirtToji, name: 'Camisa Toji' },
  { image: shirtHakari, name: 'Camiseta Hakari' },
];

export default function Home() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.4 });
    document.querySelectorAll('.script').forEach((heading) => observer.observe(heading));
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <main id="top">
        <section className="hero torn">
          <img className="hero__img hero__img--l" src={heroLeft} alt="Modelo con camiseta No Fear" />
          <img className="hero__img hero__img--r" src={heroRight} alt="Hoodie No Fear vista de espalda" />
          <div className="hero__center">
            <h1 className="logo glitch" style={{ '--img': `url("${logo}")` }}><img src={logo} alt="INKRIOT" /></h1>
            <p className="slogan">Wear the chaos</p>
            <div className="hero__actions">
              <a className="btn" href="#drop">Compra Ahora <span aria-hidden="true">→</span></a>
              <ShirtDesignerEntry />
            </div>
          </div>
        </section>
        <section className="drop torn" id="drop">
          <div className="drop__text">
            <h2 className="script">Nuevo<br /><em>Drop</em></h2>
            <p>La última colección<br />está aquí.<br />Cantidad limitada.<br />No te lo pierdas.</p>
            <a className="btn" href="#">Comprar el Drop <span aria-hidden="true">→</span></a>
          </div>
          <ul className="drop__grid">
            {dropProducts.map(({ image, name }) => (
              <li key={name}><a href="#"><img src={image} alt={name} /></a></li>
            ))}
          </ul>
        </section>
        <LookbookSection />
        <section className="manifesto torn" id="manifiesto">
          <img className="manifesto__model" src={manifestoModel} alt="Modelo con camiseta blanca No Fear" />
          <div className="manifesto__text">
            <h2 className="script">Nuestro<br /><em>Manifiesto</em></h2>
            <p className="strong">No estamos aquí para seguir.<br />Estamos aquí para romper.</p>
            <p>Inkriot es más que ropa.<br />Es una declaración, una expresión,<br />una cultura para lo más underground.</p>
            <a className="btn" href="#">Aprender más <span aria-hidden="true">→</span></a>
          </div>
          <img className="manifesto__eye" src={manifestoEye} alt="" aria-hidden="true" />
        </section>
      </main>
      <Footer />
    </>
  );
}
