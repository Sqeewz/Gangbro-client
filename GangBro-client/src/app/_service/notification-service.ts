import { inject, Injectable, signal, OnDestroy } from '@angular/core';
import { PassportService } from './passport-service';
import { WebsocketService } from './websocket-service';

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
    private _ws = inject(WebsocketService);

    notifications = signal<Notification[]>([]);
    unreadCount = signal(0);

    constructor() {
        this.initRealtime();
    }

    private initRealtime() {
        // Connect to global notifications
        this._ws.connect('/notifications/ws').subscribe(msg => {
            this.handleIncomingEvent(msg);
        });
    }

    private handleIncomingEvent(event: any) {
        if (!this._passport.data()) return;

        // Filter events meant for the user or general updates
        // For now, we broadcast all mission updates, and the client filters.
        // In a real app, the server would filter based on user_id.

        switch (event.type) {
            case 'mission_updated':
                this.addNotification({
                    title: 'MISSION UPDATE',
                    message: `Mission "${event.name}" status changed to ${event.status}`,
                    type: event.status === 'Completed' ? 'success' : (event.status === 'Failed' ? 'error' : 'info')
                });
                break;
            case 'crew_movement':
                this.addNotification({
                    title: 'CREW UPDATE',
                    message: event.message,
                    type: 'info'
                });
                break;
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

        // Use browser notification if permitted
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
        this._ws.close();
    }
}
