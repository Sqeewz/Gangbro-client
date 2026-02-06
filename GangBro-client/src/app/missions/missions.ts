import { Component, computed, inject, Signal, signal, OnInit, OnDestroy, NgZone } from '@angular/core'
import { Router } from '@angular/router'
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
import { MatIconModule } from '@angular/material/icon'

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
    MatIconModule,
    MissionStatus,
    StateMessage,
  ],
  templateUrl: './missions.html',
  styleUrl: './missions.scss',
})
export class Missions implements OnInit, OnDestroy {
  private _mission = inject(MissionService)
  private _passport = inject(PassportService)
  private _snackBar = inject(MatSnackBar)
  private _dialog = inject(MatDialog)
  private _ngZone = inject(NgZone)
  private _router = inject(Router)

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
  private _pollingHandle: any

  constructor() {
    this.isSignin = computed(() => this._passport.data() !== undefined)
    this.myUserId = computed(() => this._passport.data()?.user_id)
    this.filter = { page: 1, limit: 10 }
    this._mission.filter = this.filter
  }

  async ngOnInit() {
    await this.loadMyMission()
    this.startPolling()
  }

  ngOnDestroy() {
    this.stopPolling()
  }

  private startPolling() {
    this.stopPolling()
    // Poll mission list every 10 seconds for general lobby updates
    this._ngZone.runOutsideAngular(() => {
      this._pollingHandle = setInterval(() => {
        this.loadMyMission(true) // Silent load
      }, 10000)
    })
  }

  private stopPolling() {
    if (this._pollingHandle) {
      clearInterval(this._pollingHandle)
      this._pollingHandle = undefined
    }
  }

  async loadMyMission(silent = false) {
    try {
      if (!silent) this.isLoading.set(true)

      const allMissions = await this._mission.getByFilter(this.filter)

      let myJoinedMissionIds: number[] = []
      if (this.isSignin()) {
        const myJoined = await this._mission.getMyMissions()
        myJoinedMissionIds = myJoined.map(m => m.id)
      }

      const filtered = allMissions.filter(m => {
        if (m.status === 'Completed' || m.status === 'Failed') return true;
        return !myJoinedMissionIds.includes(m.id)
      })

      // Compare to avoid unnecessary signal updates if data is same
      const current = this._missionsSubject.value
      if (JSON.stringify(filtered) !== JSON.stringify(current)) {
        this._ngZone.run(() => {
          this._missionsSubject.next(filtered)
        })
      }
    } catch (error) {
      if (!silent) {
        console.error('Failed to load missions', error)
        this._snackBar.open('Sector sync lost. Check uplink.', 'Close', { duration: 3000 })
      }
    } finally {
      if (!silent) this.isLoading.set(false)
    }
  }

  async onSubmit() {
    this.filter.page = 1;
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
          this.selectedMission = null;
          this._snackBar.open('Joined mission successfully', 'Close', { duration: 4000 })
          // Redirect to mission details after joining
          this._router.navigate(['/about-mission', missionId]);
        } catch (error) {
          console.error('Failed to join mission', error)
          this._snackBar.open('Failed to join mission', 'Close', { duration: 3000 })
        }
      }
    });
  }
}