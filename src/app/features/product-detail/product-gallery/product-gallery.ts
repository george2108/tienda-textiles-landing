import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/core';

/**
 * Product image gallery with an Amazon/MercadoLibre-style lightbox: click the
 * main image (or a thumbnail) to open a full-screen carousel over all images.
 */
@Component({
  selector: 'app-product-gallery',
  templateUrl: './product-gallery.html',
  host: { '(document:keydown)': 'onKeydown($event)' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGallery {
  private readonly document = inject(DOCUMENT);

  readonly images = input.required<string[]>();
  readonly alt = input<string>('');

  protected readonly activeIndex = signal(0);
  protected readonly lightboxOpen = signal(false);
  protected readonly lightboxIndex = signal(0);

  protected readonly count = computed(() => this.images().length);
  protected readonly activeImage = computed(
    () => this.images()[this.activeIndex()] ?? null,
  );
  protected readonly lightboxImage = computed(
    () => this.images()[this.lightboxIndex()] ?? null,
  );

  private touchStartX = 0;

  constructor() {
    // Restore scrolling if the component is destroyed while the modal is open.
    inject(DestroyRef).onDestroy(() => this.unlockScroll());
  }

  /** Sets the inline main image (thumbnails hover/click). */
  protected select(index: number): void {
    this.activeIndex.set(index);
  }

  protected open(index: number): void {
    if (this.count() === 0) {
      return;
    }
    this.lightboxIndex.set(index);
    this.lightboxOpen.set(true);
    this.lockScroll();
  }

  protected close(): void {
    this.lightboxOpen.set(false);
    this.unlockScroll();
  }

  protected next(): void {
    this.lightboxIndex.update((i) => (i + 1) % this.count());
  }

  protected prev(): void {
    this.lightboxIndex.update((i) => (i - 1 + this.count()) % this.count());
  }

  protected goTo(index: number): void {
    this.lightboxIndex.set(index);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (!this.lightboxOpen()) {
      return;
    }
    if (event.key === 'Escape') {
      this.close();
    } else if (event.key === 'ArrowRight') {
      this.next();
    } else if (event.key === 'ArrowLeft') {
      this.prev();
    }
  }

  protected onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0]?.clientX ?? 0;
  }

  protected onTouchEnd(event: TouchEvent): void {
    const delta = (event.changedTouches[0]?.clientX ?? 0) - this.touchStartX;
    if (Math.abs(delta) > 45) {
      delta < 0 ? this.next() : this.prev();
    }
  }

  private lockScroll(): void {
    this.document.body.style.overflow = 'hidden';
  }

  private unlockScroll(): void {
    this.document.body.style.overflow = '';
  }
}
