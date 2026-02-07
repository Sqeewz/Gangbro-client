import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-showcase-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-container" [ngClass]="variant" (mousemove)="onMouseMove($event)">
      <!-- Monitor Frame/Bezel -->
      <div class="monitor-bezel">
        <div class="card-header">
          <div class="serial">MON-{{ label.substring(0,3) }}-88</div>
          <div class="status-led"></div>
        </div>

        <div class="card-body">
          <div class="screen-glitch"></div>
          <div class="content-frame">
            <ng-content></ng-content>
          </div>
          <div class="scanlines"></div>
          <div class="screen-glow"></div>
        </div>
      </div>

      <div class="card-footer">
        <div class="footer-main">
          <span class="label">{{ label }}</span>
          <span class="title">{{ title }}</span>
        </div>
        <div class="hardware-stand"></div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      perspective: 1000px;
    }

    .card-container {
      background: transparent;
      display: flex;
      flex-direction: column;
      gap: 5px;
      transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
      position: relative;
      height: 200px; // Smaller height
      cursor: pointer;

      &:hover {
        transform: translateY(-8px) scale(1.02);
        .monitor-bezel {
          border-color: rgba(157, 80, 187, 0.4);
          box-shadow: 0 10px 40px rgba(157, 80, 187, 0.2);
        }
        .screen-glow { opacity: 0.3; }
        .status-led { background: #00ff00; box-shadow: 0 0 8px #00ff00; }
        .scanlines { animation: scan 8s linear infinite; }
      }
    }

    .monitor-bezel {
      flex: 1;
      background: #12121e;
      border: 3px solid #1a1a2a;
      border-radius: 12px;
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      position: relative;
      box-shadow: inset 0 2px 10px rgba(0,0,0,0.8), 0 5px 15px rgba(0,0,0,0.5);
      transition: all 0.3s ease;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 4px;
      
      .serial {
        font-family: 'Courier New', Courier, monospace;
        font-size: 0.5rem;
        color: rgba(255,255,255,0.3);
        letter-spacing: 1px;
      }
      
      .status-led {
        width: 4px; height: 4px;
        background: #333;
        border-radius: 50%;
        transition: all 0.3s;
      }
    }

    .card-body {
      flex: 1;
      background: #050508;
      border-radius: 4px;
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.05);
      box-shadow: inset 0 0 20px rgba(0,0,0,1);
    }

    .content-frame {
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      z-index: 2;
      position: relative;
      filter: drop-shadow(0 0 5px rgba(157, 80, 187, 0.5));
    }

    .scanlines {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to bottom,
        transparent 50%,
        rgba(0, 0, 0, 0.3) 50%
      );
      background-size: 100% 4px;
      z-index: 3;
      pointer-events: none;
      opacity: 0.4;
    }

    .screen-glow {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at center, rgba(157, 80, 187, 0.15) 0%, transparent 70%);
      z-index: 1;
      opacity: 0.1;
      transition: opacity 0.3s ease;
    }

    .card-footer {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-top: 5px;

      .footer-main {
        display: flex; flex-direction: column; align-items: center;
        .label {
          font-size: 0.5rem; font-weight: 700; color: rgba(255,255,255,0.3);
          letter-spacing: 2px; text-transform: uppercase;
        }
        .title {
          font-size: 0.85rem; font-weight: 800; color: white;
          letter-spacing: 0.5px; margin-top: -2px;
          text-shadow: 0 0 10px rgba(255,255,255,0.2);
        }
      }
    }

    .hardware-stand {
      width: 30px; height: 3px;
      background: #1a1a2a;
      border-radius: 0 0 4px 4px;
      margin-top: 4px;
    }

    @keyframes scan {
      from { background-position: 0 0; }
      to { background-position: 0 100%; }
    }
  `]
})
export class ShowcaseCardComponent {
  @Input() label: string = 'VIDEO';
  @Input() title: string = 'Mission';
  @Input() variant: 'default' | 'audio' = 'default';

  onMouseMove(e: MouseEvent) {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty('--mouse-x', `${x}%`);
    el.style.setProperty('--mouse-y', `${y}%`);
  }
}
