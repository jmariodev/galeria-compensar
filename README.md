# GaleriaCompensar

Galería de fotos hecha con **Ionic + Angular + Capacitor**, desarrollada como proyecto de la actividad "Ionic/Angular almacenamiento de datos" (UCompensar).

## Funcionalidad

- Tomar una foto con la cámara o elegirla de la galería del dispositivo
- Guardado permanente en el almacenamiento local del dispositivo (Filesystem + Preferences)
- Galería en cuadrícula con miniaturas
- Visor de foto a pantalla completa con swipe entre fotos
- Eliminar una foto o varias a la vez (selección múltiple), con confirmación
- Compartir foto usando el share sheet nativo de Android
- Tema visual con la identidad de UCompensar (color institucional, ícono, splash screen)
- Interfaz completamente en español

## Stack técnico

- [Ionic Angular](https://ionicframework.com/docs/angular/overview) (standalone components, modo `ios`)
- [Capacitor](https://capacitorjs.com) como runtime nativo
- Plugins: Camera, Filesystem, Preferences, Haptics, Share, Status Bar, Splash Screen
- Plataforma nativa: Android

## Estructura del proyecto

- `src/app/home/` — pantalla principal (galería, visor, selección múltiple)
- `src/app/services/photo.service.ts` — lógica de captura, guardado y borrado de fotos
- `assets/` — imágenes fuente del ícono y splash screen de la app
- `android/` — proyecto nativo de Android generado por Capacitor

## Cómo ejecutar

Requiere Node `^22.22.3 || ^24.15.0 || >=26.0.0`.

```bash
npm install -g @ionic/cli
npm install

# En el navegador
ionic serve

# Sincronizar y abrir en Android Studio
npx cap sync android
npx cap open android
```
