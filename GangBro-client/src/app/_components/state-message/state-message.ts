import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-state-message',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule],
    template: `
    <div class="state-container" [ngClass]="type">
      <div class="icon-wrapper">
        <ng-container [ngSwitch]="type">
          <mat-icon *ngSwitchCase="'empty'">inventory_2</mat-icon>
          <mat-icon *ngSwitchCase="'error'">report_problem</mat-icon>
          <div *ngSwitchCase="'loading'" class="glitch-spinner"></div>
        </ng-container>
      </div>
      <h3 class="title">{{ title }}</h3>
      <p class="message">{{ message }}</p>
      <button *ngIf="actionText" class="gang-btn primary" (click)="action.emit()">
        {{ actionText }}
      </button>
    </div>
  `,
    styles: [
        `
      .state-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px;
        text-align: center;
        color: var(--gang-text);
        font-family: 'Oxanium', sans-serif;
      }

      .icon-wrapper {
        font-size: 64px;
        margin-bottom: 20px;
        color: var(--gang-primary);

        mat-icon {
          width: 64px;
          height: 64px;
          font-size: 64px;
        }
      }

      .title {
        font-size: 1.5rem;
        text-transform: uppercase;
        letter-spacing: 2px;
        margin-bottom: 10px;
        background: var(--gang-gradient-main);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .message {
        color: var(--gang-text-muted);
        max-width: 400px;
        margin-bottom: 24px;
      }

      .error .icon-wrapper {
        color: #ff4e50;
      }

      .glitch-spinner {
        width: 50px;
        height: 50px;
        border: 3px solid var(--gang-primary);
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        position: relative;

        &::after {
          content: '';
          position: absolute;
          top: -3px;
          left: -3px;
          right: -3px;
          bottom: -3px;
          border: 3px solid var(--gang-accent);
          border-bottom-color: transparent;
          border-radius: 50%;
          animation: spin 1.2s linear reverse infinite;
          opacity: 0.5;
        }
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
    ],
})
export class StateMessage {
    @Input() type: 'empty' | 'error' | 'loading' = 'empty';
    @Input() title = 'NO DATA FOUND';
    @Input() message = 'The encrypted sector appears to be empty.';
    @Input() actionText = '';
    @Output() action = new EventEmitter<void>();
}
