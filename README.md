# INKRIOT

INKRIOT es la web de una marca de streetwear de edición limitada. El frontend usa React y el backend se ejecuta en Node.js con Express. La portada reúne el drop, el lookbook y el manifiesto. El icono **Cuenta** abre el primer formulario de inicio de sesión.

## Ejecutar en local

Desde la raíz del repositorio, con Node.js y npm instalados, ejecuta los dos comandos. La versión comprobada de Node.js es la 24.11.1. El rango compatible figura en [package.json](package.json).

```sh
npm ci
npm run dev
```

Abre [la portada](http://127.0.0.1:3000/) o entra directamente al [formulario de inicio de sesión](http://127.0.0.1:3000/login). Un único proceso de Node sirve las dos vistas e integra Vite para el desarrollo. Pulsa `Ctrl+C` para detenerlo.

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

Vite genera `frontend/dist/` y Express sirve esa compilación. Los dos modos usan `127.0.0.1:3000` por defecto. Las variables `HOST` y `PORT` permiten cambiar la dirección y el puerto.

## Dónde trabajar

Para añadir archivos, módulos o microservicios, sigue las [reglas de arquitectura de INKRIOT](AGENTS.md).

| Ruta | Contenido |
| --- | --- |
| [frontend/src/](frontend/src/) | Componentes React de la portada, cabecera, pie y login. |
| [frontend/css/styles.css](frontend/css/styles.css) | Estándar visual compartido. Paleta, tipografía, botones, texturas y reglas adaptables. |
| [frontend/assets/](frontend/assets/) | Logos y fotografías de la marca. |
| [backend/src/server.js](backend/src/server.js) | Servidor Node, rutas de página y tratamiento de las rutas de API pendientes. |

El comportamiento del boletín, los límites del login y las pruebas realizadas se detallan en el [contexto del proyecto](PROJECT_CONTEXT.md).
