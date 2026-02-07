import { Component, inject, signal } from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './navbar/navbar';
import { NgxSpinnerComponent } from 'ngx-spinner';
import { ShadowCursorComponent } from './_components/shadow-cursor/shadow-cursor.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, NgxSpinnerComponent, MatSnackBarModule, MatIconModule, MatTooltipModule, ShadowCursorComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  constructor() {
    console.log('GangBro App Initialized - V2 Loading Screen');
  }
  protected readonly title = signal('GangBro-client');
  private _snackBar = inject(MatSnackBar);

  clearCache() {
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();

    // Clear cookie-based cache if any (basic approach)
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }

    this._snackBar.open('CACHE PURGED: SYSTEM REBOOTING...', 'OK', {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });

    // Force reload after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  }
}