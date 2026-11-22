import { useState } from 'react';
import ShirtDesignerDialog from './ShirtDesignerDialog.jsx';
import '../styles/designer.css';

export default function ShirtDesignerEntry() {
  const [opened, setOpened] = useState(false);
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn designer-launch" type="button" aria-haspopup="dialog" aria-expanded={open}
        onClick={() => { setOpened(true); setOpen(true); }}>
        <i className="fa-solid fa-cube" aria-hidden="true" /> PERSONALIZA TU CAMISETA AQUI
      </button>
      {opened && <ShirtDesignerDialog open={open} onDismiss={() => setOpen(false)} />}
    </>
  );
}
