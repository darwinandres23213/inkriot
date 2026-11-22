import { useLayoutEffect, useRef } from 'react';

export function useModalDialog(open) {
  const dialog = useRef(null);
  useLayoutEffect(() => {
    if (!open) return;
    const element = dialog.current;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = overflow;
    };
  }, [open]);
  return dialog;
}
