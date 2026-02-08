import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialog } from '../_dialog/confirm-dialog/confirm-dialog';

export interface ConfirmConfig {
    title: string;
    message: string;
    confirmText: string;
    type?: 'info' | 'danger' | 'warning' | 'success';
}

/**
 * Helper to show a confirmation dialog and execute an action if confirmed.
 */
export async function confirmAndExecute(
    dialog: MatDialog,
    config: ConfirmConfig,
    action: () => Promise<void>
): Promise<boolean> {
    const ref = dialog.open(ConfirmDialog, {
        data: config
    });

    const result = await firstValueFrom(ref.afterClosed());
    if (result) {
        await action();
        return true;
    }
    return false;
}
