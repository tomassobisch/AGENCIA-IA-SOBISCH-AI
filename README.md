# Tomás Sobisch · IA para negocios

Landing page estática (HTML + CSS + JS, sin dependencias ni build) construida a partir del diseño "Original · Tech oscura".

## Estructura

```
index.html   — contenido y estructura
styles.css   — tokens de color, componentes, responsive y animaciones
script.js    — configuración, titular animado y formulario
politica-de-cookies.html — política de cookies
assets/      — fotos y favicon
```

## Ver en local

```bash
python3 -m http.server 8000
# abre http://localhost:8000
```

## Antes de publicar: rellena los datos pendientes

1. **`script.js` → `CONFIG`**
   - `formEndpoint`: `/api/contact`, la función propia en `api/contact.js`, que envía cada solicitud desde tu Outlook corporativo. Necesita en Vercel las variables de entorno `SMTP_USER` y `SMTP_PASS` (y SMTP autenticado activado en Microsoft 365 para ese buzón).
   - `email`: ya configurado (`tomassobisch@sobtom.com`).
   - `calendlyUrl`: enlace a tu calendario. Si está vacío, el enlace "Prefiero reservar directamente…" no se muestra.

## Publicar

Es un sitio estático: funciona tal cual en Vercel, Netlify o GitHub Pages (Settings → Pages → rama `main`, carpeta raíz).
