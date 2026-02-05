import { Injectable } from '@angular/core';
import { Observable, EMPTY } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class WebsocketService {
    // Websocket service is currently deactivated to prevent Mixed Content security errors
    // during the transition to a purely HTTP-based communication system.

    constructor() { }

    connect(path: string): Observable<any> {
        console.warn('[WS] CONNECTION BLOCKED: Websockets are disabled to prevent Mixed Content errors.');
        return EMPTY; // Return an empty observable that does nothing
    }

    send(data: any) {
        // Do nothing
    }

    close() {
        // Do nothing
    }
}
