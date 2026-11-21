# Reglas de arquitectura de INKRIOT

Estas reglas se aplican a todo el repositorio. Antes de crear un archivo o módulo, identifica el dominio al que pertenece y busca qué módulo o microservicio ya se encarga de él. Amplía esa unidad cuando la responsabilidad sea la misma. Reserva la raíz del repositorio para la configuración y la documentación generales.

## Frontend React

- Agrupa cada nueva funcionalidad en `frontend/src/modules/<dominio>/`. Dentro del módulo, usa `pages/` para vistas, `components/` para piezas de interfaz, `hooks/` para lógica de React, `api/` para las llamadas al backend y `helpers/` para funciones auxiliares. Crea cada subcarpeta cuando tenga un archivo que alojar.
- Antes de extraer una validación o transformación a `helpers/`, comprueba si el módulo ya tiene una función que puedas reutilizar. Los manejadores de eventos que coordinan el estado de un componente pertenecen al componente.
- Cuando varios módulos de React necesiten una misma pieza independiente del dominio, compártela desde `frontend/src/shared/` en la subcarpeta `components/`, `hooks/` o `helpers/` que corresponda.
- Usa `frontend/src/main.jsx` para montar la aplicación y conectar sus vistas. Las nuevas pantallas reutilizan el estándar visual del índice en `frontend/css/styles.css`. Los estilos y las pruebas específicos de un módulo van en sus carpetas `styles/` y `tests/`. Los logos y fotografías se guardan en `frontend/assets/`.

## Backend Node.js por microservicios

- Organiza cada microservicio de negocio en `backend/src/services/<dominio>/`. Cada uno debe poder arrancarse y probarse de forma independiente. Mantén su `package.json`, su entrada `src/server.js` y sus pruebas en `tests/` dentro de esa carpeta.
- Dentro del `src/` de cada microservicio, ubica las rutas en `routes/`, la adaptación de peticiones y respuestas HTTP en `controllers/`, los casos de uso en `services/`, los modelos de datos en `models/` y las funciones auxiliares en `helpers/`. Usa `config/` y `middlewares/` cuando el servicio los necesite.
- Cada servicio es dueño de sus modelos, datos y reglas de negocio. Otros servicios lo consumen mediante su API pública. Mantén privados sus archivos internos y el acceso a sus datos. Las pruebas de integración que ejerciten varios servicios pertenecen a `backend/tests/`.
- `backend/src/server.js` es la entrada del servidor web. Al integrar un microservicio, coloca la ruta pública de `/api` en `backend/src/routes/` y haz que delegue en la API del servicio. El frontend consume ese contrato desde el directorio `api/` de su módulo.

Por ejemplo, al implementar las suscripciones del boletín, la llamada de React a `POST /api/subscribe` pertenecerá a `frontend/src/modules/newsletter/api/`. La lógica de suscripción y sus auxiliares pertenecerán al microservicio `backend/src/services/newsletter/`.

Cuando cambien los dominios, las rutas públicas o los puntos de entrada, actualiza el [contexto del proyecto](PROJECT_CONTEXT.md). Si cambia el arranque, actualiza también el [README](README.md).
