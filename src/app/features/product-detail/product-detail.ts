import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../core/catalog.service';
import { SeoService } from '../../core/seo.service';
import { Product } from '../../core/catalog.models';
import { productInquiry, whatsappHref } from '../../core/whatsapp';
import { environment } from '../../../environments/environment';
import { ProductGallery } from './product-gallery/product-gallery';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, CurrencyPipe, ProductGallery],
  templateUrl: './product-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetail {
  private readonly catalog = inject(CatalogService);
  private readonly seo = inject(SeoService);

  /** Bound from the :slug route param (withComponentInputBinding). */
  readonly slug = input.required<string>();

  protected readonly settings = this.catalog.settings;
  protected readonly product = signal<Product | null>(null);
  protected readonly notFound = signal(false);

  protected readonly images = computed(() => {
    const p = this.product();
    if (!p) {
      return [];
    }
    return [p.imageUrl, ...p.secondaryImageUrls].filter(
      (url): url is string => !!url,
    );
  });

  protected readonly whatsappUrl = computed(() => {
    const p = this.product();
    return p ? whatsappHref(this.settings(), productInquiry(p)) : null;
  });

  constructor() {
    effect(() => {
      const slug = this.slug();
      this.notFound.set(false);
      this.product.set(null);
      this.catalog.getProductBySlug(slug).subscribe({
        next: (p) => {
          this.product.set(p);
          this.applySeo(p);
        },
        error: () => {
          this.notFound.set(true);
          this.seo.update({
            title: 'Producto no encontrado · Tienda Textiles',
            description: 'Este producto ya no está disponible en el catálogo.',
            url: `${environment.siteUrl}/producto/${slug}`,
          });
        },
      });
    });
  }

  private applySeo(p: Product): void {
    const url = `${environment.siteUrl}/producto/${p.slug}`;
    const price = p.precioDescuento ?? p.precio;
    const description =
      p.descripcion?.trim() ||
      `${p.nombre} — textil disponible en Tienda Textiles. Pide informes por WhatsApp.`;

    this.seo.update({
      title: `${p.nombre} · Tienda Textiles`,
      description,
      url,
      image: p.imageUrl,
      type: 'product',
    });

    this.seo.setJsonLd('product', {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.nombre,
      description,
      image: this.images(),
      sku: p.sku ?? undefined,
      category: p.categories.map((c) => c.nombre).join(', ') || undefined,
      brand: { '@type': 'Brand', name: this.settings()?.nombre ?? 'Tienda Textiles' },
      offers: {
        '@type': 'Offer',
        price,
        priceCurrency: 'MXN',
        availability:
          p.stock === 0
            ? 'https://schema.org/OutOfStock'
            : 'https://schema.org/InStock',
        url,
      },
    });
  }
}
