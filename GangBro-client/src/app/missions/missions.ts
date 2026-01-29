import { Component, computed, inject, Signal } from '@angular/core'
import { MissionFilter } from '../_models/mission-filter'
import { Mission } from '../_models/mission'
import { FormsModule } from '@angular/forms'
import { BehaviorSubject } from 'rxjs'
import { AsyncPipe, DatePipe } from '@angular/common'
import { MissionService } from '../_service/mission-service'
import { PassportService } from '../_service/passport-service'


@Component({
  selector: 'app-missions',
  imports: [FormsModule, AsyncPipe, DatePipe],
  templateUrl: './missions.html',
  styleUrl: './missions.scss',
})
export class Missions {
  private _mission = inject(MissionService)
  private _passport = inject(PassportService)
  filter: MissionFilter = {}
  // missions: Mission[] = []

  private _missionsSubject = new BehaviorSubject<Mission[]>([])
  readonly missions$ = this._missionsSubject.asObservable()
  isSignin: Signal<boolean>
  myUserId: Signal<number | undefined>

  constructor() {
    this.isSignin = computed(() => this._passport.data() !== undefined)
    this.myUserId = computed(() => this._passport.data()?.user_id)
    this.filter = {} // Reset filter to show all
    this._mission.filter = this.filter
    this.loadMyMission()
  }

  async loadMyMission() {
    const userData = this._passport.data()
    // if (userData?.user_id) {
    //   this.filter.exclude_chief_id = userData.user_id
    // }

    // 1. Get all candidates (excluding own created)
    const allMissions = await this._mission.getByFilter(this.filter)

    // 2. Get my joined missions
    let myJoinedMissionIds: number[] = []
    if (this.isSignin()) {
      try {
        const myJoined = await this._mission.getMyMissions()
        myJoinedMissionIds = myJoined.map(m => m.id)
      } catch (error) {
        console.error('Failed to load my missions', error)
      }
    }

    // 3. Filter out joined missions ONLY if they are active. Show History.
    const filtered = allMissions.filter(m => {
      if (m.status === 'Completed' || m.status === 'Failed') return true;
      return !myJoinedMissionIds.includes(m.id)
    })
    this._missionsSubject.next(filtered)
  }

  async onSubmit() {
    this.loadMyMission()
  }

  async onJoin(missionId: number) {
    if (!confirm('Join this mission?')) return
    try {
      await this._mission.join(missionId)
      await this.loadMyMission() // Refresh list
    } catch (error) {
      console.error('Failed to join mission', error)
      alert('Failed to join mission')
    }
  }
}