import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
    selector: 'app-setting',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule, MatSnackBarModule],
    template: `
    <div class="setting-container">
        <h1 class="gang-title">SYSTEM SETTINGS</h1>
        
        <div class="setting-section gang-card">
            <div class="section-header">
                <mat-icon>storage</mat-icon>
                <h2>STORAGE & CACHE</h2>
            </div>
            <p class="section-desc">Clear local data and session cache if the system is behaving unexpectedly.</p>
            <button class="gang-btn error-btn" (click)="clearCache()">
                <mat-icon>delete_sweep</mat-icon>
                PURGE SYSTEM CACHE
            </button>
        </div>

        <div class="setting-section gang-card">
            <div class="section-header">
                <mat-icon>security</mat-icon>
                <h2>TERMINAL SECURITY</h2>
            </div>
            <p class="section-desc">Encryption protocols are currently: <span class="active-status">ACTIVE</span></p>
            <button class="gang-btn secondary" disabled>REGENERATE KEYS</button>
        </div>
    </div>
  `,
    styles: [`
    .setting-container {
        padding: 40px;
        max-width: 800px;
        margin: 0 auto;
    }

    .setting-section {
        margin-bottom: 30px;
        background: rgba(20, 20, 25, 0.6);
        backdrop-filter: blur(10px);
    }

    .section-header {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 15px;
        color: var(--gang-accent);
        
        h2 { margin: 0; font-family: 'Oxanium', sans-serif; font-weight: 800; letter-spacing: 2px; font-size: 1.2rem; }
        mat-icon { font-size: 28px; width: 28px; height: 28px; }
    }

    .section-desc {
        color: var(--gang-text-muted);
        font-size: 0.9rem;
        margin-bottom: 25px;
        line-height: 1.6;
    }

    .active-status {
        color: #00e676;
        font-weight: 800;
        text-shadow: 0 0 10px rgba(0, 230, 118, 0.3);
    }

    .error-btn {
        background: linear-gradient(135deg, #ff1744 0%, #d50000 100%) !important;
        &:hover {
            box-shadow: 0 0 15px rgba(255, 23, 68, 0.4);
        }
    }
  `]
})
export class Setting {
    private _snackBar = inject(MatSnackBar);

    clearCache() {
        localStorage.clear();
        sessionStorage.clear();

        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        }

        this._snackBar.open('CACHE PURGED: SYSTEM REBOOTING...', 'OK', {
            duration: 2000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
        });

        setTimeout(() => {
            window.location.reload();
        }, 1500);
    }
}
