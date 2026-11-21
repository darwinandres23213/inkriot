# Contexto del proyecto INKRIOT

INKRIOT usa React para la interfaz y Node.js con Express para el servidor. La portada marca el estándar visual de las nuevas vistas. La primera pantalla de cuenta es un formulario de demostración. La autenticación, el catálogo con precios e inventario y el proceso de compra quedan pendientes.

## Arquitectura

Hoy se ejecuta un único proceso Node.js que sirve la aplicación React. El directorio `backend/src/services/` está reservado para los microservicios de negocio que se incorporen. La distribución de cada módulo nuevo, sus funciones auxiliares y los límites entre servicios se definen en las [reglas de arquitectura del repositorio](AGENTS.md).

| Pieza | Responsabilidad |
| --- | --- |
| [frontend/index.html](frontend/index.html) | Documento base en español, metadatos, dependencias tipográficas y punto de montaje `#root`. |
| [frontend/src/main.jsx](frontend/src/main.jsx) | Monta la cabecera compartida y selecciona la portada o el login según la URL. |
| [frontend/src/Header.jsx](frontend/src/Header.jsx) | Navegación a las secciones de portada, enlace «Cuenta» y estado de página actual. |
| [frontend/src/Home.jsx](frontend/src/Home.jsx) | Portada, galería de Itadori, Toji y Hakari y manifiesto. Activa el efecto de los títulos con `IntersectionObserver`. |
| [frontend/src/Footer.jsx](frontend/src/Footer.jsx) | Pie de la portada, redes sociales, validación del boletín y mensajes de resultado. |
| [frontend/src/Login.jsx](frontend/src/Login.jsx) | Campos de correo y contraseña, validación nativa y aviso de demostración al enviar. |
| [backend/src/server.js](backend/src/server.js) | Sirve la aplicación desde un único origen. En desarrollo integra Vite y, tras compilar, sirve los archivos de `frontend/dist/`. |
| [vite.config.js](vite.config.js) | Configura `frontend/` como raíz de Vite y habilita la transformación de React. |

## Rutas y formularios

| Ruta | Comportamiento actual |
| --- | --- |
| `GET /` | Muestra la portada. `#top`, `#drop`, `#lookbook`, `#manifiesto` y `#contacto` conservan sus destinos. |
| `GET /login` | Node entrega la aplicación y React muestra el login. El acceso directo, la recarga y la variante `/login/` funcionan. El enlace «Cuenta» permanece visible en móvil. |
| `POST /api/subscribe` | El boletín envía JSON con la forma `{"email":"persona@example.com"}`. La API de suscripciones está pendiente. Express devuelve `404` en JSON y el formulario conserva el correo para reintentar. |

**Login.** El correo y la contraseña son obligatorios. React cancela el envío tras la validación del navegador, limpia los campos y anuncia el estado mediante `role="status"`. El flujo termina en la misma página. Las credenciales no llegan a Node y el formulario no crea usuarios, cookies ni sesiones.

**Boletín.** Un correo vacío o inválido muestra «Escribe un correo válido.» antes de enviar. El cliente interpreta un estado `2xx` como suscripción aceptada. Cuando se implemente el microservicio de suscripciones, la ruta pública delegará en su API y se registrará antes de la respuesta general `404` de Express.

**Otros controles.** Buscar y Carrito siguen pendientes. Las prendas, «Comprar el Drop», «Aprender más», las redes y los enlaces de texto del pie conservan sus destinos provisionales.

## Estándar visual

Los colores se definen en `:root`, con negro y marfil como base y rojo para los acentos. Rock Salt se usa en los títulos y Space Mono en el texto y los controles. El login reutiliza la cabecera, el título inclinado con subrayado rojo (`.script`), el botón con borde (`.btn`), el grano de fondo y la fotografía de la portada. Las nuevas vistas pueden usar estas mismas reglas en la [hoja de estilos compartida](frontend/css/styles.css).

A 900 px o menos se ocultan los enlaces de sección de la cabecera. En el login, a 700 px o menos se retira la fotografía lateral para dar espacio a los campos. En el lookbook, a 560 px o menos la última prenda ocupa las dos columnas. La preferencia de movimiento reducido desactiva también las animaciones de los pseudoelementos.

Google Fonts y Font Awesome 6.5.2 se cargan desde servicios externos. Los nueve PNG de origen suman 15,83 MiB. La compilación produjo siete PNG distintos porque los dos logos coinciden entre sí y la imagen derecha de la portada coincide con la segunda prenda.

## Verificación del 21 de noviembre de 2026

- La compilación terminó con `npm run build`. Se recorrieron en Chrome tanto el servidor de desarrollo como la versión compilada servida por Express.
- En la portada cargaron las nueve imágenes. Se comprobó la navegación al drop, la vuelta desde el login al lookbook y el retorno al inicio.
- En el login se probaron campos vacíos, correo mal formado y envío con Enter. Un envío válido mostró el aviso, limpió los campos y mantuvo la URL. No se observó ninguna petición POST ni cambio de cookies al enviar el login.
- Se revisó el formulario en escritorio y en móvil. A 320 px de ancho los campos y el botón quedaron dentro de la pantalla.
- El boletín recibió el `404` JSON esperado en ambos modos y mostró el mensaje de reintento. El recorrido terminó sin excepciones de JavaScript.

Los comandos para repetir el arranque están en el [README](README.md#ejecutar-en-local).
