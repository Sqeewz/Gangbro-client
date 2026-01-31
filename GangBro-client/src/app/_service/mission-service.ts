import { inject, Injectable } from '@angular/core'
import { environment } from '../../environments/environment'
import { HttpClient } from '@angular/common/http'
import { MissionFilter } from '../_models/mission-filter'
import { firstValueFrom } from 'rxjs'
import { Mission } from '../_models/mission'
import { AddMission } from '../_models/add-mission'
import { Brawler } from '../_models/brawler'

@Injectable({
  providedIn: 'root',
})
export class MissionService {
  ///view
  private _base_url = environment.baseUrl + '/api'
  private _http = inject(HttpClient)

  filter: MissionFilter = {}

  async getByFilter(filter: MissionFilter): Promise<Mission[]> {
    const queryString = this.createQueryString(filter)
    const url = this._base_url + '/view/gets?' + queryString
    const missions = await firstValueFrom(this._http.get<Mission[]>(url))
    return missions
  }

  async getById(id: number): Promise<Mission> {
    const url = this._base_url + `/view/${id}`
    return await firstValueFrom(this._http.get<Mission>(url))
  }

  async getRoster(id: number): Promise<Brawler[]> {
    const url = this._base_url + `/view/roster/${id}`
    return await firstValueFrom(this._http.get<Brawler[]>(url))
  }

  async getChatMessages(missionId: number): Promise<any[]> {
    const url = this._base_url + `/mission-chats/${missionId}`
    return await firstValueFrom(this._http.get<any[]>(url))
  }

  async sendChatMessage(missionId: number, message: string): Promise<void> {
    const url = this._base_url + `/mission-chats/${missionId}`
    await firstValueFrom(this._http.post(url, { message }))
  }

  private createQueryString(filter: MissionFilter): string {
    this.filter = filter
    const params: string[] = []

    if (filter.name && filter.name.trim()) {
      params.push(`name=${encodeURIComponent(filter.name.trim())}`)
    }
    if (filter.status) {
      params.push(`status=${encodeURIComponent(filter.status)}`)
    }
    if (filter.category && filter.category.trim()) {
      params.push(`category=${encodeURIComponent(filter.category.trim())}`)
    }
    if (filter.exclude_chief_id) {
      params.push(`exclude_chief_id=${filter.exclude_chief_id}`)
    }
    if (filter.page) {
      params.push(`page=${filter.page}`)
    }
    if (filter.limit) {
      params.push(`limit=${filter.limit}`)
    }

    return params.join("&")
  }

  async add(mission: AddMission): Promise<number> {
    const url = this._base_url + '/mission-management'
    const observable = this._http.post<{ mission_id: number }>(url, mission)
    const resp = await firstValueFrom(observable)
    return resp.mission_id
  }

  async getMyMissions(): Promise<Mission[]> {
    const url = this._base_url + '/brawler/my-missions'
    console.log('get ' + url)
    const observable = this._http.get<Mission[]>(url)
    const missions = await firstValueFrom(observable)
    return missions
  }


  async join(missionId: number): Promise<void> {
    const url = this._base_url + `/crew/join/${missionId}`
    await firstValueFrom(this._http.post(url, {}))
  }

  async leave(missionId: number): Promise<void> {
    const url = this._base_url + `/crew/leave/${missionId}`
    await firstValueFrom(this._http.delete(url))
  }

  async update(missionId: number, data: any): Promise<void> {
    const url = this._base_url + `/mission-management/${missionId}`
    await firstValueFrom(this._http.patch(url, data))
  }

  async start(missionId: number): Promise<void> {
    const url = this._base_url + `/mission/in-progress/${missionId}`
    await firstValueFrom(this._http.patch(url, {}))
  }

  async complete(missionId: number): Promise<void> {
    const url = this._base_url + `/mission/to-completed/${missionId}`
    await firstValueFrom(this._http.patch(url, {}))
  }

  async fail(missionId: number): Promise<void> {
    const url = this._base_url + `/mission/to-failed/${missionId}`
    await firstValueFrom(this._http.patch(url, {}))
  }

  async delete(missionId: number): Promise<void> {
    const url = this._base_url + `/mission-management/${missionId}`
    await firstValueFrom(this._http.delete(url))
  }

}