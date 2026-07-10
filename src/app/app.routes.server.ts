import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    // Render on the server per request so pages reflect live catalog data
    // and carry per-product SEO metadata.
    path: '**',
    renderMode: RenderMode.Server,
  },
];
