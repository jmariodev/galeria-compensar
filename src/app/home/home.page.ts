import { Component, OnInit, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonFab,
  IonFabButton,
  IonIcon,
  IonModal,
  IonButtons,
  IonButton,
  AlertController,
  ToastController,
  GestureController,
  Gesture,
} from '@ionic/angular';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { addIcons } from 'ionicons';
import { camera, trash, close, share, images, checkmarkCircle, informationCircle } from 'ionicons/icons';
import type { UserPhoto } from '../services/photo.service';
import { PhotoService } from '../services/photo.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonFab,
    IonFabButton,
    IonIcon,
    IonModal,
    IonButtons,
    IonButton,
    DatePipe,
    RouterLink,
  ],
})
export class HomePage implements OnInit {
  public photoService = inject(PhotoService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private gestureCtrl = inject(GestureController);

  public selectedIndex = signal<number | null>(null);
  public selectionMode = signal(false);
  public selectedIds = signal<Set<string>>(new Set());

  public selectedPhoto = computed<UserPhoto | null>(() => {
    const index = this.selectedIndex();
    const photos = this.photoService.photos();
    return index !== null && index < photos.length ? photos[index] : null;
  });

  public selectedCount = computed(() => this.selectedIds().size);

  @ViewChild('viewerRoot') private viewerRootRef?: ElementRef<HTMLElement>;
  @ViewChild('slidesContainer') private slidesContainerRef?: ElementRef<HTMLElement>;

  private slidesEl?: HTMLElement;
  private dismissGesture?: Gesture;

  constructor() {
    addIcons({ camera, trash, close, share, images, checkmarkCircle, informationCircle });
  }

  async ngOnInit() {
    await this.photoService.loadSaved();
  }

  async addPhotoToGallery() {
    try {
      await this.photoService.addNewToGallery();
      await this.presentToast('Foto guardada');
    } catch {
      // si el usuario cierra la cámara/el prompt también se rechaza la promesa — no hay nada que reportar
    }
  }

  // --- Modo de selección (borrado múltiple) ---

  enterSelectionMode() {
    if (this.photoService.photos().length === 0) {
      return;
    }
    this.selectionMode.set(true);
    this.selectedIds.set(new Set());
  }

  cancelSelectionMode() {
    this.selectionMode.set(false);
    this.selectedIds.set(new Set());
  }

  isSelected(photo: UserPhoto) {
    return this.selectedIds().has(photo.filepath);
  }

  toggleSelected(photo: UserPhoto) {
    const next = new Set(this.selectedIds());
    if (next.has(photo.filepath)) {
      next.delete(photo.filepath);
    } else {
      next.add(photo.filepath);
    }
    this.selectedIds.set(next);
  }

  onThumbnailTap(photo: UserPhoto, position: number) {
    if (this.selectionMode()) {
      this.toggleSelected(photo);
    } else {
      this.openPhoto(position);
    }
  }

  async confirmDeleteSelected() {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) {
      return;
    }
    const alert = await this.alertCtrl.create({
      header: ids.length === 1 ? 'Eliminar foto' : `Eliminar ${ids.length} fotos`,
      message: 'Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.photoService.deletePhotos(ids);
            this.cancelSelectionMode();
          },
        },
      ],
    });
    await alert.present();
  }

  // --- Visor a pantalla completa ---

  openPhoto(position: number) {
    this.selectedIndex.set(position);
  }

  closePhoto() {
    this.selectedIndex.set(null);
  }

  onViewerPresented() {
    const viewerRoot = this.viewerRootRef?.nativeElement;
    const slidesContainer = this.slidesContainerRef?.nativeElement;
    if (!viewerRoot || !slidesContainer) {
      return;
    }
    this.slidesEl = slidesContainer;
    const index = this.selectedIndex() ?? 0;
    slidesContainer.scrollTo({ left: index * slidesContainer.clientWidth, behavior: 'auto' });
    this.setupDismissGesture(viewerRoot);
    this.setStatusBarForViewer(true);
  }

  onViewerDismissed() {
    this.dismissGesture?.destroy();
    this.dismissGesture = undefined;
    this.slidesEl = undefined;
    this.setStatusBarForViewer(false);
    this.closePhoto();
  }

  private setStatusBarForViewer(isOpen: boolean) {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    if (isOpen) {
      // El fondo del visor es negro — Style.Dark pinta íconos claros (blancos).
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#000000' }).catch(() => {});
      return;
    }
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch(() => {});
    StatusBar.setBackgroundColor({ color: isDark ? '#000000' : '#ffffff' }).catch(() => {});
  }

  onSlidesScroll(slidesContainer: HTMLElement) {
    const width = slidesContainer.clientWidth || 1;
    const index = Math.round(slidesContainer.scrollLeft / width);
    const photos = this.photoService.photos();
    if (index !== this.selectedIndex() && index >= 0 && index < photos.length) {
      this.selectedIndex.set(index);
    }
  }

  private setupDismissGesture(viewerRoot: HTMLElement) {
    this.dismissGesture = this.gestureCtrl.create(
      {
        el: viewerRoot,
        gestureName: 'photo-viewer-swipe-dismiss',
        direction: 'y',
        threshold: 10,
        onMove: (ev) => {
          if (ev.deltaY > 0) {
            viewerRoot.style.transform = `translateY(${ev.deltaY}px)`;
            viewerRoot.style.opacity = `${Math.max(1 - ev.deltaY / 400, 0.3)}`;
          }
        },
        onEnd: (ev) => {
          viewerRoot.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
          if (ev.deltaY > 120) {
            viewerRoot.style.transform = 'translateY(100%)';
            viewerRoot.style.opacity = '0';
            setTimeout(() => this.closePhoto(), 150);
          } else {
            viewerRoot.style.transform = '';
            viewerRoot.style.opacity = '';
          }
          setTimeout(() => {
            viewerRoot.style.transition = '';
          }, 200);
        },
      },
      true,
    );
    this.dismissGesture.enable(true);
  }

  async deleteCurrentPhoto() {
    const index = this.selectedIndex();
    const photo = this.selectedPhoto();
    if (index === null || !photo) {
      return;
    }
    const alert = await this.alertCtrl.create({
      header: 'Eliminar foto',
      message: 'Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.photoService.deletePhoto(photo, index);
            const remaining = this.photoService.photos().length;
            if (remaining === 0) {
              this.closePhoto();
              return;
            }
            const newIndex = Math.min(index, remaining - 1);
            this.selectedIndex.set(newIndex);
            queueMicrotask(() => {
              this.slidesEl?.scrollTo({ left: newIndex * (this.slidesEl?.clientWidth ?? 0), behavior: 'auto' });
            });
          },
        },
      ],
    });
    await alert.present();
  }

  async shareCurrentPhoto() {
    const photo = this.selectedPhoto();
    if (!photo) {
      return;
    }
    try {
      await Share.share({ url: photo.filepath, dialogTitle: 'Compartir foto' });
    } catch {
      // si el usuario cancela el share sheet nativo también se rechaza — no hay nada que reportar
    }
  }

  private async presentToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 1500,
      position: 'bottom',
    });
    await toast.present();
  }
}
