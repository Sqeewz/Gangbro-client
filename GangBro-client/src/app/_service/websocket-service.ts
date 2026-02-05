import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class WebsocketService {
    private socket: WebSocket | null = null;
    private messageSubject = new Subject<any>();

    constructor() { }

    connect(path: string): Observable<any> {
        let wsUrl: string;

        // Force WSS if on HTTPS or if on render.com
        const isHttps = window.location.protocol === 'https:' || window.location.host.includes('render.com');
        const protocol = isHttps ? 'wss:' : 'ws:';

        let host = window.location.host;

        // Use environment baseUrl if it's a full URL
        if (environment.baseUrl && environment.baseUrl.startsWith('http')) {
            try {
                const url = new URL(environment.baseUrl);
                host = url.host;
            } catch (e) {
                console.error('[WS] Invalid baseUrl:', environment.baseUrl);
            }
        }

        // Clean up path - ensure it starts with / but doesn't double slash with /api
        const cleanPath = path.startsWith('/') ? path : `/${path}`;

        wsUrl = `${protocol}//${host}/api${cleanPath}`;
        console.log(`[WS] Target: ${wsUrl}`);

        try {
            this.socket = new WebSocket(wsUrl);

            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.messageSubject.next(data);
                } catch (e) {
                    this.messageSubject.next(event.data);
                }
            };

            this.socket.onclose = (event) => {
                console.log('[WS] Closed', event.code, event.reason);
            };

            this.socket.onerror = (error) => {
                console.error('[WS] Error', error);
            };
        } catch (e) {
            console.error('[WS] Creation failed', e);
        }

        return this.messageSubject.asObservable();
    }

    send(data: any) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(typeof data === 'string' ? data : JSON.stringify(data));
        }
    }

    close() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }
}
