export interface CategorySummary {
  id: number;
  nombre: string;
}

export interface Category {
  id: number;
  nombre: string;
  descripcion: string | null;
  imageUrl: string | null;
  destacado: boolean;
}

export interface Product {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  precio: number;
  precioDescuento: number | null;
  sku: string | null;
  imageUrl: string | null;
  secondaryImageUrls: string[];
  destacado: boolean;
  stock: number | null;
  categories: CategorySummary[];
}

export interface RedesSociales {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  x?: string;
}

export interface StoreSettings {
  nombre: string | null;
  descripcion: string | null;
  whatsapp: string | null;
  direccion: string | null;
  mapsUrl: string | null;
  redesSociales: RedesSociales;
  imageUrl: string | null;
  secondaryImageUrls: string[];
}
