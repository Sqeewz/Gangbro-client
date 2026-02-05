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
  imports: [CommonModule, MatMenuModule, MatButtonModule, MatSnackBarModule, MatDialogModule],
  template: `
    <div class="my-missions-container">
      <h1 class="gang-title">ACTIVE OPERATIONS</h1>
      
      @if (isLoading()) {
        <div class="loading-state">
            <div class="spinner"></div>
            <p>SYNCING SATELLITE DATA...</p>
        </div>
      } @else if (missions().length === 0) {
        <div class="empty-state">
            <p>NO ACTIVE MISSIONS LOGGED IN SYSTEM</p>
        </div>
      } @else {
        <div class="mission-grid">
          @for (m of missions(); track m.id) {
            <div class="mission-card" [class.chief-card]="isChief(m)">
               @if(isChief(m)) {
                 <div class="chief-tag">CHIEF</div>
               }
              
              <div class="card-header">
                  <h3 class="mission-name">{{ m.name }}</h3>
                  <span class="status-badge" [class]="m.status">{{ m.status }}</span>
              </div>

              <p class="description">{{ m.description || 'No operational intel provided.' }}</p>
              
              <div class="mission-details">
                  <div class="detail-item">
                      <span class="label">CATEGORY</span>
                      <span class="value">{{ m.category || 'GENERAL' }}</span>
                  </div>
                  <div class="detail-item">
                      <span class="label">CHIEF</span>
                      <span class="value">{{ isChief(m) ? 'YOU' : m.chief_display_name }}</span>
                  </div>
              </div>

              <div class="actions-group">
                <button class="gang-btn secondary sm full-width mb-1" (click)="onViewAbout(m.id)">OPERATIONAL INTEL</button>
                @if (isChief(m)) {
                   <div class="chief-actions">
                       @if (m.status === 'Open') {
                          <button class="gang-btn sm" (click)="onStart(m.id)">START MISSION</button>
                          <button class="gang-btn secondary sm" (click)="onEdit(m)">EDIT</button>
                          <button class="gang-btn danger sm" (click)="onDelete(m.id)">DELETE</button>
                       }
                       @if (m.status === 'InProgress') {
                          <button class="gang-btn sm" (click)="onComplete(m.id)">COMPLETE</button>
                          <button class="gang-btn danger sm" (click)="onFail(m.id)">FAIL</button>
                       }
                   </div>
                } @else {
                   <button class="gang-btn danger sm full-width" (click)="onLeave(m.id)">LEAVE MISSION</button>
                }
              </div>
            </div>
          }
        </div>
      }
      <button class="fab-add-btn" [matMenuTriggerFor]="menu" #menuTrigger="matMenuTrigger" (mouseenter)="menuTrigger.openMenu()">+</button>
      <mat-menu #menu="matMenu" class="gang-menu" panelClass="gang-menu">
    <button mat-menu-item (click)="onAdd()">
        <span>Create New Mission</span>
    </button>
</mat-menu>
    </div>
  `,
  styles: [`
    .mb-1 { margin-bottom: 0.5rem; }
    .my-missions-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
        font-family: 'Oxanium', sans-serif;
    }

    .gang-title {
        font-size: 2.5rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 2px;
        background: var(--gang-gradient-main);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 2rem;
    }

    .mission-grid {
        display: grid;
        gap: 2rem;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    }

    .mission-card {
        background: var(--gang-surface);
        border: 1px solid var(--gang-border);
        padding: 1.5rem;
        border-radius: 12px;
        position: relative;
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);

        &:hover {
            transform: translateY(-5px);
            border-color: var(--gang-primary);
            box-shadow: 0 15px 40px rgba(124, 77, 255, 0.15);
        }

        &.chief-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: var(--gang-accent);
            box-shadow: 0 0 10px var(--gang-accent);
        }
    }

    .chief-tag {
        position: absolute;
        top: 0;
        right: 0;
        background: var(--gang-accent);
        color: black;
        font-size: 0.65rem;
        font-weight: 800;
        padding: 2px 10px;
        border-bottom-left-radius: 8px;
        letter-spacing: 1px;
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;

        .mission-name {
            margin: 0;
            font-size: 1.4rem;
            font-weight: 700;
            color: #fff;
            text-transform: uppercase;
            line-height: 1.2;
            flex: 1;
            padding-right: 1rem;
        }
    }

    .status-badge {
        font-size: 0.7rem;
        padding: 3px 10px;
        border-radius: 4px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        
        &.Open { 
            color: #00e676; 
            background: rgba(0, 230, 118, 0.1); 
            border: 1px solid rgba(0, 230, 118, 0.3);
        }
        &.InProgress { 
            color: var(--gang-secondary); 
            background: rgba(68, 138, 255, 0.1); 
            border: 1px solid rgba(68, 138, 255, 0.3);
            animation: pulse-border 2s infinite;
        }
    }

    .description {
        font-size: 0.9rem;
        color: var(--gang-text-muted);
        margin-bottom: 1.5rem;
        line-height: 1.5;
        height: 3rem;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
    }

    .mission-details {
        background: rgba(255,255,255,0.03);
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1.5rem;

        .detail-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
            font-size: 0.8rem;

            &:last-child { margin-bottom: 0; }

            .label { color: var(--gang-text-muted); font-weight: 500; }
            .value { color: #fff; font-weight: 600; text-transform: uppercase; }
        }
    }

    .actions-group {
        margin-top: auto;
    }

    .chief-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;

        button { flex: 1; min-width: 80px; }
    }

    .gang-btn {
        background: var(--gang-gradient-main);
        color: #fff;
        border: none;
        border-radius: 4px;
        font-weight: 700;
        padding: 10px 15px;
        cursor: pointer;
        font-family: 'Oxanium', sans-serif;
        font-size: 0.8rem;
        letter-spacing: 1px;
        transition: all 0.3s;
        text-shadow: 0 1px 2px rgba(0,0,0,0.2);

        &:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(124, 77, 255, 0.4);
        }

        &.secondary {
            background: transparent;
            border: 1px solid var(--gang-secondary);
            color: var(--gang-secondary);
            &:hover { background: rgba(68, 138, 255, 0.1); }
        }

        &.danger {
            background: transparent;
            border: 1px solid #ff1744;
            color: #ff1744;
            &:hover { background: rgba(255, 23, 68, 0.1); box-shadow: 0 5px 15px rgba(255, 23, 68, 0.2); }
        }

        &.sm { padding: 6px 12px; font-size: 0.7rem; }
        &.full-width { width: 100%; }
    }

    .loading-state, .empty-state {
        text-align: center;
        padding: 4rem;
        color: var(--gang-text-muted);
        background: var(--gang-surface);
        border-radius: 16px;
        border: 1px dashed var(--gang-border);
        text-transform: uppercase;
        letter-spacing: 2px;
    }

    .fab-add-btn {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        width: 4rem;
        height: 4rem;
        border-radius: 50%;
        background: var(--gang-gradient-accent);
        color: black;
        font-size: 2.5rem;
        border: none;
        cursor: pointer;
        box-shadow: 0 0 20px rgba(255, 215, 64, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s;
        z-index: 1000;
        font-weight: 300;
    }

    .fab-add-btn:hover { 
        transform: rotate(90deg) scale(1.1); 
        box-shadow: 0 0 30px rgba(255, 215, 64, 0.6); 
    }

    @keyframes pulse-border {
        0% { box-shadow: 0 0 0 0 rgba(124, 77, 255, 0.4); }
        70% { box-shadow: 0 0 0 10px rgba(124, 77, 255, 0); }
        100% { box-shadow: 0 0 0 0 rgba(124, 77, 255, 0); }
    }

    @media (max-width: 768px) {
        .my-missions-container {
            padding: 1rem;
        }

        .gang-title {
            font-size: 1.8rem;
            margin-bottom: 1.5rem;
        }

        .mission-grid {
            gap: 1rem;
            grid-template-columns: 1fr;
        }

        .mission-card {
            padding: 1rem;
        }

        .card-header .mission-name {
            font-size: 1.2rem;
        }

        .fab-add-btn {
            bottom: 1rem;
            right: 1rem;
            width: 3.5rem;
            height: 3.5rem;
            font-size: 2rem;
        }
    }

    @media (max-width: 480px) {
        .gang-title {
            font-size: 1.5rem;
        }
        
        .description {
            font-size: 0.8rem;
            height: auto;
            max-height: 4.5rem;
        }
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
  isLoading = signal(true);
  myId = signal<number | undefined>(undefined);

  constructor() {
    this.myId.set(this._passportService.data()?.user_id);
    this.loadMissions();
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
      // Only show active missions (Open or InProgress)
      this.missions.set(data.filter(m => m.status !== 'Completed' && m.status !== 'Failed'));
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
      // Try to extract useful error message from backend
      const msg = e?.error || e?.message || 'Action failed';
      this._snackBar.open(msg, 'Close', { duration: 3000 });
    }
  }
}
