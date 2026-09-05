import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'acerca-de',
    loadComponent: () => import('./acerca-de/acerca-de.page').then((m) => m.AcercaDePage),
  },
];
