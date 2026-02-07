import { inject, Injectable, signal, OnDestroy, NgZone } from '@angular/core';
import { PassportService } from './passport-service';
import { MissionService } from './mission-service';
import { Mission } from '../_models/mission';

export interface Notification {
    id: string;
    title: string;
    message: string;
    time: Date;
    read: boolean;
    type: 'info' | 'success' | 'warning' | 'error';
}

@Injectable({
    providedIn: 'root',
})
export class NotificationService implements OnDestroy {
    private _passport = inject(PassportService);
    private _mission = inject(MissionService);
    private _ngZone = inject(NgZone);

    notifications = signal<Notification[]>([]);
    unreadCount = signal(0);

    private _pollingHandle: any;
    private _lastMissions: Mission[] = [];
    private _lastMyMissions: Mission[] = [];

    constructor() {
        this.startPolling();
    }

    private startPolling() {
        this.stopPolling();
        this._ngZone.runOutsideAngular(() => {
            this._pollingHandle = setInterval(() => {
                this.checkForUpdates();
            }, 15000); // Check every 15 seconds
        });
    }

    private stopPolling() {
        if (this._pollingHandle) {
            clearInterval(this._pollingHandle);
            this._pollingHandle = undefined;
        }
    }

    private async checkForUpdates() {
        const passport = this._passport.data();
        if (!passport) return;

        try {
            // Get all missions to find new ones
            const allMissions = await this._mission.getByFilter({ page: 1, limit: 10 });

            // Get my missions to find status changes
            const myMissions = await this._mission.getMyMissions();

            this._ngZone.run(() => {
                // Check for new missions
                if (this._lastMissions.length > 0) {
                    const newMissions = allMissions.filter(m =>
                        m.status === 'Open' &&
                        !this._lastMissions.some(lm => lm.id === m.id) &&
                        m.chief_id !== passport.user_id
                    );

                    newMissions.forEach(m => {
                        this.addNotification({
                            title: 'NEW MISSION AVAILABLE',
                            message: `Operation ${m.name} is now open for enlisting.`,
                            type: 'info'
                        });
                    });
                }

                // Check for status changes in joined missions
                if (this._lastMyMissions.length > 0) {
                    myMissions.forEach(m => {
                        const prev = this._lastMyMissions.find(pm => pm.id === m.id);
                        if (prev && prev.status !== m.status) {
                            let title = 'MISSION UPDATE';
                            let type: 'info' | 'warning' | 'success' | 'error' = 'info';

                            if (m.status === 'InProgress') {
                                title = 'MISSION STARTED';
                                type = 'warning';
                            } else if (m.status === 'Completed') {
                                title = 'MISSION ACCOMPLISHED';
                                type = 'success';
                            } else if (m.status === 'Failed') {
                                title = 'MISSION FAILED';
                                type = 'error';
                            }

                            this.addNotification({
                                title,
                                message: `Operation ${m.name} is now ${m.status.toUpperCase()}.`,
                                type
                            });
                        }
                    });
                }

                this._lastMissions = allMissions;
                this._lastMyMissions = myMissions;
            });
        } catch (e) {
            console.warn('Notification poll failed');
        }
    }

    addNotification(notif: Partial<Notification>) {
        const newNotif: Notification = {
            id: Math.random().toString(36).substr(2, 9),
            title: notif.title || 'NOTIFICATION',
            message: notif.message || '',
            time: new Date(),
            read: false,
            type: notif.type || 'info',
        };

        this.notifications.update(prev => [newNotif, ...prev]);
        this.updateUnreadCount();

        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(newNotif.title, { body: newNotif.message });
        }
    }

    markAsRead(id: string) {
        this.notifications.update(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
        this.updateUnreadCount();
    }

    markAllAsRead() {
        this.notifications.update(prev =>
            prev.map(n => ({ ...n, read: true }))
        );
        this.updateUnreadCount();
    }

    clearAll() {
        this.notifications.set([]);
        this.updateUnreadCount();
    }

    private updateUnreadCount() {
        this.unreadCount.set(this.notifications().filter(n => !n.read).length);
    }

    ngOnDestroy() {
        this.stopPolling();
    }
}
