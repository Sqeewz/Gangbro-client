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
/**
 * Service for managing mission-related operations.
 * Handles fetching, creating, joining, and updating mission statuses.
 */
export class MissionService {
  private _base_url = environment.baseUrl + '/api'
  private _http = inject(HttpClient)

  filter: MissionFilter = {}

  /**
   * Fetches missions based on filter criteria.
   * @param filter The filter parameters.
   * @returns A promise of an array of missions.
   */
  async getByFilter(filter: MissionFilter): Promise<Mission[]> {
    const queryString = this.createQueryString(filter)
    const url = this._base_url + '/view/gets?' + queryString
    return await firstValueFrom(this._http.get<Mission[]>(url))
  }

  /**
   * Fetches a single mission by its ID.
   * @param id The mission ID.
   * @param silent If true, skips the global loading interceptor.
   * @returns A promise of the mission.
   */
  async getById(id: number, silent = false): Promise<Mission> {
    const url = this._base_url + `/view/${id}`
    const headers = silent ? { 'X-Skip-Loading': 'true' } : undefined
    return await firstValueFrom(this._http.get<Mission>(url, { headers }))
  }

  /**
   * Fetches the roster of brawlers for a specific mission.
   * @param id The mission ID.
   * @param silent If true, skips the global loading interceptor.
   * @returns A promise of an array of brawlers.
   */
  async getRoster(id: number, silent = false): Promise<Brawler[]> {
    const url = this._base_url + `/view/roster/${id}`
    const headers = silent ? { 'X-Skip-Loading': 'true' } : undefined
    return await firstValueFrom(this._http.get<Brawler[]>(url, { headers }))
  }

  /**
   * Fetches chat messages for a mission.
   * @param missionId The mission ID.
   * @param silent If true, skips the global loading interceptor.
   * @returns A promise of an array of chat messages.
   */
  async getChatMessages(missionId: number, silent = false): Promise<any[]> {
    const url = this._base_url + `/mission-chats/${missionId}`
    const headers = silent ? { 'X-Skip-Loading': 'true' } : undefined
    return await firstValueFrom(this._http.get<any[]>(url, { headers }))
  }

  /**
   * Sends a chat message to a mission.
   * @param missionId The mission ID.
   * @param message The message text.
   * @param silent If true, skips the global loading interceptor.
   */
  async sendChatMessage(missionId: number, message: string, silent = false): Promise<void> {
    const url = this._base_url + `/mission-chats/${missionId}`
    const headers = silent ? { 'X-Skip-Loading': 'true' } : undefined
    await firstValueFrom(this._http.post(url, { message }, { headers }))
  }

  /**
   * Creates a query string from a MissionFilter object.
   */
  private createQueryString(filter: MissionFilter): string {
    this.filter = filter
    const params: string[] = []

    if (filter.name?.trim()) {
      params.push(`name=${encodeURIComponent(filter.name.trim())}`)
    }
    if (filter.status) {
      params.push(`status=${encodeURIComponent(filter.status)}`)
    }
    if (filter.category?.trim()) {
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

  /**
   * Creates a new mission.
   * @param mission The mission data.
   * @returns A promise of the new mission ID.
   */
  async add(mission: AddMission): Promise<number> {
    const url = this._base_url + '/mission-management'
    const resp = await firstValueFrom(this._http.post<{ mission_id: number }>(url, mission))
    return resp.mission_id
  }

  /**
   * Fetches missions associated with the current brawler.
   * @returns A promise of an array of missions.
   */
  async getMyMissions(): Promise<Mission[]> {
    const url = this._base_url + '/brawler/my-missions'
    return await firstValueFrom(this._http.get<Mission[]>(url))
  }

  /**
   * Joins a mission.
   * @param missionId The mission ID.
   */
  async join(missionId: number): Promise<void> {
    const url = this._base_url + `/crew/join/${missionId}`
    await firstValueFrom(this._http.post(url, {}))
  }

  /**
   * Leaves a mission.
   * @param missionId The mission ID.
   */
  async leave(missionId: number): Promise<void> {
    const url = this._base_url + `/crew/leave/${missionId}`
    await firstValueFrom(this._http.delete(url))
  }

  /**
   * Updates mission data.
   * @param missionId The mission ID.
   * @param data The updated data.
   */
  async update(missionId: number, data: any): Promise<void> {
    const url = this._base_url + `/mission-management/${missionId}`
    await firstValueFrom(this._http.patch(url, data))
  }

  /**
   * Starts a mission (sets status to InProgress).
   * @param missionId The mission ID.
   */
  async start(missionId: number): Promise<void> {
    const url = this._base_url + `/mission/in-progress/${missionId}`
    await firstValueFrom(this._http.patch(url, {}))
  }

  /**
   * Completes a mission.
   * @param missionId The mission ID.
   */
  async complete(missionId: number): Promise<void> {
    const url = this._base_url + `/mission/to-completed/${missionId}`
    await firstValueFrom(this._http.patch(url, {}))
  }

  /**
   * Fails a mission.
   * @param missionId The mission ID.
   */
  async fail(missionId: number): Promise<void> {
    const url = this._base_url + `/mission/to-failed/${missionId}`
    await firstValueFrom(this._http.patch(url, {}))
  }

  /**
   * Deletes a mission.
   * @param missionId The mission ID.
   */
  async delete(missionId: number): Promise<void> {
    const url = this._base_url + `/mission-management/${missionId}`
    await firstValueFrom(this._http.delete(url))
  }
}