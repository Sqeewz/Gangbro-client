import { Component, computed, inject, Signal } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatMenuModule } from '@angular/material/menu'
import { MatIconModule } from '@angular/material/icon'
import { Router, RouterLink, RouterLinkActive } from "@angular/router"
import { PassportService } from '../_service/passport-service'
import { getAvatar } from '../_helpers/util'
import { NotificationService } from '../_service/notification-service'
import { CommonModule, DatePipe } from '@angular/common'
import { MatBadgeModule } from '@angular/material/badge'
import { MatTooltipModule } from '@angular/material/tooltip'

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
    DatePipe
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private _router = inject(Router)
  private _passport = inject(PassportService)
  private _notification = inject(NotificationService)

  display_name: Signal<string | undefined>
  avatar_url: Signal<string | undefined>

  notifications = this._notification.notifications
  unreadCount = this._notification.unreadCount

  constructor() {
    this.display_name = computed(() => this._passport.data()?.display_name)
    this.avatar_url = computed(() => getAvatar(this._passport.data()))
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
}