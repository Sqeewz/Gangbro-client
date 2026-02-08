import { inject, Injectable, signal, OnDestroy, NgZone } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PassportService } from './passport-service';
import { MissionService } from './mission-service';
import { Mission } from '../_models/mission';
import { APP_CONFIG } from '../_constants/config.constants';
import { MissionStatus } from '../_enums/mission-status.enum';

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
/**
 * Service for handling real-time notifications by polling for mission updates.
 * Manages notification state and displays toast messages.
 */
export class NotificationService implements OnDestroy {
    private _passport = inject(PassportService);
    private _mission = inject(MissionService);
    private _ngZone = inject(NgZone);
    private _snackBar = inject(MatSnackBar);

    notifications = signal<Notification[]>([]);
    unreadCount = signal(0);

    private _pollingHandle: any;
    private _lastMissions: Mission[] = [];
    private _lastMyMissions: Mission[] = [];

    constructor() {
        this.startPolling();
    }

    /**
     * Starts the polling mechanism to check for updates outside of Angular's zone for performance.
     */
    private startPolling() {
        this.stopPolling();
        this._ngZone.runOutsideAngular(() => {
            this._pollingHandle = setInterval(() => {
                this.checkForUpdates();
            }, APP_CONFIG.POLL_INTERVAL_MS);
        });
    }

    /**
     * Stops the polling mechanism.
     */
    private stopPolling() {
        if (this._pollingHandle) {
            clearInterval(this._pollingHandle);
            this._pollingHandle = undefined;
        }
    }

    /**
     * Checks for mission updates and adds notifications if changes are detected.
     */
    private async checkForUpdates() {
        const passport = this._passport.data();
        if (!passport) return;

        try {
            // Get all missions to find new ones
            const allMissions = await this._mission.getByFilter({ page: 1, limit: APP_CONFIG.DEFAULT_PAGE_SIZE });

            // Get my missions to find status changes
            const myMissions = await this._mission.getMyMissions();

            this._ngZone.run(() => {
                // Check for new missions
                if (this._lastMissions.length > 0) {
                    const newMissions = allMissions.filter(m =>
                        m.status === MissionStatus.Open &&
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

                            if (m.status === MissionStatus.InProgress) {
                                title = 'MISSION STARTED';
                                type = 'warning';
                            } else if (m.status === MissionStatus.Completed) {
                                title = 'MISSION ACCOMPLISHED';
                                type = 'success';
                            } else if (m.status === MissionStatus.Failed) {
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
            // Silent fail for polling
        }
    }

    /**
     * Adds a new notification and displays a snackbar.
     * @param notif The partial notification data.
     */
    addNotification(notif: Partial<Notification>) {
        const newNotif: Notification = {
            id: Math.random().toString(36).substring(2, 9),
            title: notif.title || 'NOTIFICATION',
            message: notif.message || '',
            time: new Date(),
            read: false,
            type: notif.type || 'info',
        };

        this.notifications.update(prev => [newNotif, ...prev]);
        this.updateUnreadCount();

        // Show toast popup
        this._snackBar.open(newNotif.message, newNotif.title, {
            duration: APP_CONFIG.NOTIFICATION_DURATION,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['gang-snackbar', `snackbar-${newNotif.type}`]
        });

        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(newNotif.title, { body: newNotif.message });
        }
    }

    /**
     * Marks a specific notification as read.
     * @param id Notification ID.
     */
    markAsRead(id: string) {
        this.notifications.update(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
        this.updateUnreadCount();
    }

    /**
     * Marks all notifications as read.
     */
    markAllAsRead() {
        this.notifications.update(prev =>
            prev.map(n => ({ ...n, read: true }))
        );
        this.updateUnreadCount();
    }

    /**
     * Clears all notifications.
     */
    clearAll() {
        this.notifications.set([]);
        this.updateUnreadCount();
    }

    /**
     * Updates the unread count signal.
     */
    private updateUnreadCount() {
        this.unreadCount.set(this.notifications().filter(n => !n.read).length);
    }

    ngOnDestroy() {
        this.stopPolling();
    }
}
