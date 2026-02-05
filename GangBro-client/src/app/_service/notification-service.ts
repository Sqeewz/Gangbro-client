import { inject, Injectable, signal, OnDestroy } from '@angular/core';
import { PassportService } from './passport-service';

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

    notifications = signal<Notification[]>([]);
    unreadCount = signal(0);

    constructor() {
        // HTTP Polling for notifications could be implemented here if a backend endpoint existed.
        // For now, only local/manual notifications are supported since WebSockets were removed.
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
        // Cleanup logic if any
    }
}
