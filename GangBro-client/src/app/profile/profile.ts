import { Component, computed, inject, Signal } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { UploadImg } from '../_dialogs/upload-img/upload-img'
import { PassportService } from '../_service/passport-service'
import { UserService } from '../_service/user-service'
import { MissionService } from '../_service/mission-service'
import { toSignal } from '@angular/core/rxjs-interop'
import { from } from 'rxjs'
import { CommonModule } from '@angular/common'
import { MatIconModule } from '@angular/material/icon'

@Component({
  selector: 'app-profile',
  imports: [CommonModule, MatIconModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  avatar_url: Signal<string>
  display_name: Signal<string | undefined>

  private _passport = inject(PassportService)
  private _dialog = inject(MatDialog)
  private _user = inject(UserService)
  private _missionService = inject(MissionService)

  // Mission Stats Logic
  private missions = toSignal(from(this._missionService.getMyMissions()), { initialValue: [] })

  historyMissions = computed(() => this.missions().filter(m => m.status === 'Completed' || m.status === 'Failed'))

  historyCount = computed(() => this.historyMissions().length)
  completedCount = computed(() => this.missions().filter(m => m.status === 'Completed').length)
  failedCount = computed(() => this.missions().filter(m => m.status === 'Failed').length)
  openCount = computed(() => this.missions().filter(m => m.status === 'Open').length)
  inProgressCount = computed(() => this.missions().filter(m => m.status === 'InProgress').length)


  constructor() {
    this.avatar_url = computed(() => this._passport.avatar())
    this.display_name = computed(() => this._passport.data()?.display_name)
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