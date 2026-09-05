import { Injectable, inject, signal } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import type { Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  public photos = signal<UserPhoto[]>([]);

  private PHOTO_STORAGE: string = 'photos';

  private platform = inject(Platform);

  public async addNewToGallery() {
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Prompt,
      quality: 100,
      promptLabelHeader: 'Foto',
      promptLabelPhoto: 'Elegir de la galería',
      promptLabelPicture: 'Tomar foto',
      promptLabelCancel: 'Cancelar',
    });

    const savedImageFile = await this.savePicture(capturedPhoto);
    this.photos.update((photos) => [savedImageFile, ...photos]);

    Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos()),
    });

    await this.vibrate(() => Haptics.impact({ style: ImpactStyle.Medium }));
  }

  private async savePicture(photo: Photo): Promise<UserPhoto> {
    // La API de Filesystem requiere los datos en base64 para poder guardarlos
    let base64Data: string | Blob;

    // "hybrid" detecta Cordova o Capacitor (es decir, que no estamos en el navegador)
    if (this.platform.is('hybrid')) {
      const file = await Filesystem.readFile({
        path: photo.path!,
      });

      base64Data = file.data;
    } else {
      base64Data = await this.base64FromPath(photo.webPath!);
    }

    const createdAt = Date.now();
    const fileName = createdAt + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
    });

    if (this.platform.is('hybrid')) {
      // El WebView solo puede cargar 'file://' reescribiéndolo a un esquema http propio
      // Detalles: https://ionicframework.com/docs/building/webview#file-protocol
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
        createdAt,
      };
    } else {
      return {
        filepath: fileName,
        webviewPath: photo.webPath,
        createdAt,
      };
    }
  }

  private async base64FromPath(path: string): Promise<string> {
    const response = await fetch(path);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject('method did not return a string');
        }
      };
      reader.readAsDataURL(blob);
    });
  }

  public async loadSaved() {
    const { value: photoList } = await Preferences.get({ key: this.PHOTO_STORAGE });
    const photos = (photoList ? JSON.parse(photoList) : []) as UserPhoto[];

    if (!this.platform.is('hybrid')) {
      for (const photo of photos) {
        const readFile = await Filesystem.readFile({
          path: photo.filepath,
          directory: Directory.Data,
        });

        photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
      }
    }

    this.photos.set(photos);
  }

  public async deletePhoto(photo: UserPhoto, position: number) {
    this.photos.update((photos) => photos.filter((_, index) => index !== position));

    Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos()),
    });

    const filename = photo.filepath.slice(photo.filepath.lastIndexOf('/') + 1);

    await Filesystem.deleteFile({
      path: filename,
      directory: Directory.Data,
    });

    await this.vibrate(() => Haptics.notification({ type: NotificationType.Success }));
  }

  public async deletePhotos(filepaths: string[]) {
    const toDelete = new Set(filepaths);
    this.photos.update((photos) => photos.filter((photo) => !toDelete.has(photo.filepath)));

    Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos()),
    });

    await Promise.all(
      filepaths.map((filepath) => {
        const filename = filepath.slice(filepath.lastIndexOf('/') + 1);
        return Filesystem.deleteFile({ path: filename, directory: Directory.Data }).catch(() => {
          // el archivo puede que ya no exista — no hay nada que hacer
        });
      }),
    );

    await this.vibrate(() => Haptics.notification({ type: NotificationType.Success }));
  }

  // Haptics no tiene respaldo web para todos los estilos; nunca debe romper el flujo principal
  private async vibrate(action: () => Promise<void>) {
    try {
      await action();
    } catch {
      // ignorado a propósito
    }
  }
}

export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
  createdAt: number;
}
