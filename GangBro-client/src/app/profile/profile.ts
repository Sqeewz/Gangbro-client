import { Component, computed, inject, Signal } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { UploadImg } from '../_dialogs/upload-img/upload-img'
import { PassportService } from '../_service/passport-service'
import { UserService } from '../_service/user-service'


@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  avatar_url: Signal<string>
  private _passport = inject(PassportService)
  private _dialog = inject(MatDialog)
  private _user = inject(UserService)

  constructor() {
    this.avatar_url = computed(() => this._passport.avatar())
  }

  openDialog() {
    const ref = this._dialog.open(UploadImg)
    ref.afterClosed().subscribe(async file => {
      if (file) {
        const error = await this._user.uploadAvatarImg(file)
        if (error)
          console.error(error)
      }
    })
  }
}