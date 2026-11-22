import { expect, test } from '@playwright/test';

const api = '**/api/lookbook/looks';
const launcher = (page) => page.getByRole('button', { name: 'Abrir el lookbook' });
const reader = (page) => page.getByRole('dialog', { name: 'Lookbook' });
const position = (dialog) => dialog.getByRole('status', { name: 'Página actual' });

async function openReader(page) {
  await launcher(page).click();
  const dialog = reader(page);
  await expect(dialog).toHaveAttribute('data-phase', 'reading');
  return dialog;
}

test('la cubierta cerrada se acerca desde el índice de la web, gira y abre el índice del álbum', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.getByRole('navigation').getByRole('link', { name: 'Lookbook' }).click();
  await expect(page).toHaveURL(/\/#lookbook$/);
  await expect(reader(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Página siguiente' })).toHaveCount(0);
  const [travel] = await Promise.all([
    page.evaluate(() => new Promise((resolve) => {
      let source;
      function remember(event) {
        if (event.target.closest('.album-launch')) {
          source = document.querySelector('.album-launch__art').getBoundingClientRect();
          document.removeEventListener('click', remember, true);
        }
      }
      function measure(event) {
        if (event.animationName !== 'jacket-approach') return;
        document.removeEventListener('animationstart', measure);
        const jacket = event.target;
        const animations = jacket.getAnimations({ subtree: true });
        function seek(fraction) {
          for (const animation of animations) {
            animation.pause();
            animation.currentTime = animation.effect.getTiming().duration * fraction;
          }
        }
        seek(0);
        const start = jacket.getBoundingClientRect();
        seek(.7);
        const end = jacket.getBoundingClientRect();
        const target = document.querySelector('.album__side--right').getBoundingClientRect();
        const lid = jacket.querySelector('.album-arrival__lid');
        const angle = new DOMMatrix(getComputedStyle(lid).transform);
        resolve({
          originError: Math.max(Math.abs(start.left - source.left), Math.abs(start.top - source.top)),
          targetError: Math.max(Math.abs(end.left - target.left), Math.abs(end.bottom - target.bottom)),
          enlargement: end.width / start.width, rotation: Math.abs(angle.m13),
        });
        animations.forEach((animation) => animation.play());
      }
      document.addEventListener('click', remember, true);
      document.addEventListener('animationstart', measure);
    })),
    launcher(page).click(),
  ]);
  expect(travel.originError).toBeLessThan(2);
  expect(travel.targetError).toBeLessThan(2);
  expect(travel.enlargement).toBeGreaterThan(1.15);
  expect(travel.rotation).toBeGreaterThan(.1);
  const dialog = reader(page);
  await expect(dialog).toHaveAttribute('data-phase', 'reading');
  await expect(dialog.getByRole('heading', { name: 'Índice' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
  await dialog.getByRole('button', { name: 'Abrir Rompe el molde' }).click();
  await expect(position(dialog)).toHaveText('Look 1 de 1');
  const photo = dialog.getByRole('img', { name: /modelo con gafas/i });
  await expect.poll(() => photo.evaluate((image) => image.naturalWidth)).toBe(1086);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(launcher(page)).toBeFocused();
  await launcher(page).press('Enter');
  await expect(reader(page).getByRole('button', { name: 'Abrir Rompe el molde' })).toBeVisible();
  expect(errors).toEqual([]);
});

for (const width of [1280, 375]) {
  test(`la tapa se pliega y vuelve a la cubierta de la portada a ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 820 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/#lookbook');
    const dialog = await openReader(page);
    if (width === 1280) await dialog.getByRole('button', { name: 'Abrir Rompe el molde' }).click();
    await page.setViewportSize({ width, height: 740 });
    await expect(dialog.locator('.album__side--left')).toHaveCount(width === 1280 ? 1 : 0);
    await expect(position(dialog)).toHaveText(width === 1280 ? 'Look 1 de 1' : 'Índice');

    if (width === 1280) await dialog.getByRole('button', { name: 'Cerrar el lookbook' }).click();
    else await page.mouse.click(3, 3);
    const motion = await dialog.locator('.album-arrival').evaluate((jacket) => {
      const modal = jacket.closest('dialog');
      const animations = modal.getAnimations({ subtree: true }).filter((a) => /^(reader-|jacket-)/.test(a.animationName));
      const reversing = animations.length > 0 && animations.every((a) => a.playbackRate < 0);
      function seek(progress) {
        for (const animation of animations) {
          animation.pause();
          animation.currentTime = animation.effect.getTiming().duration * progress;
        }
      }
      seek(.7);
      const projected = new DOMMatrix(getComputedStyle(jacket.querySelector('.album-arrival__lid')).transform);
      seek(.00001);
      const result = {
        reversing, fold: Math.abs(projected.m13), landing: jacket.getBoundingClientRect().toJSON(),
        insideTitle: jacket.querySelector('.album-arrival__inside h3')?.textContent ?? null,
        backdrop: Number(getComputedStyle(modal, '::backdrop').opacity),
        locked: modal.matches(':modal') && modal.querySelector('.album').inert && document.body.style.overflow === 'hidden',
      };
      animations.forEach((animation) => animation.play());
      return result;
    });
    expect(motion.reversing).toBe(true);
    expect(motion.fold).toBeGreaterThan(.15);
    expect(motion.insideTitle).toBe(width === 1280 ? 'Rompe el molde' : null);
    expect(motion.backdrop).toBeLessThan(.05);
    expect(motion.locked).toBe(true);
    await expect(dialog).toHaveCount(0);
    const cover = await page.locator('.album-launch__art').boundingBox();
    for (const key of ['x', 'y', 'width', 'height']) {
      expect(Math.abs(motion.landing[key] - cover[key])).toBeLessThan(2);
    }
    await expect(launcher(page)).toBeFocused();
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  });

  test(`el borde de la hoja queda completo en ambos sentidos a ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 740 });
    await page.goto('/#lookbook');
    const dialog = await openReader(page);
    await expect(dialog.getByRole('button', { name: 'Abrir Rompe el molde' })).toBeVisible();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    for (const direction of ['siguiente', 'anterior']) {
      const [shape] = await Promise.all([
        dialog.evaluate((element) => new Promise((resolve) => {
          function measure(event) {
            if (event.animationName !== 'album-turn') return;
            element.removeEventListener('animationstart', measure);
            const leaf = event.target.closest('.album-leaf');
            const animations = leaf.getAnimations({ subtree: true });
            const frame = leaf.closest('.album__stage').getBoundingClientRect();
            let overshoot = 0, curl = 0;
            for (const progress of [.08, .25, .36, .5, .67, .82, .95]) {
              for (const animation of animations) {
                animation.pause();
                animation.currentTime = animation.effect.getTiming().duration * progress;
              }
              for (const face of leaf.querySelectorAll('.album-leaf__face')) {
                const rect = face.getBoundingClientRect();
                overshoot = Math.max(overshoot, frame.top - rect.top, rect.bottom - frame.bottom);
              }
              const bend = event.target.querySelector('.album-leaf__panel');
              curl = Math.max(curl, Math.abs(new DOMMatrix(getComputedStyle(bend).transform).m13));
            }
            resolve({ overshoot, curl, bottom: frame.bottom, height: innerHeight, backward: leaf.dataset.backward });
            animations.forEach((animation) => animation.play());
          }
          element.addEventListener('animationstart', measure);
        })),
        dialog.getByRole('button', { name: 'Página ' + direction }).click(),
      ]);
      expect(shape.overshoot).toBeLessThan(1);
      expect(shape.bottom).toBeLessThan(shape.height);
      expect(shape.curl).toBeGreaterThan(.15);
      expect(shape.backward).toBe(String(direction === 'anterior'));
      await expect(dialog.locator('.album-leaf')).toHaveCount(0);
    }
    await expect(position(dialog)).toHaveText('Índice');
  });
}

test('el índice abre cada look, conserva la selección al cambiar de ancho y admite el teclado', async ({ page }) => {
  await page.route(api, async (route) => {
    const [first] = await (await route.fetch()).json();
    await route.fulfill({ json: [first, { ...first, id: 'otra-ficha', title: 'Otro look', detail: null }] });
  });
  await page.goto('/#lookbook');
  const dialog = await openReader(page);
  const book = dialog.getByRole('group', { name: 'Álbum de looks' });
  await expect(book).toBeFocused();
  await expect(dialog.locator('.album-arrival')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Abrir Otro look' }).click();
  await expect(position(dialog)).toHaveText('Look 2 de 2');
  await expect(dialog.getByRole('heading', { name: 'Otro look' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Página siguiente' })).toBeDisabled();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(position(dialog)).toHaveText('Look 2 de 2 · Foto');
  await book.press('ArrowRight');
  await expect(position(dialog)).toHaveText('Look 2 de 2 · Ficha');
  await page.setViewportSize({ width: 1280, height: 820 });
  await book.press('Home');
  await expect(position(dialog)).toHaveText('Índice');
  await book.press('ArrowRight');
  await expect(position(dialog)).toHaveText('Look 1 de 2');
  await book.press('End');
  await expect(position(dialog)).toHaveText('Look 2 de 2');
  await dialog.getByRole('button', { name: 'Volver al índice' }).click();
  await expect(position(dialog)).toHaveText('Índice');
  await expect(dialog.locator('.album-leaf')).toHaveCount(0);
});

test('el índice permite reintentar una carga fallida y muestra el catálogo vacío', async ({ page }) => {
  let release;
  const wait = new Promise((resolve) => { release = resolve; });
  await page.route(api, async (route) => {
    await wait;
    await route.fulfill({ status: 503, json: { error: 'Servicio no disponible' } });
  });
  await page.goto('/#lookbook', { waitUntil: 'domcontentloaded' });
  const dialog = await openReader(page);
  await expect(dialog.getByText('Cargando el álbum…')).toBeVisible();
  release();
  await expect(dialog.getByRole('alert')).toHaveText('No se pudo cargar el lookbook.');
  await page.route(api, (route) => route.fulfill({ json: [] }));
  await dialog.getByRole('button', { name: 'Reintentar' }).click();
  await expect(dialog.getByText('Todavía no hay looks publicados.')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Página siguiente' })).toBeDisabled();
});

test('se puede interrumpir la apertura y cerrar desde el fondo con retorno del foco', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/#lookbook');
  await launcher(page).click();
  await expect(reader(page)).toHaveAttribute('data-phase', 'opening');
  const checkpoint = await reader(page).locator('.album-arrival').evaluateHandle((jacket) => {
    const modal = jacket.closest('dialog');
    for (const animation of modal.getAnimations({ subtree: true })) {
      if (!/^(reader-|jacket-)/.test(animation.animationName)) continue;
      animation.pause();
      animation.currentTime = animation.effect.getTiming().duration * .32;
    }
    const before = jacket.getBoundingClientRect();
    const change = new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        if (modal.dataset.phase !== 'closing') return;
        observer.disconnect();
        const after = jacket.getBoundingClientRect();
        resolve(Math.max(Math.abs(after.width - before.width), Math.abs(after.x - before.x), Math.abs(after.y - before.y)));
      });
      observer.observe(modal, { attributes: true, attributeFilter: ['data-phase'] });
    });
    return { change, fromWidth: Number(jacket.style.getPropertyValue('--from-width')) };
  });
  expect(await checkpoint.evaluate((sample) => sample.fromWidth)).toBeLessThan(.95);
  await page.keyboard.press('Escape');
  expect(await checkpoint.evaluate((sample) => sample.change)).toBeLessThan(2);
  await checkpoint.dispose();
  await expect(reader(page)).toHaveCount(0);
  await expect(launcher(page)).toBeFocused();
  await launcher(page).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(reader(page)).toHaveAttribute('data-phase', 'reading');
  await expect(reader(page).getByRole('heading', { name: 'Índice' })).toBeVisible();
  await reader(page).getByRole('button', { name: 'Abrir Rompe el molde' }).click();
  const detailFits = await reader(page).locator('.album-notes').evaluate((sheet) =>
    sheet.querySelector('figcaption').getBoundingClientRect().bottom <= sheet.getBoundingClientRect().bottom);
  expect(detailFits).toBe(true);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await page.mouse.click(3, 3);
  await expect(reader(page)).toHaveCount(0);
  await expect(launcher(page)).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
});

test.describe('álbum táctil', () => {
  test.use({ viewport: { width: 320, height: 660 }, hasTouch: true, isMobile: true });
  test('se abre desde el login, pasa del índice a la foto y desliza a la ficha', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('navigation').getByRole('link', { name: 'Lookbook' }).tap();
    await expect(page).toHaveURL(/\/#lookbook$/);
    const dialog = await openReader(page);
    await expect(position(dialog)).toHaveText('Índice');
    await dialog.getByRole('button', { name: 'Abrir Rompe el molde' }).tap();
    await expect(position(dialog)).toHaveText('Look 1 de 1 · Foto');
    const photo = dialog.getByRole('img', { name: /modelo con gafas/i });
    const bounds = await photo.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
    expect(bounds.y + bounds.height).toBeLessThan(660);
    const session = await page.context().newCDPSession(page);
    const y = Math.round(bounds.y + bounds.height / 2);
    for (const [type, x] of [['touchStart', 236], ['touchMove', 184], ['touchMove', 108], ['touchEnd', 0]]) {
      await session.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
    }
    await expect(position(dialog)).toHaveText('Look 1 de 1 · Ficha');
    await expect(dialog.getByRole('button', { name: 'Página siguiente' })).toBeDisabled();
    await dialog.getByRole('button', { name: 'Cerrar el lookbook' }).tap();
    await expect(dialog).toHaveCount(0);
    await expect(launcher(page)).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  });
});
