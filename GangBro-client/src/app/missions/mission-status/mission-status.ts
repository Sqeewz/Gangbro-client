
import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MissionService } from '../../_service/mission-service';
import { toSignal } from '@angular/core/rxjs-interop';
import { from } from 'rxjs';

@Component({
  selector: 'app-mission-status',
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <h2>Mission Status Dashboard</h2>
      
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Total History</h3>
          <p class="number">{{ historyCount() }}</p>
        </div>
        <div class="stat-card">
          <h3>Completed</h3>
          <p class="number">{{ completedCount() }}</p>
        </div>
        <div class="stat-card">
          <h3>Failed</h3>
          <p class="number">{{ failedCount() }}</p>
        </div>
      </div>

      <div class="history-list">
        <h3>Mission History</h3>
        
        @if (historyMissions().length === 0) {
            <p class="no-data">No completed or failed missions yet.</p>
        } @else {
            <div class="mission-grid">
            @for (m of historyMissions(); track m.id) {
                <div class="card" [class.failed]="m.status === 'Failed'" [class.completed]="m.status === 'Completed'">
                <h3>{{ m.name }}</h3>
                <p>{{ m.description }}</p>
                <div class="status-badge">{{ m.status }}</div>
                <p class="chief">Chief: {{ m.chief_display_name }}</p>
                </div>
            }
            </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .dashboard { padding: 20px; }
    .stats-grid { display: grid; gap: 20px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-top: 20px; margin-bottom: 40px; }
    .stat-card { background: #f5f5f5; padding: 20px; border-radius: 10px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .stat-card h3 { margin: 0 0 10px 0; color: #666; }
    .number { font-size: 2.5em; font-weight: bold; margin: 0; color: #333; }

    .history-list h3 { border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }
    .mission-grid { display: grid; gap: 15px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
    .card { border: 1px solid #eee; padding: 15px; border-radius: 8px; background: #fff; position: relative; overflow: hidden; }
    
    .card.completed { border-left: 5px solid #4CAF50; }
    .card.failed { border-left: 5px solid #f44336; }

    .status-badge { 
        display: inline-block; 
        padding: 4px 8px; 
        border-radius: 4px; 
        font-size: 0.8em; 
        font-weight: bold;
        margin: 10px 0;
    }
    .completed .status-badge { background: #e8f5e9; color: #2e7d32; }
    .failed .status-badge { background: #ffebee; color: #c62828; }

    .no-data { color: #888; font-style: italic; }
  `]
})
export class MissionStatus {
  private _missionService = inject(MissionService);

  // Convert promise to signal for easier template usage
  private missions = toSignal(from(this._missionService.getMyMissions()), { initialValue: [] });

  historyMissions = computed(() => this.missions().filter(m => m.status === 'Completed' || m.status === 'Failed'));

  historyCount = computed(() => this.historyMissions().length);
  completedCount = computed(() => this.missions().filter(m => m.status === 'Completed').length);
  failedCount = computed(() => this.missions().filter(m => m.status === 'Failed').length);
}
