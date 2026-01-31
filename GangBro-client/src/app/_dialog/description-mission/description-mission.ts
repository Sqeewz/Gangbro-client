import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Mission } from '../../_models/mission';
import { DatePipe, LowerCasePipe, UpperCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-description-mission',
  imports: [MatDialogModule, MatButtonModule, DatePipe, LowerCasePipe, UpperCasePipe],
  templateUrl: './description-mission.html',
  styleUrl: './description-mission.scss',
})
export class DescriptionMission {
  mission = inject<Mission>(MAT_DIALOG_DATA);
}
