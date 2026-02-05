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
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        let host = window.location.host;

        if (environment.baseUrl && environment.baseUrl.startsWith('http')) {
            try {
                const url = new URL(environment.baseUrl);
                host = url.host;
            } catch (e) {
                console.error('[WS] Invalid baseUrl in environment:', environment.baseUrl);
            }
        }

        wsUrl = `${protocol}//${host}/api${path}`;
        console.log(`[WS] Connecting to: ${wsUrl}`);

        this.socket = new WebSocket(wsUrl);

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.messageSubject.next(data);
            } catch (e) {
                // Handle non-JSON or other events
                this.messageSubject.next(event.data);
            }
        };

        this.socket.onclose = (event) => {
            console.log('[WS] Connection closed', event);
        };

        this.socket.onerror = (error) => {
            console.error('[WS] Error detected', error);
        };

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
