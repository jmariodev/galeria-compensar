import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

@Component({
  selector: 'app-acerca-de',
  templateUrl: './acerca-de.page.html',
  styleUrls: ['./acerca-de.page.scss'],
  standalone: true,
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
  ],
})
export class AcercaDePage {
  appVersion = '1.0.0';
  universidad = 'UCompensar';
  actividad = 'Ionic/Angular almacenamiento de datos';
  nombreApp = 'GaleriaCompensar';
  descripcion =
    'Aplicación para guardar, organizar y visualizar fotos tomadas desde la cámara del dispositivo o seleccionadas desde la galería.';
  integrantes = ['Nombre 1', 'Nombre 2', 'Nombre 3'];
  tecnologias = ['Ionic', 'Angular', 'Capacitor'];
}
