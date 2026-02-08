import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MissionService } from '../../_service/mission-service';
import { PassportService } from '../../_service/passport-service';
import { Mission } from '../../_models/mission';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { NewMission } from '../../_dialog/new-mission/new-mission';
import { AddMission } from '../../_models/add-mission';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { getAvatar } from '../../_helpers/util';
import { MissionStatus } from '../../_enums/mission-status.enum';
import { confirmAndExecute } from '../../_helpers/dialog.helper';
import { MISSION_MESSAGES } from '../../_constants/messages.constants';
import { APP_CONFIG } from '../../_constants/config.constants';

@Component({
  selector: 'app-my-missions',
  standalone: true,
  imports: [CommonModule, MatMenuModule, MatButtonModule, MatSnackBarModule, MatDialogModule, MatIconModule],
  templateUrl: './my-missions.html',
  styleUrl: './my-missions.scss'
})
export class MyMissions implements OnDestroy {
  private _missionService = inject(MissionService);
  private _passportService = inject(PassportService);
  private _dialog = inject(MatDialog);
  private _router = inject(Router);
  private _snackBar = inject(MatSnackBar);

  missions = signal<Mission[]>([]);
  allMissions = signal<Mission[]>([]);
  isLoading = signal(true);
  myId = signal<number | undefined>(undefined);
  selectedMissionId = signal<number | null>(null);
  selectedMission = signal<Mission | null>(null);

  isMobile = signal(window.innerWidth <= 768);
  display_name = computed(() => this._passportService.data()?.display_name);
  avatar_url = computed(() => getAvatar(this._passportService.data()));

  private _resizeListener = () => {
    this.isMobile.set(window.innerWidth <= 768);
  };

  constructor() {
    this.myId.set(this._passportService.data()?.user_id);
    this.loadMissions();
    window.addEventListener('resize', this._resizeListener);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this._resizeListener);
  }

  handleCardClick(m: Mission) {
    if (this.isMobile()) {
      this.onViewAbout(m.id);
    } else {
      this.selectMission(m);
    }
  }

  getBgImage(index: number): string {
    const images = [
      '/assets/missions/bg1.png',
      '/assets/missions/bg2.png',
      '/assets/missions/bg3.png'
    ];
    return images[index % images.length];
  }

  getCategoryIcon(cat: string): string {
    const lower = (cat || '').toLowerCase();
    if (lower.includes('cyber')) return 'hub';
    if (lower.includes('stealth')) return 'visibility_off';
    if (lower.includes('combat')) return 'security';
    if (lower.includes('social')) return 'forum';
    return 'assignment';
  }

  selectMission(m: Mission) {
    if (this.selectedMissionId() === m.id) {
      this.selectedMissionId.set(null);
      this.selectedMission.set(null);
    } else {
      this.selectedMissionId.set(m.id);
      this.selectedMission.set(m);
    }
  }

  setFilter(type: string) {
    if (type === 'Archives') {
      this.missions.set(this.allMissions().filter(m => 
        m.status === MissionStatus.Completed || m.status === MissionStatus.Failed
      ));
    } else {
      this.missions.set(this.allMissions().filter(m => 
        m.status !== MissionStatus.Completed && m.status !== MissionStatus.Failed
      ));
    }
    this.selectedMissionId.set(null);
    this.selectedMission.set(null);
  }

  getExecuteText(): string {
    const m = this.selectedMission();
    if (!m) return 'SELECT';
    if (!this.isChief(m)) return 'VIEW';
    if (m.status === MissionStatus.Open) return 'START';
    if (m.status === MissionStatus.InProgress) return 'COMPLETE';
    return 'LOCKED';
  }

  onExecute() {
    const m = this.selectedMission();
    if (!m) return;

    if (!this.isChief(m)) {
      this.onViewAbout(m.id);
      return;
    }

    if (m.status === MissionStatus.Open) this.onStart(m.id);
    else if (m.status === MissionStatus.InProgress) this.onComplete(m.id);
  }

  onViewAbout(id: number) {
    this._router.navigate(['/about-mission', id]);
  }

  isChief(mission: Mission): boolean {
    return mission.chief_id === this.myId();
  }

  async loadMissions() {
    try {
      this.isLoading.set(true);
      const data = await this._missionService.getMyMissions();
      this.allMissions.set(data);
      // Default to active missions
      this.missions.set(data.filter(m => 
        m.status !== MissionStatus.Completed && m.status !== MissionStatus.Failed
      ));

      if (this.missions().length > 0) {
        this.selectMission(this.missions()[0]);
      }
    } catch (e) {
      console.error('Error loading my missions', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  onAdd() {
    const ref = this._dialog.open(NewMission);
    ref.afterClosed().subscribe(async (result: AddMission) => {
      if (result) {
        this.performAction(async () => { await this._missionService.add(result) });
      }
    });
  }

  async onLeave(id: number) {
    await confirmAndExecute(this._dialog, MISSION_MESSAGES.ABANDON, () => this._missionService.leave(id)) && this.loadMissions();
  }

  async onStart(id: number) {
    await confirmAndExecute(this._dialog, MISSION_MESSAGES.START, () => this._missionService.start(id)) && this.loadMissions();
  }

  async onComplete(id: number) {
    await confirmAndExecute(this._dialog, MISSION_MESSAGES.COMPLETE, () => this._missionService.complete(id)) && this.loadMissions();
  }

  async onFail(id: number) {
    await confirmAndExecute(this._dialog, MISSION_MESSAGES.FAIL, () => this._missionService.fail(id)) && this.loadMissions();
  }

  async onDelete(id: number) {
    await confirmAndExecute(this._dialog, MISSION_MESSAGES.DELETE, () => this._missionService.delete(id)) && this.loadMissions();
  }

  onEdit(mission: Mission) {
    const ref = this._dialog.open(NewMission, { data: mission });

    ref.afterClosed().subscribe(async (result: AddMission | any) => {
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
}
