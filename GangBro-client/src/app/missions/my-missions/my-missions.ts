import { Component, inject, signal, computed } from '@angular/core';
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
import { ConfirmDialog } from '../../_dialog/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-my-missions',
  standalone: true,
  imports: [CommonModule, MatMenuModule, MatButtonModule, MatSnackBarModule, MatDialogModule, MatIconModule],
  template: `
    <div class="lobby-wrapper">
      <!-- Sidebar Navigation -->
      <div class="side-nav">
          <div class="side-logo">
              <mat-icon>security</mat-icon>
          </div>
          <div class="nav-items">
              <div class="nav-item active"><mat-icon>view_module</mat-icon></div>
              <div class="nav-item"><mat-icon>account_balance_wallet</mat-icon></div>
              <div class="nav-item"><mat-icon>equalizer</mat-icon></div>
              <div class="nav-item"><mat-icon>settings</mat-icon></div>
          </div>
          <div class="side-footer">
              <mat-icon>logout</mat-icon>
          </div>
      </div>

      <!-- Main Lobby Content -->
      <div class="lobby-content">
          <!-- Top Navigation Header -->
          <div class="lobby-header">
              <div class="header-main">
                  <div class="lobby-title">PLAY</div>
                  <div class="lobby-tabs">
                      <button class="tab-btn active" (click)="setFilter('Active')">ACTIVE OPS</button>
                      <button class="tab-btn" (click)="setFilter('Archives')">ARCHIVES</button>
                      <button class="tab-btn">TRAINING</button>
                  </div>
              </div>
              <div class="header-sub">
                  <div class="status-badge">
                      <mat-icon>verified_user</mat-icon>
                      <span>ENCRYPTION ACTIVE</span>
                  </div>
              </div>
          </div>

          <!-- Mission Map Grid -->
          <div class="mission-maps-container">
              @if (isLoading()) {
                <div class="loading-state">
                    <div class="cyber-spinner"></div>
                    <p>SCANNING SECTORS...</p>
                </div>
              } @else if (missions().length === 0) {
                <div class="empty-state">
                    <mat-icon>visibility_off</mat-icon>
                    <p>NO ACTIVE MISSIONS DETECTED</p>
                    <button class="gang-btn sm" (click)="onAdd()">CREATE MISSION</button>
                </div>
              } @else {
                <div class="map-grid">
                  @for (m of missions(); track m.id; let i = $index) {
                    <div class="map-card" 
                         [class.selected]="selectedMissionId() === m.id" 
                         [class.chief-mode]="isChief(m)"
                         (click)="selectMission(m)">
                        
                        <div class="map-image">
                            <img [src]="getBgImage(i)" alt="Mission Background">
                        </div>

                        <div class="map-overlay">
                            @if (selectedMissionId() === m.id) {
                                <div class="selection-check">
                                    <mat-icon>check</mat-icon>
                                </div>
                            }

                            @if (isChief(m)) {
                                <div class="chief-marker">CHIEF</div>
                            }

                            <div class="category-icon">
                                <mat-icon>{{ getCategoryIcon(m.category) }}</mat-icon>
                            </div>

                            <div class="map-info">
                                <div class="map-name">{{ m.name }}</div>
                                <div class="map-details">
                                    <span class="status-text" [class]="m.status">{{ m.status }}</span>
                                    <span class="crew-text">CREW: {{ m.crew_count }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="card-glow"></div>
                    </div>
                  }
                </div>
              }
          </div>

          <!-- Bottom Action Bar -->
          <div class="lobby-footer">
              <div class="footer-left">
                  <div class="squad-status">
                      <mat-icon>group</mat-icon>
                      <span>{{ selectedMission() ? (selectedMission()?.crew_count + ' CREW MEMBERS READY') : 'SELECT AN OPERATION' }}</span>
                  </div>
              </div>

              <div class="footer-right">
                  @if (selectedMission()) {
                      <div class="selected-actions">
                          <button class="intel-btn" (click)="onViewAbout(selectedMission()!.id)">INTEL</button>
                          @if (isChief(selectedMission()!)) {
                            <button class="edit-btn" (click)="onEdit(selectedMission()!)">EDIT</button>
                          }
                      </div>

                      <button class="go-btn" 
                              [disabled]="isChief(selectedMission()!) && selectedMission()?.status === 'Open' && selectedMission()!.crew_count < 2"
                              (click)="onExecute()">
                          <span>{{ getExecuteText() }}</span>
                      </button>
                  } @else {
                      <button class="go-btn disabled">
                          <span>SELECT OP</span>
                      </button>
                  }
              </div>
          </div>
      </div>

      <!-- Add FAB removed, integrated into empty state and top menu potential -->
      <button class="side-add-btn" (click)="onAdd()" title="Create New Operation">
          <mat-icon>add</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    :host {
        display: block;
        height: 100vh;
        overflow: hidden;
        background: #0a0a0c;
        color: white;
    }

    .lobby-wrapper {
        display: flex;
        height: 100vh;
        background: radial-gradient(circle at center, #1a1a24 0%, #0a0a0c 100%);
        position: relative;
    }

    /* Sidebar Navigation */
    .side-nav {
        width: 60px;
        background: rgba(0, 0, 0, 0.4);
        border-right: 1px solid rgba(255, 255, 255, 0.05);
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px 0;
        z-index: 10;
        backdrop-filter: blur(10px);
    }

    .side-logo {
        color: var(--gang-accent);
        margin-bottom: 40px;
        mat-icon { font-size: 32px; width: 32px; height: 32px; }
    }

    .nav-items {
        display: flex;
        flex-direction: column;
        gap: 25px;
        flex: 1;

        .nav-item {
            color: rgba(255, 255, 255, 0.3);
            cursor: pointer;
            transition: all 0.3s;
            &:hover, &.active {
                color: white;
                transform: scale(1.1);
            }
            &.active {
                color: var(--gang-primary);
                filter: drop-shadow(0 0 5px var(--gang-primary));
            }
        }
    }

    .side-footer {
        color: rgba(255, 255, 255, 0.3);
        cursor: pointer;
        &:hover { color: #ff5252; }
    }

    /* Main Content */
    .lobby-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 0 40px;
        position: relative;
        overflow: hidden;

        &::before {
            content: '';
            position: absolute;
            inset: 0;
            background: url('/assets/missions/bg3.png') center/cover;
            opacity: 0.1;
            pointer-events: none;
        }
    }

    /* Header Section */
    .lobby-header {
        height: 120px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        z-index: 2;

        .lobby-title {
            font-size: 2.5rem;
            font-weight: 900;
            letter-spacing: 10px;
            color: white;
            margin-bottom: 15px;
        }

        .lobby-tabs {
            display: flex;
            gap: 30px;

            .tab-btn {
                background: transparent;
                border: none;
                color: rgba(255, 255, 255, 0.4);
                font-family: 'Oxanium', sans-serif;
                font-weight: 700;
                font-size: 0.9rem;
                letter-spacing: 2px;
                cursor: pointer;
                padding: 10px 0;
                position: relative;
                transition: color 0.3s;

                &:hover { color: white; }

                &.active {
                    color: white;
                    &::after {
                        content: '';
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        width: 100%;
                        height: 3px;
                        background: var(--gang-accent);
                        box-shadow: 0 0 10px var(--gang-accent);
                    }
                }
            }
        }

        .status-badge {
            display: flex;
            align-items: center;
            gap: 10px;
            background: rgba(0, 230, 118, 0.1);
            color: #00e676;
            padding: 8px 15px;
            border-radius: 4px;
            font-weight: 800;
            font-size: 0.75rem;
            letter-spacing: 1px;
            border: 1px solid rgba(0, 230, 118, 0.2);
        }
    }

    /* Map Grid Section */
    .mission-maps-container {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px 0;
        overflow-x: auto;
        overflow-y: hidden;

        &::-webkit-scrollbar { height: 4px; }
        &::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); }
    }

    .map-grid {
        display: flex;
        gap: 20px;
        padding: 20px;
    }

    .map-card {
        width: 180px;
        height: 400px;
        background: #111;
        border: 2px solid rgba(255, 255, 255, 0.1);
        position: relative;
        cursor: pointer;
        transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
        overflow: hidden;

        &:hover {
            transform: scale(1.02) translateY(-10px);
            border-color: rgba(255, 255, 255, 0.3);
            .card-glow { opacity: 0.2; }
        }

        &.selected {
            width: 200px;
            border-color: white;
            border-width: 4px;
            box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
            
            .map-overlay { background: rgba(0, 0, 0, 0.2); }
            .map-info { transform: translateY(0); }
        }

        &.chief-mode {
            border-color: var(--gang-accent);
            &.selected { box-shadow: 0 0 20px rgba(249, 212, 35, 0.2); }
        }

        .map-image {
            position: absolute;
            inset: 0;
            img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.7); }
        }

        .map-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.4);
            display: flex;
            flex-direction: column;
            padding: 20px;
            transition: background 0.3s;
        }

        .selection-check {
            position: absolute;
            top: 15px;
            right: 15px;
            background: white;
            color: black;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            mat-icon { font-size: 18px; width: 18px; height: 18px; }
        }

        .chief-marker {
            position: absolute;
            top: 15px;
            left: 15px;
            background: var(--gang-accent);
            color: black;
            font-size: 0.6rem;
            font-weight: 900;
            padding: 2px 8px;
            border-radius: 2px;
            letter-spacing: 1px;
        }

        .category-icon {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            mat-icon { 
                font-size: 80px; 
                width: 80px; 
                height: 80px; 
                opacity: 0.8;
                filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
            }
        }

        .map-info {
            .map-name {
                font-size: 1.2rem;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 2px;
                margin-bottom: 5px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .map-details {
                display: flex;
                justify-content: space-between;
                font-size: 0.65rem;
                font-weight: 700;
                color: rgba(255, 255, 255, 0.5);

                .status-text.Open { color: #00e676; }
                .status-text.InProgress { color: var(--gang-primary); }
            }
        }

        .card-glow {
            position: absolute;
            inset: 0;
            background: white;
            opacity: 0;
            transition: opacity 0.3s;
            pointer-events: none;
        }
    }

    /* Footer Section */
    .lobby-footer {
        height: 100px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        z-index: 2;

        .squad-status {
            display: flex;
            align-items: center;
            gap: 15px;
            color: rgba(255, 255, 255, 0.6);
            font-weight: 700;
            font-size: 0.9rem;
            letter-spacing: 1px;
            mat-icon { color: var(--gang-primary); }
        }

        .footer-right {
            display: flex;
            align-items: center;
            gap: 30px;
        }

        .selected-actions {
            display: flex;
            gap: 10px;

            button {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: white;
                padding: 10px 20px;
                font-family: 'Oxanium', sans-serif;
                font-weight: 700;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.3s;
                text-transform: uppercase;
                letter-spacing: 1px;
                
                &:hover { background: rgba(255, 255, 255, 0.15); border-color: rgba(255, 255, 255, 0.3); }
            }
        }

        .go-btn {
            width: 220px;
            height: 60px;
            background: linear-gradient(135deg, #00c853 0%, #00a142 100%);
            border: none;
            border-radius: 4px;
            color: white;
            font-family: 'Oxanium', sans-serif;
            font-size: 1.5rem;
            font-weight: 900;
            letter-spacing: 4px;
            cursor: pointer;
            box-shadow: 0 10px 20px rgba(0, 200, 83, 0.3);
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;

            &:hover:not(:disabled) {
                transform: scale(1.05);
                box-shadow: 0 15px 30px rgba(0, 200, 83, 0.4);
                filter: brightness(1.1);
            }

            &:disabled, &.disabled {
                background: #333;
                box-shadow: none;
                cursor: not-allowed;
                opacity: 0.5;
            }
        }
    }

    /* Additional UI Elements */
    .side-add-btn {
        position: fixed;
        bottom: 120px;
        right: 40px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: var(--gang-accent);
        color: black;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 20px rgba(249, 212, 35, 0.4);
        transition: all 0.3s;
        z-index: 100;
        
        &:hover { transform: scale(1.1) rotate(90deg); box-shadow: 0 0 30px rgba(249, 212, 35, 0.6); }
        mat-icon { font-size: 30px; width: 30px; height: 30px; }
    }

    .loading-state, .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        color: rgba(255, 255, 255, 0.4);
        font-weight: 800;
        letter-spacing: 5px;

        .cyber-spinner {
            width: 60px;
            height: 60px;
            border: 3px solid rgba(157, 80, 187, 0.1);
            border-top-color: var(--gang-primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        mat-icon { font-size: 80px; width: 80px; height: 80px; }
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 1024px) {
        .lobby-content { padding: 0 20px; }
        .lobby-header .lobby-title { font-size: 1.8rem; letter-spacing: 5px; }
        .map-card { width: 140px; }
        .map-card.selected { width: 160px; }
    }

    @media (max-width: 768px) {
        .side-nav { display: none; }
        .lobby-header { flex-direction: column; height: auto; padding: 20px 0; gap: 15px; align-items: flex-start; }
        .lobby-footer { flex-direction: column; height: auto; padding: 20px 0; gap: 20px; }
        .go-btn { width: 100%; }
        .footer-right { width: 100%; justify-content: space-between; gap: 10px; }
        .mission-maps-container { padding: 20px 0; }
    }
  `]
})
export class MyMissions {
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

  constructor() {
    this.myId.set(this._passportService.data()?.user_id);
    this.loadMissions();
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
      this.missions.set(this.allMissions().filter(m => m.status === 'Completed' || m.status === 'Failed'));
    } else {
      this.missions.set(this.allMissions().filter(m => m.status !== 'Completed' && m.status !== 'Failed'));
    }
    this.selectedMissionId.set(null);
    this.selectedMission.set(null);
  }

  getExecuteText(): string {
    const m = this.selectedMission();
    if (!m) return 'SELECT';
    if (!this.isChief(m)) return 'VIEW';
    if (m.status === 'Open') return 'START';
    if (m.status === 'InProgress') return 'COMPLETE';
    return 'LOCKED';
  }

  onExecute() {
    const m = this.selectedMission();
    if (!m) return;

    if (!this.isChief(m)) {
      this.onViewAbout(m.id);
      return;
    }

    if (m.status === 'Open') this.onStart(m.id);
    else if (m.status === 'InProgress') this.onComplete(m.id);
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
      this.missions.set(data.filter(m => m.status !== 'Completed' && m.status !== 'Failed'));

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
    const ref = this._dialog.open(ConfirmDialog, {
      data: {
        title: 'ABANDON MISSION',
        message: 'Are you sure you want to leave this mission?',
        confirmText: 'LEAVE',
        type: 'danger'
      }
    });
    ref.afterClosed().subscribe(res => {
      if (res) this.performAction(() => this._missionService.leave(id));
    });
  }

  async onStart(id: number) {
    const ref = this._dialog.open(ConfirmDialog, {
      data: {
        title: 'START OPERATION',
        message: 'Begin this mission and notify the crew?',
        confirmText: 'EXECUTE',
        type: 'info'
      }
    });
    ref.afterClosed().subscribe(res => {
      if (res) this.performAction(() => this._missionService.start(id));
    });
  }

  async onComplete(id: number) {
    const ref = this._dialog.open(ConfirmDialog, {
      data: {
        title: 'MISSION SUCCESS',
        message: 'Has the objective been fully achieved?',
        confirmText: 'COMPLETE',
        type: 'info'
      }
    });
    ref.afterClosed().subscribe(res => {
      if (res) this.performAction(() => this._missionService.complete(id));
    });
  }

  async onFail(id: number) {
    const ref = this._dialog.open(ConfirmDialog, {
      data: {
        title: 'MISSION FAILURE',
        message: 'Mark this mission as failed? This will be logged.',
        confirmText: 'FAIL',
        type: 'danger'
      }
    });
    ref.afterClosed().subscribe(res => {
      if (res) this.performAction(() => this._missionService.fail(id));
    });
  }

  async onDelete(id: number) {
    const ref = this._dialog.open(ConfirmDialog, {
      data: {
        title: 'TERMINATE MISSION',
        message: 'Delete this mission? This action cannot be undone.',
        confirmText: 'DELETE',
        type: 'danger'
      }
    });
    ref.afterClosed().subscribe(res => {
      if (res) this.performAction(() => this._missionService.delete(id));
    });
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
      this._snackBar.open(msg, 'Close', { duration: 3000 });
    }
  }
}
