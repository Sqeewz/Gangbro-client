import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component, inject, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { BehaviorSubject } from 'rxjs';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Mission } from '../../_models/mission';
import { MissionService } from '../../_service/mission-service';
import { NewMission } from '../../_dialog/new-mission/new-mission';
import { AddMission } from '../../_models/add-mission';

@Component({
  selector: 'app-mission-manager',
  styleUrl: './mission-manager.scss',
  templateUrl: './mission-manager.html',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
})
export class MissionManager implements AfterViewInit {
  private _missionService = inject(MissionService);
  private _dialog = inject(MatDialog);
  private _missionsSubject = new BehaviorSubject<Mission[]>([]);

  displayedColumns: string[] = ['name', 'description', 'crew_count', 'status', 'created_at', 'updated_at'];
  dataSource = new MatTableDataSource<Mission>([]);

  isLoadingResults = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    this.loadMyMission();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private async loadMyMission() {
    this.isLoadingResults = true;
    try {
      const missions = await this._missionService.getMyMissions();
      this._missionsSubject.next(missions);
      this.dataSource.data = missions;
    } catch (error) {
      console.error('Failed to load missions', error);
    } finally {
      this.isLoadingResults = false;
    }
  }

  openDialog() {
    const ref = this._dialog.open(NewMission);
    ref.afterClosed().subscribe(async (addMission: AddMission) => {
      if (!addMission) return;

      this.isLoadingResults = true;
      try {
        await this._missionService.add(addMission);
        await this.loadMyMission();
      } catch (error) {
        console.error('Failed to add mission', error);
        this.isLoadingResults = false;
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
