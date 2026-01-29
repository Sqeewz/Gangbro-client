import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BehaviorSubject } from 'rxjs';
import { MissionFilter } from '../_models/mission-filter';
import { Mission } from '../_models/mission';
import { MissionService } from '../_service/mission-service';
import { PassportService } from '../_service/passport-service';

@Component({
  selector: 'app-missions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    DatePipe
  ],
  templateUrl: './missions.html',
  styleUrl: './missions.scss',
})
export class Missions implements OnInit {
  private _missionService = inject(MissionService);
  private _passportService = inject(PassportService);

  isSignin = computed(() => this._passportService.isSignin());

  filter: MissionFilter = {
    name: '',
    status: undefined
  };

  private _missionsSubject = new BehaviorSubject<Mission[]>([]);
  missions$ = this._missionsSubject.asObservable();

  ngOnInit() {
    this.onSubmit();
  }

  async onSubmit() {
    try {
      const missions = await this._missionService.getByFilter(this.filter);
      this._missionsSubject.next(missions);
    } catch (error) {
      console.error('Error fetching missions:', error);
    }
  }
}