import { test, expect } from '@playwright/test';

async function openEditor(page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Visualizar camiseta 3D' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  return page.locator('.designer-model canvas');
}

async function artworkFile(page, name, type = 'image/png') {
  const base64 = await page.evaluate((format) => {
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ed1821';
    ctx.fillRect(0, 0, 116, 50);
    return canvas.toDataURL(format).split(',')[1];
  }, type);
  return { name, mimeType: type, buffer: Buffer.from(base64, 'base64') };
}

// Sample the rendered model, including its lighting and actual GPU texture.
async function inkBounds(canvas, ink) {
  const png = await canvas.screenshot();
  return canvas.page().evaluate(async ({ base64, ink }) => {
    const image = new Image();
    image.src = 'data:image/png;base64,' + base64;
    await image.decode();
    const copy = document.createElement('canvas');
    copy.width = image.width;
    copy.height = image.height;
    const ctx = copy.getContext('2d');
    ctx.drawImage(image, 0, 0);
    const { data } = ctx.getImageData(0, 0, copy.width, copy.height);
    let count = 0, left = copy.width, top = copy.height, right = 0, bottom = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const visible = ink === 'white' ? Math.min(r, g, b) > 155 :
        ink === 'red' ? r > 65 && r > 1.8 * g && r > 1.8 * b : g > 75 && b > 75 && g > 1.8 * r && b > 1.8 * r;
      if (!visible) continue;
      const x = (i / 4) % copy.width, y = Math.floor(i / 4 / copy.width);
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y); count++;
    }
    return { count, width: right - left, height: bottom - top, centerX: (left + right) / 2, centerY: (top + bottom) / 2 };
  }, { base64: png.toString('base64'), ink });
}

async function setSlider(slider, value) {
  await slider.evaluate((input, number) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, String(number));
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
  await expect(slider).toHaveValue(String(value));
}

test('los dos modelos muestran cinco tallas distinguibles en la camiseta renderizada', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const canvas = await openEditor(page);
  const radio = (label) => page.getByRole('radio', { name: label, exact: true });
  await expect(radio('Masculino')).toBeChecked();
  await expect(radio('M')).toBeChecked();
  await page.getByRole('button', { name: 'Frente', exact: true }).click();
  await page.getByRole('button', { name: 'Rojo', exact: true }).click();
  await expect.poll(async () => (await inkBounds(canvas, 'red')).count).toBeGreaterThan(4000);
  const widths = {};
  for (const model of ['Masculino', 'Femenino']) {
    await radio(model).check();
    let previous;
    for (const size of ['S', 'M', 'L', 'XL', 'XXL']) {
      await radio(size).check();
      await expect(canvas).toHaveAccessibleName(`Camiseta 3D, modelo ${model.toLowerCase()}, talla ${size}`);
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const garment = await inkBounds(canvas, 'red');
      if (previous) {
        expect(garment.width).toBeGreaterThan(previous.width + 2);
        expect(garment.height).toBeGreaterThan(previous.height + 1);
      }
      if (size === 'M') widths[model] = garment.width;
      previous = garment;
    }
  }
  expect(widths.Masculino).toBeGreaterThan(widths.Femenino + 15);
  expect(errors).toEqual([]);
});

test('conserva la selección hecha durante la carga y los estampados al cambiar de cuerpo y talla', async ({ page }) => {
  const radio = (label) => page.getByRole('radio', { name: label, exact: true });
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  await page.route(/\/crew-neck(?:-[\w-]+)?\.glb(?:\?.*)?$/, async (route) => {
    await pending;
    await route.continue();
  }, { times: 1 });
  const canvas = await openEditor(page);
  try {
    await radio('Femenino').check();
    await radio('XXL').check();
    await page.getByRole('button', { name: 'Espalda', exact: true }).click();
  } finally {
    release();
  }
  await expect.poll(async () => (await inkBounds(canvas, 'white')).count).toBeGreaterThan(4000);
  const initial = await inkBounds(canvas, 'white');
  await radio('Masculino').check();
  await expect.poll(async () => (await inkBounds(canvas, 'white')).width).toBeGreaterThan(initial.width + 15);
  await radio('Femenino').check();
  await expect.poll(async () => (await inkBounds(canvas, 'white')).width).toBe(initial.width);
  const input = page.getByLabel('Cargar imágenes');
  await input.setInputFiles(await artworkFile(page, 'dorso.png'));
  await expect(page.getByLabel('Imagen a editar')).toContainText('dorso.png');
  await setSlider(page.getByRole('slider', { name: 'Rotación' }), 35);
  await page.getByRole('button', { name: 'Frente', exact: true }).click();
  await input.setInputFiles(await artworkFile(page, 'pecho.png'));
  await expect.poll(async () => (await inkBounds(canvas, 'red')).count).toBeGreaterThan(200);
  const print = await inkBounds(canvas, 'red');
  await radio('Masculino').check();
  await radio('S').check();
  const changed = await inkBounds(canvas, 'red');
  expect(Math.abs(changed.width - print.width)).toBeLessThan(3);
  expect(Math.abs(changed.height - print.height)).toBeLessThan(3);
  expect(Math.abs(changed.centerX - print.centerX)).toBeLessThan(2);
  await page.getByRole('button', { name: 'Espalda', exact: true }).click();
  await expect(page.getByLabel('Imagen a editar')).toContainText('dorso.png');
  await expect(page.getByRole('slider', { name: 'Rotación' })).toHaveValue('35');
  await page.getByRole('button', { name: 'Cerrar visualizador' }).click();
  await page.getByRole('button', { name: 'Visualizar camiseta 3D' }).click();
  await expect(radio('Masculino')).toBeChecked();
  await expect(radio('S')).toBeChecked();
  await expect(page.getByRole('button', { name: 'Espalda', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => (await inkBounds(canvas, 'red')).count).toBeGreaterThan(200);
});

test('abre el modelo blanco, cambia de color, gira, muestra el catálogo vacío y devuelve el foco', async ({ page }) => {
  const exceptions = [];
  page.on('pageerror', (error) => exceptions.push(error.message));
  const canvas = await openEditor(page);
  await expect.poll(async () => (await inkBounds(canvas, 'white')).count).toBeGreaterThan(4000);
  await page.getByLabel('Elegir otro color').fill('#71915c');
  await expect(page.locator('.designer-color-name')).toHaveText('#71915C');
  await page.getByRole('button', { name: 'Rojo', exact: true }).click();
  await expect.poll(async () => (await inkBounds(canvas, 'red')).count).toBeGreaterThan(4000);
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 190, box.y + box.height / 2, { steps: 6 });
  await page.mouse.up();
  await expect(page.getByRole('button', { name: 'Espalda' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Predeterminados' }).click();
  await expect(page.getByText('Todavía no hay diseños predeterminados.')).toBeVisible();
  await page.keyboard.press('Escape');
  const launcher = page.getByRole('button', { name: 'Visualizar camiseta 3D' });
  await expect(launcher).toBeFocused();
  await launcher.click();
  await expect(page.getByRole('button', { name: 'Rojo', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => (await inkBounds(canvas, 'red')).count).toBeGreaterThan(4000);
  await page.getByRole('button', { name: 'Cerrar visualizador' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(exceptions).toEqual([]);
});

test('recupera el modelo al reabrir el editor después de una carga fallida', async ({ page }) => {
  await page.route(/\/crew-neck(?:-[\w-]+)?\.glb(?:\?.*)?$/, (route) => route.abort('failed'), { times: 1 });
  const canvas = await openEditor(page);
  await expect(page.getByRole('alert')).toContainText('No se pudo cargar la camiseta');
  await page.getByRole('button', { name: 'Rojo', exact: true }).click();
  await page.getByRole('button', { name: 'Cerrar visualizador' }).click();
  await page.getByRole('button', { name: 'Visualizar camiseta 3D' }).click();
  await expect.poll(async () => (await inkBounds(canvas, 'red')).count).toBeGreaterThan(4000);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('la XXL roja mantiene la estampa visible al inclinar ambos modelos para ver el bajo y las mangas', async ({ page }) => {
  const canvas = await openEditor(page);
  await page.getByRole('radio', { name: 'XXL', exact: true }).check();
  await page.getByRole('button', { name: 'Rojo', exact: true }).click();
  await page.getByLabel('Cargar imágenes').setInputFiles(await artworkFile(page, 'prueba-inclinada.png'));
  await page.getByLabel('Invertir colores').check();
  await page.getByRole('button', { name: 'Girar modelo' }).click();
  for (const model of ['Masculino', 'Femenino']) {
    await page.getByRole('radio', { name: model, exact: true }).check();
    await page.getByRole('button', { name: 'Frente', exact: true }).click();
    await expect.poll(async () => (await inkBounds(canvas, 'cyan')).count).toBeGreaterThan(200);
    const flat = await inkBounds(canvas, 'cyan');
    await canvas.focus();
    for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowRight');
    await expect.poll(async () => (await inkBounds(canvas, 'cyan')).centerY).toBeLessThan(flat.centerY - 12);
    const garment = await inkBounds(canvas, 'red');
    const frame = await canvas.boundingBox();
    expect(garment.count).toBeGreaterThan(4000);
    expect(garment.centerY + garment.height / 2).toBeLessThan(frame.height - 2);
    await expect(page.getByRole('alert')).toHaveCount(0);
  }
});

test('un estampado asimétrico conserva arriba e izquierda al verlo de frente y de espalda', async ({ page }) => {
  const canvas = await openEditor(page);
  const png = await page.evaluate(() => {
    const image = document.createElement('canvas');
    image.width = 120;
    image.height = 90;
    const ctx = image.getContext('2d');
    ctx.fillStyle = '#ed1821';
    ctx.fillRect(0, 0, 52, 38);
    ctx.fillStyle = '#00eced';
    ctx.fillRect(68, 52, 52, 38);
    return image.toDataURL('image/png').split(',')[1];
  });
  for (const side of ['Frente', 'Espalda']) {
    await page.getByRole('button', { name: side, exact: true }).click();
    await page.getByLabel('Cargar imágenes').setInputFiles({
      name: side + '.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64'),
    });
    await expect.poll(async () => {
      const red = await inkBounds(canvas, 'red');
      const cyan = await inkBounds(canvas, 'cyan');
      return red.count > 100 && cyan.count > 100 && red.centerX + 10 < cyan.centerX && red.centerY + 10 < cyan.centerY;
    }).toBe(true);
  }
});

test('convierte un JPG y modifica el tamaño, rotación, posición e inversión impresos sobre la malla', async ({ page }) => {
  const canvas = await openEditor(page);
  const input = page.getByLabel('Cargar imágenes');
  const converted = page.waitForResponse((res) => res.url().endsWith('/api/shirt-designer/images'));
  await input.setInputFiles(await artworkFile(page, 'estampa.jpg', 'image/jpeg'));
  const response = await converted;
  expect(response.headers()['content-type']).toBe('image/png');
  expect((await response.body()).subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  await expect(page.getByLabel('Imagen a editar')).toContainText('estampa.png');
  await expect.poll(async () => (await inkBounds(canvas, 'red')).count).toBeGreaterThan(200);
  const initial = await inkBounds(canvas, 'red');
  await setSlider(page.getByRole('slider', { name: 'Tamaño' }), 130);
  await expect.poll(async () => (await inkBounds(canvas, 'red')).width).toBeGreaterThan(initial.width * 1.15);
  await setSlider(page.getByRole('slider', { name: 'Rotación' }), 90);
  await expect.poll(async () => {
    const mark = await inkBounds(canvas, 'red');
    return mark.height / mark.width;
  }).toBeGreaterThan(1.4);
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.45);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.58, box.y + box.height * 0.52, { steps: 5 });
  await page.mouse.up();
  await expect.poll(async () => (await inkBounds(canvas, 'red')).centerX).toBeGreaterThan(initial.centerX + 15);
  await page.getByLabel('Invertir colores').check();
  await expect.poll(async () => (await inkBounds(canvas, 'cyan')).count).toBeGreaterThan(200);
  expect((await inkBounds(canvas, 'red')).count).toBeLessThan(10);
  await page.getByText('Ajustar posición', { exact: true }).click();
  await setSlider(page.getByRole('slider', { name: 'Vertical' }), 55);
  await setSlider(page.getByRole('slider', { name: 'Horizontal' }), 50);
  await page.getByRole('button', { name: 'Espalda' }).click();
  await expect.poll(async () => (await inkBounds(canvas, 'cyan')).count).toBeLessThan(10);
  await page.getByRole('button', { name: 'Frente' }).click();
  await expect.poll(async () => (await inkBounds(canvas, 'cyan')).count).toBeGreaterThan(200);
});

test('en móvil mantiene capas independientes, rechaza imágenes dañadas y lleva la compra al login', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const canvas = await openEditor(page);
  const stage = await canvas.boundingBox();
  const panel = await page.getByRole('region', { name: 'Menú de edición' }).boundingBox();
  expect(panel.y).toBeGreaterThan(stage.y + stage.height - 1);
  await page.getByRole('button', { name: 'Espalda' }).click();
  const input = page.getByLabel('Cargar imágenes');
  await input.setInputFiles([await artworkFile(page, 'primera.png'), await artworkFile(page, 'segunda.webp', 'image/webp')]);
  const selector = page.getByLabel('Imagen a editar');
  await expect(selector.locator('option')).toHaveCount(2);
  await selector.selectOption({ label: 'primera.png' });
  await setSlider(page.getByRole('slider', { name: 'Tamaño' }), 80);
  await selector.selectOption({ label: 'segunda.png' });
  await expect(page.getByRole('slider', { name: 'Tamaño' })).toHaveValue('100');
  await input.setInputFiles({ name: 'rota.png', mimeType: 'image/png', buffer: Buffer.from('89504e470d0a1a0a', 'hex') });
  await expect(page.getByRole('alert')).toContainText('dañada');
  await expect(selector.locator('option')).toHaveCount(2);
  await page.getByRole('button', { name: 'Quitar' }).click();
  await expect(selector.locator('option')).toHaveCount(1);
  await expect(page.getByRole('slider', { name: 'Tamaño' })).toHaveValue('80');
  await page.setViewportSize({ width: 320, height: 640 });
  await page.getByRole('radio', { name: 'Femenino' }).check();
  await page.getByRole('radio', { name: 'XL', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'XXL', exact: true })).toBeChecked();
  await expect(canvas).toHaveAccessibleName('Camiseta 3D, modelo femenino, talla XXL');
  await expect(page.getByRole('link', { name: 'Comprar camiseta' })).toBeInViewport();
  await page.getByRole('link', { name: 'Comprar camiseta' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
});

test('un registro de catálogo de prueba se puede aplicar y editar como una capa', async ({ page }) => {
  const file = await artworkFile(page, 'muestra.png');
  await page.route('**/api/shirt-designer/presets', (route) => route.fulfill({
    json: [{ id: 'fixture', name: 'Estampa de prueba', imageUrl: '/fixture-estampa.png' }],
  }));
  await page.route('**/fixture-estampa.png', (route) => route.fulfill({ body: file.buffer, contentType: 'image/png' }));
  const canvas = await openEditor(page);
  await page.getByRole('button', { name: 'Predeterminados' }).click();
  await page.getByRole('button', { name: 'Estampa de prueba' }).click();
  await expect(page.getByLabel('Imagen a editar')).toContainText('Estampa de prueba.png');
  await expect.poll(async () => (await inkBounds(canvas, 'red')).count).toBeGreaterThan(200);
});
