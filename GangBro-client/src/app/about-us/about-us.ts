import { Component, OnDestroy, OnInit, signal, ElementRef, inject, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SystemService } from '../_service/system-service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-about-us',
    standalone: true,
    imports: [RouterLink, CommonModule, MatIconModule],
    templateUrl: './about-us.html',
    styleUrl: './about-us.scss'
})
export class AboutUs implements OnInit, OnDestroy, AfterViewInit {
    private _system = inject(SystemService);

    // Site Statistics (from Home)
    activeMembers = signal(0);
    missionsCompleted = signal(0);
    opsSuccessRate = signal(0);
    serverUptime = signal('99.9%');
    isLoading = signal(false);

    private observer: IntersectionObserver | null = null;
    private el = inject(ElementRef);

    ngOnInit(): void {
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
            threshold: 0.05
        });

        const revealElements = this.el.nativeElement.querySelectorAll('.reveal');
        revealElements.forEach((el: HTMLElement) => this.observer?.observe(el));
    }
}
