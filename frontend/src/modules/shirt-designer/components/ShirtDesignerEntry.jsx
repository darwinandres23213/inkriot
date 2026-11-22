import { lazy, Suspense, useState } from 'react';
import '../styles/designer.css';

const ShirtDesignerDialog = lazy(() => import('./ShirtDesignerDialog.jsx'));

export default function ShirtDesignerEntry() {
  const [opened, setOpened] = useState(false);
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn designer-launch" type="button" aria-haspopup="dialog"
        onClick={() => { setOpened(true); setOpen(true); }}>
        <i className="fa-solid fa-cube" aria-hidden="true" /> PERSONALIZA TU CAMISETA AQUI
      </button>
      {opened && <Suspense fallback={<span className="designer-loading" role="status">Cargando visualizador…</span>}>
        <ShirtDesignerDialog open={open} onDismiss={() => setOpen(false)} />
      </Suspense>}
    </>
  );
}
