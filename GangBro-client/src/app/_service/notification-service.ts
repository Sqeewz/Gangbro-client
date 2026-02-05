import { inject, Injectable, signal, OnDestroy } from '@angular/core';
import { PassportService } from './passport-service';
// import { WebsocketService } from './websocket-service'; // DEACTIVATED

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
    // private _ws = inject(WebsocketService); // DEACTIVATED

    notifications = signal<Notification[]>([]);
    unreadCount = signal(0);

    constructor() {
        // WebSocket disabled to prevent Mixed Content errors.
        // this.initRealtime(); 
    }

    // private initRealtime() {
    //     this._ws.connect('/notifications/ws').subscribe(msg => {
    //         this.handleIncomingEvent(msg);
    //     });
    // }

    // ... handleIncomingEvent and other methods remain but aren't called via WS

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
        // this._ws.close();
    }
}
