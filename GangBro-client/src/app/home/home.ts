import { Component, OnDestroy, OnInit, signal, ElementRef, inject, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SystemService } from '../_service/system-service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit, OnDestroy, AfterViewInit {
  private _system = inject(SystemService);

  hours = signal('00');
  minutes = signal('00');
  seconds = signal('00');
  ampm = signal('AM');

  // Site Statistics
  activeMembers = signal(0);
  missionsCompleted = signal(0);
  opsSuccessRate = signal(0);
  serverUptime = signal('99.9%');
  isLoading = signal(false);

  private intervalId: any;
  private observer: IntersectionObserver | null = null;
  private el = inject(ElementRef);

  ngOnInit(): void {
    this.updateTime();
    this.intervalId = setInterval(() => {
      this.updateTime();
    }, 1000);
    this.loadStats();
  }

  async loadStats() {
    try {
      this.isLoading.set(true);
      const stats = await this._system.getStats();
      this.activeMembers.set(stats.active_members);
      this.missionsCompleted.set(stats.missions_completed);
      this.opsSuccessRate.set(Number(stats.success_rate.toFixed(1)));
    } catch (e) {
      console.error('Failed to load system stats', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  ngAfterViewInit(): void {
    this.setupRevealObserver();
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupRevealObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-active');
        }
      });
    }, {
      threshold: 0.15
    });

    const revealElements = this.el.nativeElement.querySelectorAll('.reveal');
    revealElements.forEach((el: HTMLElement) => this.observer?.observe(el));
  }

  private updateTime(): void {
    const date = new Date();
    let h = date.getHours();
    const m = date.getMinutes();
    const s = date.getSeconds();
    let am = "AM";

    if (h >= 12) {
      am = "PM";
      if (h > 12) h = h - 12;
    }
    if (h === 0) h = 12;

    this.hours.set(h < 10 ? "0" + h : "" + h);
    this.minutes.set(m < 10 ? "0" + m : "" + m);
    this.seconds.set(s < 10 ? "0" + s : "" + s);
    this.ampm.set(am);
  }
}