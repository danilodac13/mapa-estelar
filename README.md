# Mapa Estelar

Generador de pósteres del cielo: eliges **fecha, hora y lugar** y obtienes el mapa
estelar de ese instante, listo para descargar en alta resolución.

- Sin cuentas, sin pagos, sin carrito y sin backend propio.
- Todo se calcula y se dibuja **en tu navegador**.
- El servidor local solo sirve los archivos y guarda el PNG en `descargas/`.
- Sin dependencias: HTML, CSS y JavaScript moderno.

## Qué incluye

- **8.920 estrellas** hasta magnitud 6,5, con color según su índice de color.
- **89 constelaciones** con sus líneas.
- **Vía Láctea** como banda galáctica suave (representación esquemática).
- **Luna** con fase y posición reales.
- Proyección estereográfica cenital: norte arriba, este a la izquierda.
- Cuatro temas: Noche, Azul profundo, Sepia y Blanco.
- Capas activables: constelaciones, Vía Láctea, Luna, cuadrícula y color estelar.
- Tres formatos de impresión: **3:4**, **4:5** y **2:3**, con salida de 1800 a 3600 px
  de ancho (hasta ~30 × 40 cm a 300 dpi).
- **Nombres** con tipografía tipo firma: elige entre cuatro estilos (Great Vibes,
  Parisienne, Sacramento y Pinyon Script).
- Búsqueda de ciudades por OpenStreetMap (opcional, solo si la usas).
- **Código de Spotify** opcional: pega el enlace de una canción, álbum, playlist,
  artista, episodio o programa y el código se dibuja en el póster.
- Descarga directa en PNG.
- Guardado automático en `descargas/`, con panel de vista previa, **Guardar PNG**
  y **Abrir archivo guardado**.

## Cómo usarlo

Necesitas Node.js 18 o superior (solo para servir los archivos):

```bash
cd mapa-estelar
npm start
```

Abre <http://localhost:5173>.

> No abras `index.html` con `file://`: el navegador bloquea la carga de los JSON.
> También puedes usar cualquier servidor estático, por ejemplo
> `python -m http.server 5173`.

### Pasos

1. Escribe un título, los nombres (opcional) y una dedicatoria (opcional).
2. Elige la tipografía de los nombres: Elegante, Romántica, Moderna o Clásica.
3. Elige fecha y hora, o pulsa **Usar la fecha y hora actuales**.
4. Elige el lugar de la lista o búscalo por nombre.
5. Revisa latitud, longitud y **zona horaria** (se ajusta a mano; ver más abajo).
6. Elige tema, capas y formato.
7. Si quieres, activa **Añadir código de Spotify** y pega el enlace (ver más abajo).
8. Pulsa **Descargar PNG**.

Se abre un panel con la vista previa del póster. El archivo se guarda
automáticamente en `mapa-estelar/descargas/` y el panel muestra la ruta completa.
Desde ahí puedes usar **Guardar PNG** (descarga normal del navegador) o **Abrir
archivo guardado** (abre el PNG ya escrito en disco).

## Código de Spotify

En la sección **Música**, activa **Añadir código de Spotify** y pega el enlace de
una canción, álbum, playlist, artista, episodio o programa. El código aparece en
una tarjeta centrada bajo la dedicatoria, con un texto opcional. Se escanea desde
la app de Spotify.

- El código **no se genera en local**: se descarga del servicio de Spotify Codes
  (`scannables.scdn.co`) con el color de fondo del tema y barras blancas o negras.
- Necesita conexión a internet. Si el servicio no responde, el póster se genera
  igualmente sin código y la interfaz lo avisa.
- En Spotify usa **⋯ → Compartir → Copiar enlace**. Los enlaces cortos
  `spotify.link` no se admiten.
- El código solo funciona con la app de Spotify y mientras el contenido siga
  disponible en Spotify.

**Condiciones de uso:** Spotify Codes no es código abierto ni forma parte de este
proyecto. Al usarlo aceptas las
[condiciones de Spotify Codes](https://www.spotifycodes.com/): la licencia permite
compartir contenido de Spotify, pero **no vender ni ofrecer Spotify Codes como
tales** ni usarlos en productos para la venta. Para pósteres personales o regalos
sin venta no hay problema. Este proyecto no está afiliado a Spotify.

## Nombres y tipografías

El campo **Nombres** es opcional. Si lo rellenas, los nombres se dibujan con una
tipografía de firma en la parte inferior del póster, entre el mapa y la
dedicatoria, justo antes del lugar y del mensaje. El tamaño se ajusta solo para
que quepan en el ancho disponible.

Puedes elegir entre cuatro tipografías, todas incluidas en el proyecto:

- **Great Vibes** — caligráfica y elegante.
- **Parisienne** — romántica y fluida.
- **Sacramento** — moderna y de trazo continuo.
- **Pinyon Script** — clásica y formal.

La vista previa del panel se actualiza al cambiar el texto o la tipografía. Las
fuentes se cargan desde `assets/fonts/` y no se piden a ningún servicio externo.
Si alguna no carga, se usa una cursiva del sistema.

## Precisión

- Posiciones de las estrellas en J2000 con precesión (IAU 1976) a la fecha elegida.
- Sol y Luna con el algoritmo de Paul Schlyter y sus perturbaciones principales;
  el error típico es inferior a 0,5°.
- No se aplica refracción atmosférica ni depresión del horizonte.
- La **zona horaria es manual**: el navegador no conoce el historial de horario de
  verano de cada ciudad. Si la fecha cae en horario de verano, ajusta el offset.
- La Vía Láctea es una banda procedural basada en coordenadas galácticas, no un
  mapa real de polvo interestelar.

## Estructura

```
mapa-estelar/
├── index.html              Interfaz
├── src/
│   ├── astronomy.js        Tiempo sidéreo, precesión, Sol, Luna, proyección
│   ├── render.js           Dibujo del póster en canvas
│   ├── main.js             Estado, controles, búsqueda y descarga
│   └── styles.css          Estilos
├── assets/
│   └── fonts/              Tipografías de firma (WOFF2 + licencias OFL)
├── data/
│   ├── estrellas.json      Catálogo optimizado
│   └── constelaciones.json Líneas de constelaciones
├── scripts/
│   ├── build-catalog.mjs   Regenera los catálogos desde datos abiertos
│   ├── serve.mjs           Servidor estático + guardado en descargas/
│   └── check.mjs           Comprobación automática (desarrollo)
├── descargas/              PNG generados (se crea al guardar)
├── LICENSE                 Licencia MIT del código
├── THIRD-PARTY-NOTICES.md  Licencias de datos y tipografías
├── .gitignore
└── package.json
```

`descargas/` está en `.gitignore`: los mapas que generes no se versionan.

## Regenerar los catálogos

Descarga las fuentes:

- HYG Database v4.1:
  <https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv>
- Líneas de constelaciones de d3-celestial:
  <https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/constellations.lines.json>

Guárdalas en la raíz del proyecto y ejecuta:

```bash
npm run build:data
```

El script filtra estrellas hasta magnitud 6,5 y redondea las coordenadas para
reducir el peso. Tarda menos de un minuto.

## Privacidad

- No hay analítica, cookies ni envío de datos a ningún servidor externo.
- Sin el código de Spotify, la única petición externa es la búsqueda de ciudades
  en Nominatim, y solo cuando pulsas **Buscar**.
- Si activas **Añadir código de Spotify**, el navegador pide la imagen del código
  a `scannables.scdn.co` (Spotify). Se envía el URI del contenido elegido, no tus
  datos personales ni el póster. Sin esa opción no se contacta con Spotify.
- Los mapas se generan en memoria del navegador y el PNG se envía al servidor
  local (`127.0.0.1`) únicamente para escribirlo en `descargas/`. No sale de tu
  equipo.

## Si el navegador no descarga el PNG

El guardado en `descargas/` no depende del navegador, así que el archivo ya está
en disco. Si aun así no lo encuentras:

1. Mira la ruta que muestra el panel de resultado y ábrela en el explorador.
2. Pulsa **Abrir archivo guardado** para verlo directamente en el navegador.
3. Como último recurso, pulsa **Guardar PNG** o mantén pulsada la vista previa y
   elige «Guardar imagen como…».

Si `descargas/` no existe, se crea sola en el primer guardado. Asegúrate de haber
arrancado la app con `npm start` (y no abriendo `index.html` con `file://`), porque
el guardado local necesita el servidor.

## Licencias

- **Código:** MIT. El texto completo está en `LICENSE`.
- **HYG Database v4.1:** CC BY-SA 4.0. Requiere atribución y compartir las obras
  derivadas bajo la misma licencia. La atribución y la licencia aparecen en el pie
  de la interfaz y en `THIRD-PARTY-NOTICES.md`.
- **d3-celestial (Olaf Frohn):** BSD-3-Clause; de ahí provienen las líneas de
  constelaciones. El aviso de copyright y el texto completo de la licencia están en
  `THIRD-PARTY-NOTICES.md`.
- **Nominatim / OpenStreetMap:** datos bajo ODbL y política de uso de OSMF. La
  búsqueda de ciudades muestra «© OpenStreetMap contributors» en el pie de la
  interfaz.
- **Tipografías de firma:** Great Vibes, Parisienne, Sacramento y Pinyon Script se
  distribuyen bajo **SIL Open Font License 1.1**. Cada licencia está en
  `assets/fonts/` junto a su archivo WOFF2. La OFL permite usarlas y redistribuirlas
  con el proyecto, también en trabajos comerciales; si modificas una fuente, la
  versión modificada debe conservar la OFL y no puede venderse por separado.
- **Spotify Codes:** tecnología y marca de Spotify, **no es código abierto**. Se usa
  mediante el servicio de Spotify y está sujeta a sus condiciones (ver arriba). No
  se incluye ningún código, imagen ni fuente de Spotify en el proyecto.

Los textos completos de las licencias de datos están en
`THIRD-PARTY-NOTICES.md`; las licencias de las tipografías, en `assets/fonts/`.

El nombre «Mapa Estelar» es genérico y puedes cambiarlo. El proyecto no incluye
marcas, textos ni fotografías de terceros. Las únicas tipografías incluidas son las
cuatro de firma, bajo SIL OFL 1.1.

## Personalización rápida

- **Colores y temas:** `THEMES` en `src/render.js`.
- **Formatos:** `FORMATOS` en `src/render.js`.
- **Ciudades predefinidas:** `LUGARES` en `src/main.js`.
- **Textos de la interfaz:** `index.html`.

## Comprobación

Con el servidor en marcha y Chrome instalado:

```bash
node scripts/check.mjs http://localhost:5173/ 9337
```

Necesita Chrome con `--remote-debugging-port=9337`. El script verifica que el
catálogo carga, que el canvas tiene píxeles, que los temas cambian y que la
descarga PNG se completa. Es una herramienta de desarrollo, no parte de la app.
