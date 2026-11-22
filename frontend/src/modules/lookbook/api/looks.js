export async function getLooks(signal) {
  const response = await fetch('/api/lookbook/looks', { signal });
  if (!response.ok) throw new Error('No se pudo cargar el lookbook.');
  const looks = await response.json();
  if (!Array.isArray(looks)) throw new Error('El catálogo de looks no está disponible.');
  return looks;
}
