import { HttpClient } from '@angular/common/http'
import { inject, Injectable, signal } from '@angular/core'
import { environment } from '../../environments/environment'
import { LoginModel, Passport, RegisterModel } from '../_models/passport'
import { firstValueFrom } from 'rxjs'
import { getAvatar } from '../_helpers/util'

@Injectable({
  providedIn: 'root',
})
export class PassportService {
  private _key = 'passport'
  private _base_url = environment.baseUrl ? `${environment.baseUrl}/api` : '/api'
  private _http = inject(HttpClient)

  data = signal<undefined | Passport>(undefined)
  avatar = signal<string>(getAvatar())
  isSignin = signal<boolean>(false)

  saveAvatarImgUrl(url: string) {
    let passport = this.data()
    if (passport) {
      // Force HTTPS for Cloudinary/external images
      const secureUrl = url.startsWith('http://') ? url.replace('http://', 'https://') : url;
      passport.avatar_url = secureUrl
      this.avatar.set(secureUrl)
      this.data.set(passport)
      this.savePassportToLocalStorage()
    }
  }

  private loadPassportFormLocalStorage(): string | null {
    const jsonString = localStorage.getItem(this._key)
    if (!jsonString) return 'not found'
    try {
      const passport = JSON.parse(jsonString) as Passport
      this.data.set(passport)
      const avatar = getAvatar(passport)
      this.avatar.set(avatar)
      this.isSignin.set(true)
    } catch (error) {
      return `${error}`
    }
    return null
  }

  private savePassportToLocalStorage() {
    const passport = this.data()
    if (!passport) return
    const jsonString = JSON.stringify(passport)
    localStorage.setItem(this._key, jsonString)
    this.isSignin.set(true)
  }

  constructor() {
    this.loadPassportFormLocalStorage()
  }

  destroy() {
    this.data.set(undefined)
    this.avatar.set(getAvatar())
    localStorage.removeItem(this._key)
    this.isSignin.set(false)
  }

  async login(login: LoginModel): Promise<null | string> {
    const api_url = this._base_url + '/authentication/login'
    return await this.fetchPassport(api_url, login)
  }

  async register(register: RegisterModel): Promise<null | string> {
    const api_url = this._base_url + '/brawler/register'
    return await this.fetchPassport(api_url, register)
  }

  private async fetchPassport(api_url: string, model: LoginModel | RegisterModel): Promise<string | null> {
    try {
      const result = this._http.post<Passport>(api_url, model)
      const passport = await firstValueFrom(result)

      // Sanitization: Ensure avatar_url is HTTPS before saving
      if (passport.avatar_url && passport.avatar_url.startsWith('http://')) {
        passport.avatar_url = passport.avatar_url.replace('http://', 'https://');
      }

      this.data.set(passport)
      this.avatar.set(getAvatar(passport))
      this.savePassportToLocalStorage()
      return null
    } catch (error: any) {
      console.error('[Passport] Operation failed:', error);

      // Handle Angular's HttpErrorResponse
      if (error && error.error) {
        const body = error.error;

        // If body is already a string (common for non-JSON errors)
        if (typeof body === 'string') return body;

        // If body is { "error": "message" }
        if (body.error && typeof body.error === 'string') return body.error;

        // If body is { "message": "message" }
        if (body.message && typeof body.message === 'string') return body.message;

        // Fallback for objects - stringify to avoid [object Object]
        try {
          return JSON.stringify(body);
        } catch (e) {
          return 'An unexpected error occurred';
        }
      }

      return error.statusText || error.message || 'Unknown network error';
    }
  }
}