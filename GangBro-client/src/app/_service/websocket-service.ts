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
        const wsUrl = environment.baseUrl.replace('http', 'ws') + '/api' + path;
        this.socket = new WebSocket(wsUrl);

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.messageSubject.next(data);
        };

        this.socket.onclose = (event) => {
            console.log('WS Connection closed', event);
            // Logic for reconnect can go here
        };

        this.socket.onerror = (error) => {
            console.error('WS Error', error);
        };

        return this.messageSubject.asObservable();
    }

    send(data: any) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        }
    }

    close() {
        if (this.socket) {
            this.socket.close();
        }
    }
}
