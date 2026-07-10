import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Category, Product, StoreSettings } from './catalog.models';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/catalog`;

  /** Store settings, shared by the header, footer and store section. */
  readonly settings = signal<StoreSettings | null>(null);

  /** Loads settings once (used by the app shell). Safe to call repeatedly. */
  loadSettings(): Observable<StoreSettings> {
    return this.http
      .get<StoreSettings>(`${this.baseUrl}/settings`)
      .pipe(tap((s) => this.settings.set(s)));
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`);
  }

  getProducts(opts?: { categoryId?: number; search?: string }): Observable<Product[]> {
    let params = new HttpParams();
    if (opts?.categoryId) {
      params = params.set('categoryId', opts.categoryId);
    }
    if (opts?.search) {
      params = params.set('search', opts.search);
    }
    return this.http.get<Product[]>(`${this.baseUrl}/products`, { params });
  }

  getProductBySlug(slug: string): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/products/${slug}`);
  }
}
