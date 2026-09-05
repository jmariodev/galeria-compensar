import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {
    this.watchColorScheme();
  }

  private watchColorScheme() {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyStyle = (isDark: boolean) => {
      // La nomenclatura de Capacitor está invertida respecto a lo esperado: Style.Dark pinta
      // íconos claros (blancos) — pensado para fondos oscuros — y Style.Light pinta
      // íconos oscuros para fondos claros.
      StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch(() => {});
      StatusBar.setBackgroundColor({ color: isDark ? '#000000' : '#ffffff' }).catch(() => {});
    };
    applyStyle(media.matches);
    media.addEventListener('change', (event) => applyStyle(event.matches));
  }
}
