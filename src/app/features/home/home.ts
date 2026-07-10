import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../core/catalog.service';
import { SeoService } from '../../core/seo.service';
import { Category, Product } from '../../core/catalog.models';
import { whatsappHref } from '../../core/whatsapp';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly catalog = inject(CatalogService);
  private readonly seo = inject(SeoService);

  protected readonly settings = this.catalog.settings;
  protected readonly products = signal<Product[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(true);

  protected readonly search = signal('');
  protected readonly selectedCategoryId = signal<number | null>(null);

  protected readonly storeDescription = computed(
    () => this.settings()?.descripcion ?? '',
  );

  protected readonly heroTitulo = computed(
    () => this.settings()?.heroTitulo || 'Añil, grana y algodón crudo.',
  );

  protected readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const catId = this.selectedCategoryId();
    return this.products().filter((p) => {
      const matchesCat = catId === null || p.categories.some((c) => c.id === catId);
      const matchesTerm =
        term === '' ||
        p.nombre.toLowerCase().includes(term) ||
        (p.descripcion?.toLowerCase().includes(term) ?? false);
      return matchesCat && matchesTerm;
    });
  });

  protected readonly storeWhatsapp = computed(() =>
    whatsappHref(
      this.settings(),
      `Hola, me gustaría más información sobre ${this.settings()?.nombre ?? 'la tienda'}.`,
    ),
  );

  constructor() {
    this.seo.update({
      title: 'Tienda Textiles · Catálogo de telas y textiles teñidos a mano',
      description:
        'Explora telas y textiles teñidos a mano con añil y grana. Filtra por categoría, busca por material y pide informes por WhatsApp.',
      url: environment.siteUrl,
    });

    this.catalog.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
    });
    this.catalog.getProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    // Store structured data once the settings arrive (SSR-safe).
    effect(() => {
      const s = this.settings();
      if (!s) {
        return;
      }
      this.seo.setJsonLd('store', {
        '@context': 'https://schema.org',
        '@type': 'Store',
        name: s.nombre ?? 'Tienda Textiles',
        description: s.descripcion ?? undefined,
        image: s.imageUrl ?? undefined,
        telephone: s.whatsapp ?? undefined,
        address: s.direccion ?? undefined,
        url: environment.siteUrl,
        sameAs: Object.values(s.redesSociales).filter(Boolean),
      });
    });
  }

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected selectCategory(id: number | null): void {
    this.selectedCategoryId.set(id);
  }
}
