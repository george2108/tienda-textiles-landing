import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { debounce, Subject, switchMap, timer } from 'rxjs';
import { CatalogService } from '../../core/catalog.service';
import { SeoService } from '../../core/seo.service';
import { Category, Product } from '../../core/catalog.models';
import { whatsappHref } from '../../core/whatsapp';
import { environment } from '../../../environments/environment';

const PAGE_SIZE = 12;

@Component({
  selector: 'app-home',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly catalog = inject(CatalogService);
  private readonly seo = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly settings = this.catalog.settings;
  protected readonly categories = signal<Category[]>([]);

  /** Products accumulated across the pages loaded so far. */
  protected readonly products = signal<Product[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(true); // first load / filter change
  protected readonly loadingMore = signal(false); // appending a page

  protected readonly search = signal('');
  protected readonly selectedCategoryId = signal<number | null>(null);
  private readonly page = signal(1);

  /** True while there are more products on the server than shown. */
  protected readonly hasMore = computed(() => this.products().length < this.total());

  /** Fires a fresh (page 1) load; `debounced` throttles keystrokes. */
  private readonly reload$ = new Subject<{ debounced: boolean }>();

  protected readonly storeName = computed(
    () => this.settings()?.nombre || 'Textiles jalieza',
  );

  protected readonly storeDescription = computed(
    () =>
      this.settings()?.descripcion ||
      'Descubre artesanías únicas elaboradas con tradición, calidad y el alma de nuestra gente.',
  );

  protected readonly heroTitulo = computed(
    () => this.settings()?.heroTitulo || 'lo tiene todo',
  );

  protected readonly storeWhatsapp = computed(() =>
    whatsappHref(
      this.settings(),
      `Hola, me gustaría más información sobre ${this.settings()?.nombre ?? 'la tienda'}.`,
    ),
  );

  constructor() {
    this.seo.update({
      title: 'Textiles Jalieza · Catálogo de telas y textiles hechos a mano',
      description:
        'Explora telas y textiles hechos a mano. Filtra por categoría, busca por material y pide informes por WhatsApp.',
      url: environment.siteUrl,
    });

    // A filter change resets to page 1 and replaces the list. Keystrokes are
    // debounced; category clicks load immediately (timer(0)).
    this.reload$
      .pipe(
        debounce(({ debounced }) => timer(debounced ? 300 : 0)),
        switchMap(() => {
          this.loading.set(true);
          this.page.set(1);
          return this.catalog.getProducts(this.query(1));
        }),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (res) => {
          this.products.set(res.items);
          this.total.set(res.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });

    this.catalog.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
    });

    this.reload$.next({ debounced: false }); // initial load

    // Store structured data once the settings arrive (SSR-safe).
    effect(() => {
      const s = this.settings();
      if (!s) {
        return;
      }
      this.seo.setJsonLd('store', {
        '@context': 'https://schema.org',
        '@type': 'Store',
        name: s.nombre ?? 'Textiles jalieza',
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
    this.reload$.next({ debounced: true });
  }

  protected selectCategory(id: number | null): void {
    if (this.selectedCategoryId() === id) {
      return;
    }
    this.selectedCategoryId.set(id);
    this.reload$.next({ debounced: false });
  }

  protected loadMore(): void {
    if (this.loadingMore() || !this.hasMore()) {
      return;
    }
    const next = this.page() + 1;
    this.loadingMore.set(true);
    this.catalog
      .getProducts(this.query(next))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.products.update((list) => [...list, ...res.items]);
          this.total.set(res.total);
          this.page.set(next);
          this.loadingMore.set(false);
        },
        error: () => this.loadingMore.set(false),
      });
  }

  private query(page: number) {
    return {
      categoryId: this.selectedCategoryId() ?? undefined,
      search: this.search().trim() || undefined,
      page,
      limit: PAGE_SIZE,
    };
  }
}
