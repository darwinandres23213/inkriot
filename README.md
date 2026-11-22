# INKRIOT

INKRIOT es la web de una marca de streetwear de edición limitada. El frontend usa React y el backend se ejecuta en Node.js con Express. Desde la portada se puede abrir el personalizador 3D de camisetas, explorar el lookbook o acceder al login con el icono **Cuenta**.

## Ejecutar en local

Desde la raíz del repositorio, con Node.js y npm instalados, ejecuta los dos comandos. La versión comprobada de Node.js es la 24.11.1. El rango compatible figura en [package.json](package.json).

```sh
npm ci
npm run dev
```

El comando levanta el servidor web en el puerto 3000, el microservicio de imágenes en el 3001 y el de lookbook en el 3002. Pulsa `Ctrl+C` para detenerlos. [Portada](http://127.0.0.1:3000/) · [Lookbook](http://127.0.0.1:3000/#lookbook) · [Inicio de sesión](http://127.0.0.1:3000/login)

## Hojear el lookbook

Pulsa **Lookbook** en la cabecera para llegar al libro cerrado. Al pulsar la cubierta o **Abrir el lookbook**, el libro se acerca y se abre en un modal por el índice. Elige un título o pulsa **Siguiente** para empezar a hojearlo.

En escritorio, cada doble página reúne la ficha y la foto de un look. En móvil, la foto y la ficha ocupan una hoja cada una. Puedes pasar las hojas con los botones, con las flechas del teclado o deslizando sobre el papel en una pantalla táctil. **Volver al índice** te lleva al listado. Al pulsar **Cerrar**, presionar Escape o tocar el fondo, la tapa se pliega y el libro vuelve a su sitio en la portada.

El primer look es **Rompe el molde**. El álbum lee los registros publicados del microservicio de lookbook. El contrato y el punto de conexión para la futura base de datos están en el [contexto del proyecto](PROJECT_CONTEXT.md#lookbook).

## Personalizar una camiseta

1. Pulsa **Personaliza tu camiseta aquí** en la portada. Elige el modelo **Masculino** o **Femenino**, una talla de **S** a **XXL** y el color de la tela. Arrastra para girar la prenda. **Frente** y **Espalda** permiten trabajar sobre cada cara.
2. Usa **Cargar imágenes** para añadir hasta seis estampados. Se admiten PNG, JPG y WebP estáticos de hasta 8 MiB y 16 megapíxeles cada uno. El servicio valida el archivo y devuelve un PNG nuevo.
3. Selecciona la imagen que quieras editar. Puedes moverla directamente sobre la tela o usar **Ajustar posición**, cambiar su tamaño, rotarla, invertir sus colores y quitarla. El catálogo de **Predeterminados** empieza vacío.
4. El botón **La quiero** abre el login. El borrador permanece al cerrar y volver a abrir el modal durante la misma visita a la portada. Navegar al login o recargar descarta el borrador.

El visor usa WebGL 2 y empieza en **Masculino, talla M**. Puedes comparar los dos cortes y las cinco tallas con los mismos estampados. Las tallas representan el ajuste visual del modelo. La conversión de archivos se hace en memoria y conserva la transparencia.

## Probar el formulario

1. Desde la portada, pulsa el icono **Cuenta**. También está disponible en la cabecera móvil.
2. Pulsa **Iniciar sesión** con un campo vacío o un correo mal escrito. El navegador señala el campo que hay que corregir.
3. Introduce un correo de prueba y una contraseña. Al enviar, el formulario limpia los campos y muestra «Formulario de prueba. El acceso aún no está habilitado.»
4. Pulsa **Volver al inicio** para regresar a la portada.

La validación se hace en el navegador. Las credenciales no se envían ni se guardan y el envío no crea una sesión.

## Servir la versión compilada

Tras instalar las dependencias, ejecuta los comandos desde la raíz.

```sh
npm run build
npm start
```

Vite genera `frontend/dist/` y Express sirve esa compilación. `HOST` y `PORT` configuran el servidor web. `SHIRT_SERVICE_HOST` y `SHIRT_SERVICE_PORT` configuran el servicio de imágenes. Si se ejecuta en otro host, indica su origen al servidor web mediante `SHIRT_SERVICE_URL`. Para arrancar el microservicio de forma independiente, usa `npm run start --workspace @inkriot/shirt-designer`.

El servicio de lookbook también arranca por separado con `npm run start --workspace @inkriot/lookbook`. Admite `LOOKBOOK_SERVICE_HOST` y `LOOKBOOK_SERVICE_PORT`. El servidor web usa `LOOKBOOK_SERVICE_URL` cuando el microservicio está en otro host.

## Pruebas

`npm test` comprueba el catálogo de looks, la malla, las transformaciones y la validación de imágenes. Para probar las API, el álbum y el personalizador en navegador, instala Chromium para Playwright una vez con `npx playwright install chromium` y ejecuta `npm run test:e2e`. En PowerShell también puedes usar Chrome instalado con `$env:PLAYWRIGHT_CHANNEL = 'chrome'`. Las pruebas compilan la aplicación y levantan sus propios servidores en los puertos 4380, 4381 y 4382.

## Dónde trabajar

Para añadir archivos, módulos o microservicios, sigue las [reglas de arquitectura de INKRIOT](AGENTS.md).

| Ruta | Contenido |
| --- | --- |
| [frontend/src/](frontend/src/) | Componentes React de la portada, cabecera, pie y login. |
| [frontend/src/modules/shirt-designer/](frontend/src/modules/shirt-designer/) | Visor 3D, menú de edición, cliente de la API y pruebas de navegador. |
| [frontend/src/modules/lookbook/](frontend/src/modules/lookbook/) | Álbum, paso de página, cliente del catálogo y pruebas de navegador. |
| [frontend/css/styles.css](frontend/css/styles.css) | Estándar visual compartido. Paleta, tipografía, botones, texturas y reglas adaptables. |
| [frontend/assets/](frontend/assets/) | Logos y fotografías de la marca. |
| [backend/src/server.js](backend/src/server.js) | Servidor Node, rutas de página y tratamiento de las rutas de API pendientes. |
| [backend/src/services/shirt-designer/](backend/src/services/shirt-designer/) | Validación y conversión a PNG y catálogo de diseños predeterminados. |
| [backend/src/services/lookbook/](backend/src/services/lookbook/) | Catálogo ordenado de looks publicados y repositorio de datos. |

El comportamiento del boletín, los límites del login y las pruebas realizadas se detallan en el [contexto del proyecto](PROJECT_CONTEXT.md).
