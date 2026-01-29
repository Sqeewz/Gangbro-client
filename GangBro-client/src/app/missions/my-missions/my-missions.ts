import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MissionService } from '../../_service/mission-service';
import { PassportService } from '../../_service/passport-service';
import { Mission } from '../../_models/mission';
import { MatDialog } from '@angular/material/dialog';
import { NewMission } from '../../_dialog/new-mission/new-mission';
import { AddMission } from '../../_models/add-mission';

@Component({
  selector: 'app-my-missions',
  imports: [CommonModule],
  template: `
    <div class="container">
      <h2>My Active Missions</h2>
      
      @if (isLoading()) {
        <p>Loading...</p>
      } @else if (missions().length === 0) {
        <p>You have no active missions.</p>
      } @else {
        <div class="mission-grid">
          @for (m of missions(); track m.id) {
            <div class="card" [class.chief-card]="isChief(m)">
              <h3>{{ m.name }}</h3>
              <p>{{ m.description }}</p>
              <p><strong>Status:</strong> <span [class.active-status]="m.status === 'In Progress'">{{ m.status }}</span></p>
              <p><strong>Chief:</strong> {{ m.chief_display_name }} @if(isChief(m)) { (You) }</p>
              
              <div class="actions">
                @if (isChief(m)) {
                   <!-- Chief Actions -->
                   @if (m.status === 'Open') {
                      <button class="btn-primary" (click)="onStart(m.id)">Start Mission</button>
                      <button class="btn-edit" (click)="onEdit(m)">Edit</button>
                      <button class="btn-delete" (click)="onDelete(m.id)">Delete</button>
                   }
                   @if (m.status === 'InProgress') {
                      <button class="btn-success" (click)="onComplete(m.id)">Complete Mission</button>
                      <button class="btn-fail" (click)="onFail(m.id)">Fail Mission</button>
                   }
                } @else {
                   <!-- Member Actions -->
                   <button class="btn-leave" (click)="onLeave(m.id)">Leave Mission</button>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .container { padding: 20px; }
    .mission-grid { display: grid; gap: 20px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
    .card { border: 1px solid #ccc; padding: 15px; border-radius: 8px; background: #fff; display: flex; flex-direction: column; }
    .chief-card { border-left: 5px solid #4CAF50; }
    .actions { margin-top: auto; padding-top: 10px; display: flex; gap: 10px; }
    
    button { padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; color: white; font-weight: bold; }
    .btn-leave { background: #ff4444; }
    .btn-leave:hover { background: #cc0000; }
    
    .btn-primary { background: #2196F3; }
    .btn-primary:hover { background: #0b7dda; }

    .btn-edit { background: #FF9800; margin-left: 10px; }
    .btn-edit:hover { background: #F57C00; }

    .btn-delete { background: #607d8b; margin-left: 10px; }
    .btn-delete:hover { background: #455a64; }
    
    .btn-success { background: #4CAF50; }
    .btn-success:hover { background: #45a049; }

    .btn-fail { background: #f44336; margin-left: 10px; }
    .btn-fail:hover { background: #d32f2f; }

    .active-status { color: #2196F3; font-weight: bold; }
  `]
})
export class MyMissions {
  private _missionService = inject(MissionService);
  private _passportService = inject(PassportService);
  private _dialog = inject(MatDialog);

  missions = signal<Mission[]>([]);
  isLoading = signal(true);
  myId = signal<number | undefined>(undefined);

  constructor() {
    this.myId.set(this._passportService.data()?.user_id);
    this.loadMissions();
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

  async onLeave(id: number) {
    if (!confirm('Are you sure you want to leave this mission?')) return;
    this.performAction(() => this._missionService.leave(id));
  }

  async onStart(id: number) {
    if (!confirm('Start this mission?')) return;
    this.performAction(() => this._missionService.start(id));
  }

  async onComplete(id: number) {
    if (!confirm('Complete this mission?')) return;
    this.performAction(() => this._missionService.complete(id));
  }

  async onFail(id: number) {
    if (!confirm('Mark mission as failed?')) return;
    this.performAction(() => this._missionService.fail(id));
  }

  async onDelete(id: number) {
    if (!confirm('Delete this mission? This action cannot be undone.')) return;
    this.performAction(() => this._missionService.delete(id));
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
      alert(msg);
    }
  }
}
