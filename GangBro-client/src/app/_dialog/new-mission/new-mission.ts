import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { AddMission } from '../../_models/add-mission'
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle, MatDialogClose } from '@angular/material/dialog'
import { MatButtonModule } from '@angular/material/button'
import { FormsModule } from '@angular/forms'
import { Mission } from '../../_models/mission';

@Component({
  selector: 'app-new-mission',
  imports: [CommonModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, MatButtonModule, FormsModule],
  templateUrl: './new-mission.html',
  styleUrl: './new-mission.scss',
})
export class NewMission {
  categories = ['General', 'Gaming', 'Work', 'Fitness', 'Social', 'Learning', 'Creative', 'Finance']
  addMission: AddMission = {
    name: '',
    description: '',
    category: 'General'
  }
  private readonly _dialogRef = inject(MatDialogRef<NewMission>)
  private readonly _data = inject<Mission>(MAT_DIALOG_DATA, { optional: true })

  constructor() {
    if (this._data) {
      this.addMission = {
        name: this._data.name,
        description: this._data.description,
        category: this._data.category || 'General'
      }
    }
  }

  onSubmit() {
    const mission = this.clean(this.addMission)
    this._dialogRef.close(mission)
  }

  private clean(addMission: AddMission): AddMission {
    return {
      name: addMission.name.trim() || 'untitled',
      description: addMission.description?.trim() || undefined,
      category: addMission.category || 'General'
    }
  }
}
