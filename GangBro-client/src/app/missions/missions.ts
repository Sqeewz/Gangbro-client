import { Component, computed, inject, Signal, signal } from '@angular/core'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { MatMenuModule } from '@angular/material/menu'
import { MatButtonModule } from '@angular/material/button'
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'
import { NewMission } from '../_dialog/new-mission/new-mission'
import { AddMission } from '../_models/add-mission'
import { DescriptionMission } from '../_dialog/description-mission/description-mission'
import { MissionFilter } from '../_models/mission-filter'
import { Mission } from '../_models/mission'
import { FormsModule } from '@angular/forms'
import { BehaviorSubject } from 'rxjs'
import { AsyncPipe, UpperCasePipe } from '@angular/common'
import { MissionService } from '../_service/mission-service'
import { PassportService } from '../_service/passport-service'
import { ConfirmDialog } from '../_dialog/confirm-dialog/confirm-dialog'


import { MissionStatus } from './mission-status/mission-status'
import { StateMessage } from '../_components/state-message/state-message'


@Component({
  selector: 'app-missions',
  standalone: true,
  imports: [
    FormsModule,
    AsyncPipe,
    UpperCasePipe,
    MatMenuModule,
    MatButtonModule,
    MatSnackBarModule,
    MatDialogModule,
    MissionStatus,
    StateMessage,
  ],
  templateUrl: './missions.html',
  styleUrl: './missions.scss',
})
export class Missions {
  private _mission = inject(MissionService)
  private _passport = inject(PassportService)
  private _snackBar = inject(MatSnackBar)
  private _dialog = inject(MatDialog)

  filter: MissionFilter = {
    page: 1,
    limit: 10
  }

  private _missionsSubject = new BehaviorSubject<Mission[]>([])
  readonly missions$ = this._missionsSubject.asObservable()
  isSignin: Signal<boolean>
  myUserId: Signal<number | undefined>

  selectedMission: Mission | null = null
  isLoading = signal(false)

  constructor() {
    this.isSignin = computed(() => this._passport.data() !== undefined)
    this.myUserId = computed(() => this._passport.data()?.user_id)
    this.filter = { page: 1, limit: 10 } // Reset filter to show all
    this._mission.filter = this.filter
    this.loadMyMission()
  }

  async loadMyMission() {
    try {
      this.isLoading.set(true)
      // 1. Get all candidates
      const allMissions = await this._mission.getByFilter(this.filter)

      // 2. Get my joined missions
      let myJoinedMissionIds: number[] = []
      if (this.isSignin()) {
        const myJoined = await this._mission.getMyMissions()
        myJoinedMissionIds = myJoined.map(m => m.id)
      }

      // 3. Filter out joined missions ONLY if they are active. Show History.
      const filtered = allMissions.filter(m => {
        if (m.status === 'Completed' || m.status === 'Failed') return true;
        return !myJoinedMissionIds.includes(m.id)
      })
      this._missionsSubject.next(filtered)
    } catch (error) {
      console.error('Failed to load missions', error)
      this._snackBar.open('System error: Failed to sync mission data', 'Close', { duration: 3000 })
    } finally {
      this.isLoading.set(false)
    }
  }

  async onSubmit() {
    this.filter.page = 1; // Reset to page 1 on search
    await this.loadMyMission()
  }

  async onNextPage() {
    this.filter.page = (this.filter.page || 1) + 1;
    await this.loadMyMission();
  }

  async onPrevPage() {
    if ((this.filter.page || 1) > 1) {
      this.filter.page = (this.filter.page || 1) - 1;
      await this.loadMyMission();
    }
  }

  onAdd() {
    const dialogRef = this._dialog.open(NewMission)
    dialogRef.afterClosed().subscribe(async (result: AddMission) => {
      if (result) {
        try {
          await this._mission.add(result)
          await this.loadMyMission()
          this._snackBar.open('Mission deployed successfully', 'Close', { duration: 3000 })
        } catch (error) {
          console.error('Failed to add mission', error)
          this._snackBar.open('Failed to deploy mission', 'Close', { duration: 3000 })
        }
      }
    })
  }

  onView(mission: Mission) {
    this.selectedMission = mission
  }

  async onJoin(missionId: number) {
    const ref = this._dialog.open(ConfirmDialog, {
      data: {
        title: 'JOIN OPERATION',
        message: 'Do you want to enlist in this mission?',
        confirmText: 'ENLIST',
        type: 'info'
      }
    });

    ref.afterClosed().subscribe(async (res) => {
      if (res) {
        try {
          await this._mission.join(missionId)
          this.selectedMission = null; // Clear detail view
          await this.loadMyMission() // Refresh list
          this._snackBar.open('Joined mission successfully', 'Close', { duration: 4000 })
        } catch (error) {
          console.error('Failed to join mission', error)
          this._snackBar.open('Failed to join mission', 'Close', { duration: 3000 })
        }
      }
    });
  }
}