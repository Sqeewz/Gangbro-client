import { Component, computed, inject, Signal } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatMenuModule } from '@angular/material/menu'
import { MatIconModule } from '@angular/material/icon'
import { Router, RouterLink, RouterLinkActive } from "@angular/router"
import { PassportService } from '../_service/passport-service'
import { MatSnackBar } from '@angular/material/snack-bar'
import { NotificationService } from '../_service/notification-service'
import { CommonModule, DatePipe } from '@angular/common'
import { MatBadgeModule } from '@angular/material/badge'
import { MatTooltipModule } from '@angular/material/tooltip'
import { MatSnackBarModule } from '@angular/material/snack-bar'

@Component({
  selector: 'app-navbar',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatMenuModule,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    CommonModule,
    MatBadgeModule,
    MatTooltipModule,
    DatePipe,
    MatSnackBarModule
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private _router = inject(Router)
  private _passport = inject(PassportService)
  private _notification = inject(NotificationService)
  private _snackBar = inject(MatSnackBar)

  display_name: Signal<string | undefined>
  avatar_url: Signal<string | undefined>

  notifications = this._notification.notifications
  unreadCount = this._notification.unreadCount

  constructor() {
    this.display_name = computed(() => this._passport.data()?.display_name)
    this.avatar_url = computed(() => this._passport.avatar())
  }

  logout() {
    this._passport.destroy()
    this._router.navigate(['/login'])
  }

  markAllAsRead() {
    this._notification.markAllAsRead()
  }

  clearNotifications() {
    this._notification.clearAll()
  }

  /**
   * Purges all local storage, session storage, and cookies, then reloads the app.
   * Useful for debugging or resetting the system state.
   */
  clearCache() {
    localStorage.clear();
    sessionStorage.clear();

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

    setTimeout(() => {
      window.location.reload();
    }, 1500);
  }
}