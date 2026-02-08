import { HttpClient } from '@angular/common/http'
import { inject, Injectable, signal } from '@angular/core'
import { environment } from '../../environments/environment'
import { LoginModel, Passport, RegisterModel } from '../_models/passport'
import { firstValueFrom } from 'rxjs'
import { getAvatar } from '../_helpers/util'

@Injectable({
  providedIn: 'root',
})
/**
 * Service for managing user authentication state, passport data, and session.
 * Handles login, registration, and persistent storage of user credentials.
 */
export class PassportService {
  private _key = 'passport'
  private _base_url = environment.baseUrl ? `${environment.baseUrl}/api` : '/api'
  private _http = inject(HttpClient)

  /** Current user passport data signal. */
  data = signal<undefined | Passport>(undefined)
  /** Current user avatar URL signal. */
  avatar = signal<string>(getAvatar())
  /** User sign-in status signal. */
  isSignin = signal<boolean>(false)

  constructor() {
    this.loadPassportFormLocalStorage()
  }

  /**
   * Saves a new avatar URL and persists it to local storage.
   * @param url The new avatar image URL.
   */
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

  /**
   * Loads passport data from local storage on initialization.
   */
  private loadPassportFormLocalStorage(): string | null {
    const jsonString = localStorage.getItem(this._key)
    if (!jsonString) return 'not found'
    try {
      const passport = JSON.parse(jsonString) as Passport

      // Sanitization: Ensure avatar_url is HTTPS before using
      if (passport.avatar_url && passport.avatar_url.startsWith('http://')) {
        passport.avatar_url = passport.avatar_url.replace('http://', 'https://');
      }

      this.data.set(passport)
      const avatar = getAvatar(passport)
      this.avatar.set(avatar)
      this.isSignin.set(true)
    } catch (error) {
      return `${error}`
    }
    return null
  }

  /**
   * Persists the current passport data to local storage.
   */
  private savePassportToLocalStorage() {
    const passport = this.data()
    if (!passport) return
    const jsonString = JSON.stringify(passport)
    localStorage.setItem(this._key, jsonString)
    this.isSignin.set(true)
  }

  /**
   * Destroys the current session and clears local storage.
   */
  destroy() {
    this.data.set(undefined)
    this.avatar.set(getAvatar())
    localStorage.removeItem(this._key)
    this.isSignin.set(false)
  }

  /**
   * Authenticates a user.
   * @param login The login credentials.
   * @returns A promise of an error message if failed, otherwise null.
   */
  async login(login: LoginModel): Promise<null | string> {
    const api_url = this._base_url + '/authentication/login'
    return await this.fetchPassport(api_url, login)
  }

  /**
   * Registers a new brawler.
   * @param register The registration data.
   * @returns A promise of an error message if failed, otherwise null.
   */
  async register(register: RegisterModel): Promise<null | string> {
    const api_url = this._base_url + '/brawler/register'
    return await this.fetchPassport(api_url, register)
  }

  /**
   * Internal helper to fetch passport from API and handle storage/sanitization.
   */
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

      if (error && error.error) {
        const body = error.error;
        if (typeof body === 'string') return body;
        if (body.error && typeof body.error === 'string') return body.error;
        if (body.message && typeof body.message === 'string') return body.message;
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