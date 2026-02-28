# La Casa de la Chicha. C.A.

> Tradición Líquida Venezolana — Caracas, Venezuela

Landing page inmersiva con escenas 3D interactivas para un negocio especializado en chicha venezolana y bebidas criollas.

---

## Estructura del Proyecto

```text
casa-de-la-chicha/
├── index.html              ← Página principal
├── css/
│   └── styles.css          ← Estilos completos (variables, componentes, responsive)
├── js/
│   ├── helpers.js           ← Utilidades globales ($, $$, MX, MY, mkR, mkC, lgts)
│   ├── ui.js                ← Interacciones UI (loader, cursor, scroll, formulario)
│   └── scenes.js            ← Escenas Three.js (hero, about, menú, immersive, etc.)
├── assets/
│   └── images/              ← Imágenes del proyecto (placeholder)
└── README.md                ← Este archivo
```

## Tecnologías

| Tecnología | Uso |
| --- | --- |
| **HTML5** | Estructura semántica |
| **CSS3** | Custom Properties, Grid, Flexbox, Animaciones, `@media` responsive |
| **JavaScript ES6+** | Vanilla — sin frameworks ni bundlers |
| **Three.js r128** | +10 escenas 3D: vasijas, nebulosas, shaders GLSL, partículas |
| **Google Fonts** | Bebas Neue, Libre Baskerville, IBM Plex Mono |

## Características

- **Loader animado** con tipografía cinética
- **Nebulosa GLSL** en el hero con partículas interactivas (parallax mouse)
- **Showcase 3D interactivo** — rota, zoom y cambia entre 5 variantes de chicha
- **Promo 3D** — tarjeta flotante con parallax + escena de vasija venezolana
- **6 escenas de menú** — cada producto con geometría 3D única
- **Shader volumétrico** en la sección immersive (plasma tropical)
- **Cursor personalizado** con efecto de crecimiento en interactivos
- **Scroll reveal** con IntersectionObserver
- **Formulario de reservas** con feedback visual
- **100% responsive** (desktop, tablet, móvil)

## Cómo Ejecutar

1. Abre una terminal en la carpeta del proyecto
2. Inicia un servidor local:

```bash
# Python 3
python -m http.server 8080

# Node.js (si tienes npx)
npx serve .
```

1. Abre `http://localhost:8080` en tu navegador

> **Nota:** Se requiere un servidor HTTP local. Abrir `index.html` directamente como archivo no cargará Three.js correctamente debido a restricciones CORS.

## Navegación

| Sección | Descripción |
| --- | --- |
| Hero | Nebulosa galáctica con título animado |
| Promo 3D | Publicidad premium de la Chicha Andina |
| Nosotros | Historia + vasija 3D animada |
| Showcase | Producto estrella interactivo (5 variantes) |
| Proceso | 4 pasos de la elaboración |
| Menú | 6 cartas con escenas 3D individuales |
| Immersive | Shader de plasma a pantalla completa |
| Testimonios | Reseñas de comensales |
| Eventos | Próximas experiencias |
| Chef | Maestra Chichera con icosaedro 3D |
| Galería | Mosaico masonry con 7 escenas 3D |
| Reservas | Formulario funcional |

## Licencia

Proyecto educativo / demostrativo. Contenido ficticio.
