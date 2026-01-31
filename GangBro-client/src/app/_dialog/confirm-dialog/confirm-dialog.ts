import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info' | 'warning';
}

@Component({
    selector: 'app-confirm-dialog',
    standalone: true,
    imports: [MatDialogModule, MatButtonModule],
    templateUrl: './confirm-dialog.html',
    styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialog {
    readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
    private _dialogRef = inject(MatDialogRef<ConfirmDialog>);

    onConfirm(): void {
        this._dialogRef.close(true);
    }

    onCancel(): void {
        this._dialogRef.close(false);
    }
}
