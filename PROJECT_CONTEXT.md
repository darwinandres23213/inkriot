# Contexto del proyecto INKRIOT

INKRIOT usa React para la interfaz y Node.js con Express para el servidor. La portada marca el estándar visual de las nuevas vistas. La primera pantalla de cuenta es un formulario de demostración. La autenticación, el catálogo con precios e inventario y el proceso de compra quedan pendientes.

## Arquitectura

El servidor web Node.js sirve React y delega las rutas del personalizador en el microservicio `shirt-designer` por HTTP. Los dos procesos pueden arrancarse de forma independiente. La distribución de cada módulo, sus auxiliares y los límites entre servicios se definen en las [reglas de arquitectura del repositorio](AGENTS.md).

| Pieza | Responsabilidad |
| --- | --- |
| [frontend/index.html](frontend/index.html) | Documento base en español, metadatos, dependencias tipográficas y punto de montaje `#root`. |
| [frontend/src/main.jsx](frontend/src/main.jsx) | Monta la cabecera compartida y selecciona la portada o el login según la URL. |
| [frontend/src/Header.jsx](frontend/src/Header.jsx) | Navegación a las secciones de portada, enlace «Cuenta» y estado de página actual. |
| [frontend/src/Home.jsx](frontend/src/Home.jsx) | Portada, galería de Itadori, Toji y Hakari y manifiesto. Activa el efecto de los títulos con `IntersectionObserver`. |
| [frontend/src/modules/shirt-designer/](frontend/src/modules/shirt-designer/) | Modal React, malla Three.js, texturas de frente y espalda, carga de imágenes y panel de edición. El código 3D se carga al abrir el visor. |
| [frontend/src/Footer.jsx](frontend/src/Footer.jsx) | Pie de la portada, redes sociales, validación del boletín y mensajes de resultado. |
| [frontend/src/Login.jsx](frontend/src/Login.jsx) | Campos de correo y contraseña, validación nativa y aviso de demostración al enviar. |
| [backend/src/server.js](backend/src/server.js) | Sirve la aplicación desde un único origen. En desarrollo integra Vite y, tras compilar, sirve los archivos de `frontend/dist/`. |
| [backend/src/routes/shirtDesigner.js](backend/src/routes/shirtDesigner.js) | Delega únicamente las rutas públicas de imágenes y catálogo en el servicio del dominio. |
| [backend/src/services/shirt-designer/](backend/src/services/shirt-designer/) | Proceso Express independiente con decodificación mediante Sharp, recodificación y catálogo de predeterminados. |
| [vite.config.js](vite.config.js) | Configura `frontend/` como raíz de Vite y habilita la transformación de React. |

## Rutas y formularios

| Ruta | Comportamiento actual |
| --- | --- |
| `GET /` | Muestra la portada. `#top`, `#drop`, `#lookbook`, `#manifiesto` y `#contacto` conservan sus destinos. |
| `GET /login` | Node entrega la aplicación y React muestra el login. El acceso directo, la recarga y la variante `/login/` funcionan. El enlace «Cuenta» permanece visible en móvil. |
| `GET /api/shirt-designer/presets` | Devuelve una lista JSON. Actualmente es `[]`. El selector admite registros con `id`, `name` e `imageUrl` del mismo origen. |
| `POST /api/shirt-designer/images` | Recibe los bytes del archivo como `application/octet-stream` y devuelve `image/png` con `Cache-Control: no-store`. Los errores se devuelven en JSON. |
| `POST /api/subscribe` | El boletín envía JSON con la forma `{"email":"persona@example.com"}`. La API de suscripciones está pendiente. Express devuelve `404` en JSON y el formulario conserva el correo para reintentar. |

**Login.** El correo y la contraseña son obligatorios. React cancela el envío tras la validación del navegador, limpia los campos y anuncia el estado mediante `role="status"`. El flujo termina en la misma página. Las credenciales no llegan a Node y el formulario no crea usuarios, cookies ni sesiones.

**Boletín.** Un correo vacío o inválido muestra «Escribe un correo válido.» antes de enviar. El cliente interpreta un estado `2xx` como suscripción aceptada. Cuando se implemente el microservicio de suscripciones, la ruta pública delegará en su API y se registrará antes de la respuesta general `404` de Express.

**Otros controles.** Buscar y Carrito siguen pendientes. Las prendas, «Comprar el Drop», «Aprender más», las redes y los enlaces de texto del pie conservan sus destinos provisionales.

## Personalizador de camisetas

El visor ofrece dos modelos de camiseta de cuello redondo, **Masculino** y **Femenino**. El GLB local contiene una escena por modelo. Cada escena tiene su propio torso cerrado, tela, ribete y costuras. Se adaptaron las formas anatómicas de MakeHuman sobre el patrón `male_casualsuit04`, con ajustes de hombros, pecho, cintura y cadera. [Modelos locales](frontend/assets/models/crew-neck.glb) · [Procedencia y licencia CC0 de la malla base](https://github.com/kblood/CharacterCreator/blob/master/LICENSE-NOTES.md)

El editor abre en Masculino, talla M. S, M, L, XL y XXL gradúan el ancho, la profundidad y el largo del patrón y del maniquí mediante la forma de destino `XXL` de cada malla. Todas las tallas comparten encuadre. La superficie de impresión se proyecta de nuevo al cambiar de talla para conservar la escala y la proporción de cada imagen. El borrador mantiene el modelo, la talla, el color y las capas al alternar entre cortes y al reabrir el modal durante la visita.

El corte masculino tiene un frente de pecho más plano. La graduación aumenta principalmente el ancho para mantener el perfil de los dos cortes en las tallas grandes. El torso interior sigue la forma de las sisas y termina por dentro de las bocamangas y el bajo. La tela se vuelve hacia dentro en los bordes. Las dos hileras de costura de cada manga y del bajo, y la del cuello, comparten aristas con la tela.

El frente y la espalda tienen coordenadas de impresión independientes. El color de la prenda se aplica también al ribete, las costuras y el revés del dobladillo. El maniquí conserva su acabado neutro. Cada imagen gira con la tela y guarda su cara, posición, escala, rotación e inversión RGB. La inversión conserva el canal alfa. Los controles de posición complementan el arrastre con ratón o tacto.

El microservicio identifica PNG, JPEG y WebP por sus bytes. Comprueba la integridad de los bloques PNG y la terminación o longitud del contenedor en los otros formatos. Después decodifica los píxeles con rechazo de advertencias, aplica la orientación y genera un PNG con un lado máximo de 1536 px. Los límites de entrada son 8 MiB y 16 megapíxeles. Una entrada vacía devuelve `400`, un exceso de tamaño `413`, un tipo incompatible `415` y una imagen dañada `422`.

Los archivos se procesan en memoria. React mantiene el borrador durante la visita a la portada y conserva las capas válidas si falla otra carga. El botón de compra navega a `/login`. La base de datos de predeterminados y la persistencia del pedido quedan pendientes.

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
- Las pruebas del personalizador comprueban las proporciones, el volumen cerrado y las superficies de impresión. En las diez combinaciones de cuerpo y talla se contrastan los triángulos del maniquí y del dobladillo interior con los de la tela. También se comprueba la unión de las costuras. En navegador se mide la prenda al cambiar de talla y se revisa la XXL roja con estampado al inclinarla. Las pruebas también cubren la edición de ambas caras, el catálogo, la validación de imágenes, la recuperación de la carga y el acceso al login desde móvil.

Los comandos para repetir el arranque están en el [README](README.md#ejecutar-en-local).
