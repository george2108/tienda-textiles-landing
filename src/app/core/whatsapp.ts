import { Product, StoreSettings } from './catalog.models';
import { environment } from '../../environments/environment';

/** Builds a wa.me link, or null when the store has no WhatsApp number. */
export function whatsappHref(
  settings: StoreSettings | null,
  message: string,
): string | null {
  const digits = (settings?.whatsapp ?? '').replace(/\D/g, '');
  if (!digits) {
    return null;
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/** Prefilled WhatsApp message carrying the product name, price and link. */
export function productInquiry(product: Product): string {
  const price = product.precioDescuento ?? product.precio;
  const priceText = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(price);

  return [
    `Hola 👋, me interesa este producto:`,
    ``,
    `${product.nombre} — ${priceText}`,
    `${environment.siteUrl}/producto/${product.slug}`,
    ``,
    `¿Me pueden dar más información?`,
  ].join('\n');
}
