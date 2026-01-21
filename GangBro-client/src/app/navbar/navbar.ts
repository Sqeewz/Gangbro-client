import { Component, computed, inject, Signal, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';
import { PassportService } from '../_service/passport-service';
import { getAvatar } from '../_helpers/util';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, RouterModule, MatMenuModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  encapsulation: ViewEncapsulation.None
})
export class Navbar {
  private _router: Router = inject(Router)
  private _passportService: PassportService = inject(PassportService)
  display_name: Signal<string | undefined>
  avatar_url: Signal<string | undefined>
  isLoggedIn: Signal<boolean>

  constructor() {
    this.display_name = computed(() => this._passportService.data()?.display_name)
    this.avatar_url = computed(() => getAvatar(this._passportService.data()))
    this.isLoggedIn = computed(() => !!this._passportService.data()?.token)
  }

  logout(): void {
    this._passportService.destroy()
    this._router.navigate(['/login'])
  }
}