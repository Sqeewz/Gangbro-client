import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface SystemStats {
    active_members: number;
    missions_completed: number;
    missions_failed: number;
    success_rate: number;
}

@Injectable({
    providedIn: 'root'
})
export class SystemService {
    private _base_url = environment.baseUrl + '/api/system';
    private _http = inject(HttpClient);

    async getStats(): Promise<SystemStats> {
        return await firstValueFrom(this._http.get<SystemStats>(`${this._base_url}/stats`));
    }
}
