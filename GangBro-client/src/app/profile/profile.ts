import { Component, computed, inject, Signal, signal, OnDestroy } from '@angular/core'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { UploadImg } from '../_dialog/upload-img/upload-img'
import { PassportService } from '../_service/passport-service'
import { UserService } from '../_service/user-service'
import { MissionService } from '../_service/mission-service'
import { toSignal } from '@angular/core/rxjs-interop'
import { from } from 'rxjs'
import { CommonModule } from '@angular/common'
import { MatIconModule } from '@angular/material/icon'
import { MatButtonModule } from '@angular/material/button'
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'
import { ActivatedRoute, Router } from '@angular/router'
import { Mission } from '../_models/mission'
import { MissionStatus } from '../_enums/mission-status.enum'
import { confirmAndExecute } from '../_helpers/dialog.helper'
import { MISSION_MESSAGES } from '../_constants/messages.constants'
import { APP_CONFIG } from '../_constants/config.constants'
import { NewMission } from '../_dialog/new-mission/new-mission'
import { AddMission } from '../_models/add-mission'
import { getAvatar } from '../_helpers/util'

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatDialogModule, MatSnackBarModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnDestroy {
  private _passport = inject(PassportService)
  private _dialog = inject(MatDialog)
  private _user = inject(UserService)
  private _missionService = inject(MissionService)
  private _router = inject(Router)
  private _snackBar = inject(MatSnackBar)
  private _route = inject(ActivatedRoute)

  avatar_url: Signal<string>
  display_name: Signal<string | undefined>

  // Tab Management
  activeTab = signal<'active' | 'archives' | 'training'>('active');

  // Updated signal management for missions
  allMissions = signal<Mission[]>([]);
  isLoading = signal(true);
  myId = signal<number | undefined>(undefined);

  activeMissions = computed(() =>
    this.allMissions().filter(m => m.status !== MissionStatus.Completed && m.status !== MissionStatus.Failed)
  );

  historyMissions = computed(() =>
    this.allMissions().filter(m => m.status === MissionStatus.Completed || m.status === MissionStatus.Failed)
  );

  // Stats
  historyCount = computed(() => this.historyMissions().length)
  completedCount = computed(() => this.allMissions().filter(m => m.status === MissionStatus.Completed).length)
  failedCount = computed(() => this.allMissions().filter(m => m.status === MissionStatus.Failed).length)
  openCount = computed(() => this.allMissions().filter(m => m.status === MissionStatus.Open).length)
  inProgressCount = computed(() => this.allMissions().filter(m => m.status === MissionStatus.InProgress).length)

  isMobile = signal(window.innerWidth <= 768);
  private _resizeListener = () => this.isMobile.set(window.innerWidth <= 768);

  constructor() {
    this.myId.set(this._passport.data()?.user_id);
    this.avatar_url = computed(() => this._passport.avatar())
    this.display_name = computed(() => this._passport.data()?.display_name)
    this.loadMissions();

    this._route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab === 'active' || tab === 'archives' || tab === 'training') {
        this.activeTab.set(tab);
      }
    });

    window.addEventListener('resize', this._resizeListener);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this._resizeListener);
  }

  async loadMissions() {
    try {
      this.isLoading.set(true);
      const data = await this._missionService.getMyMissions();
      this.allMissions.set(data);
    } catch (e) {
      console.error('Error loading missions', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  openDialog() {
    const ref = this._dialog.open(UploadImg)
    ref.afterClosed().subscribe(async file => {
      if (file) {
        const error = await this._user.uploadAvatarImg(file)
        if (error) console.error(error)
      }
    })
  }

  // Mission Actions integrated from my-missions.ts
  onAdd() {
    const ref = this._dialog.open(NewMission);
    ref.afterClosed().subscribe(async (result: AddMission) => {
      if (result) {
        this.performAction(async () => { await this._missionService.add(result) });
      }
    });
  }

  onViewAbout(id: number) {
    this._router.navigate(['/about-mission', id]);
  }

  isChief(mission: Mission): boolean {
    return mission.chief_id === this.myId();
  }

  getExecuteText(m: Mission): string {
    if (!this.isChief(m)) return 'VIEW';
    if (m.status === MissionStatus.Open) return 'START';
    if (m.status === MissionStatus.InProgress) return 'COMPLETE';
    return 'LOCKED';
  }

  onExecute(m: Mission) {
    if (!this.isChief(m)) {
      this.onViewAbout(m.id);
      return;
    }
    if (m.status === MissionStatus.Open) this.onStart(m.id);
    else if (m.status === MissionStatus.InProgress) this.onComplete(m.id);
  }

  async onStart(id: number) {
    await confirmAndExecute(this._dialog, MISSION_MESSAGES.START, () => this._missionService.start(id)) && this.loadMissions();
  }

  async onComplete(id: number) {
    await confirmAndExecute(this._dialog, MISSION_MESSAGES.COMPLETE, () => this._missionService.complete(id)) && this.loadMissions();
  }

  onEdit(mission: Mission) {
    const ref = this._dialog.open(NewMission, { data: mission });
    ref.afterClosed().subscribe(async (result: any) => {
      if (!result) return;
      this.performAction(() => this._missionService.update(mission.id, result));
    });
  }

  private async performAction(action: () => Promise<void>) {
    try {
      await action();
      await this.loadMissions();
    } catch (e: any) {
      console.error('Action failed', e);
      const msg = e?.error || e?.message || 'Action failed';
      this._snackBar.open(msg, 'Close', { duration: APP_CONFIG.SNACKBAR_DURATION });
    }
  }

  getCategoryIcon(cat: string): string {
    const lower = (cat || '').toLowerCase();
    if (lower.includes('cyber')) return 'hub';
    if (lower.includes('stealth')) return 'visibility_off';
    if (lower.includes('combat')) return 'security';
    if (lower.includes('social')) return 'forum';
    return 'assignment';
  }
}