export function getSpread(looks, index, singlePage) {
  if (index === 0) {
    return { left: { kind: 'endpaper' }, right: { kind: 'index' }, label: 'Índice' };
  }

  const lookIndex = singlePage ? Math.floor((index - 1) / 2) : index - 1;
  const look = looks[lookIndex];
  const photo = { kind: 'photo', look, lookIndex };
  const notes = { kind: 'notes', look, lookIndex };
  const label = `Look ${lookIndex + 1} de ${looks.length}`;
  if (!singlePage) return { left: notes, right: photo, label };
  const isPhoto = index % 2 === 1;
  return { right: isPhoto ? photo : notes, label: label + (isPhoto ? ' · Foto' : ' · Ficha') };
}

export function printNumber(number) {
  return String(number).padStart(2, '0');
}
