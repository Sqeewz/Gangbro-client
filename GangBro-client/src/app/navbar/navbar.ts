import { Component, computed, inject, Signal } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatMenuModule } from '@angular/material/menu'
import { Router, RouterLink, RouterLinkActive } from "@angular/router"
import { PassportService } from '../_service/passport-service'
import { getAvatar } from '../_helpers/util'

@Component({
  selector: 'app-navbar',
  imports: [MatToolbarModule, MatButtonModule, MatMenuModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private _router = inject(Router)
  private _passport = inject(PassportService)
  display_name: Signal<string | undefined>
  avatar_url: Signal<string | undefined>

  constructor() {
    this.display_name = computed(() => this._passport.data()?.display_name)
    this.avatar_url = computed(() => getAvatar(this._passport.data()))
  }

  logout() {
    this._passport.destroy()

    this._router.navigate(['/login'])
  }
}