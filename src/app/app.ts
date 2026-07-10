import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CatalogService } from './core/catalog.service';
import { whatsappHref } from './core/whatsapp';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly catalog = inject(CatalogService);

  protected readonly settings = this.catalog.settings;
  protected readonly year = new Date().getFullYear();

  protected readonly storeName = computed(
    () => this.settings()?.nombre || 'Tienda Textiles',
  );

  protected readonly socials = computed(() => {
    const r = this.settings()?.redesSociales ?? {};
    return [
      { label: 'Instagram', url: r.instagram },
      { label: 'Facebook', url: r.facebook },
      { label: 'TikTok', url: r.tiktok },
      { label: 'YouTube', url: r.youtube },
      { label: 'X', url: r.x },
    ].filter((s): s is { label: string; url: string } => !!s.url);
  });

  protected readonly contactHref = computed(() =>
    whatsappHref(this.settings(), 'Hola, me gustaría información de la tienda.'),
  );

  constructor() {
    this.catalog.loadSettings().subscribe();
  }
}
