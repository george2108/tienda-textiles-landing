# Tienda Textiles · Landing (sitio público)

Escaparate público del catálogo. Muestra los productos (por categoría y con
buscador), la información de la tienda, y una página de detalle por producto con
un botón que abre WhatsApp con un mensaje prellenado.

## Stack

- **Angular 21 con SSR** (`@angular/ssr`, render en servidor por request) para SEO
- **Tailwind CSS v4** con un sistema de tokens propio (añil/grana sobre algodón crudo)
- Consume la **API pública** del backend: `GET /api/catalog/*`

## Puesta en marcha

```bash
npm install
npm start          # http://localhost:4300  (SSR en dev)
```

Requiere el backend en `http://localhost:3000/api` (ajustable en
`src/environments/environment.ts`). El origen `http://localhost:4300` debe estar
en `CORS_ORIGINS` del backend.

## SEO / SSR

- Render en servidor (`RenderMode.Server`): el HTML llega con el catálogo y la
  metadata ya renderizados.
- `SeoService` fija `title`, `description`, `canonical`, Open Graph y Twitter por
  página, y JSON-LD (`Store` en la home, `Product` en el detalle).
- Hidratación con `provideClientHydration` + `withFetch`: la respuesta HTTP del
  servidor se transfiere al cliente (no se vuelve a pedir).

## Diseño

Identidad "añil y grana" (índigo + carmín sobre algodón crudo). Display
*Instrument Serif*, cuerpo *Hanken Grotesk*, datos en *IBM Plex Mono* (fichas de
muestrario). Tokens y CSS mínimo en `src/styles.css`; el resto es Tailwind.
