# Tomás Sobisch · IA para negocios

Landing page estática (HTML + CSS + JS, sin dependencias ni build) construida a partir del diseño "Original · Tech oscura".

## Estructura

```
index.html   — contenido y estructura
styles.css   — tokens de color, componentes, responsive y animaciones
script.js    — configuración, titular animado y formulario
assets/      — fotos y favicon
```

## Ver en local

```bash
python3 -m http.server 8000
# abre http://localhost:8000
```

## Antes de publicar: rellena los datos pendientes

1. **`script.js` → `CONFIG`**
   - `formEndpoint`: URL que recibe el formulario. Lo más fácil es crear un formulario gratis en [Formspree](https://formspree.io) y pegar su URL (`https://formspree.io/f/xxxx`). Si lo dejas vacío pero rellenas `email`, el formulario abre el correo del visitante con el mensaje ya escrito.
   - `email`: tu email de contacto (aparece en el footer).
   - `calendlyUrl`: enlace a tu calendario. Si está vacío, el enlace "Prefiero reservar directamente…" no se muestra.
2. **`index.html` → FAQ**: sustituye `[TU PRECIO]` y `[X DÍAS]`.

## Publicar

Es un sitio estático: funciona tal cual en Vercel, Netlify o GitHub Pages (Settings → Pages → rama `main`, carpeta raíz).
