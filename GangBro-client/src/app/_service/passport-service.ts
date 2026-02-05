import { HttpClient } from '@angular/common/http'
import { inject, Injectable, signal } from '@angular/core'
import { environment } from '../../environments/environment' ///
import { LoginModel, Passport, RegisterModel } from '../_models/passport'
import { firstValueFrom } from 'rxjs'
import { H } from '@angular/cdk/keycodes'
import { getAvatar } from '../_helpers/util'


@Injectable({
  providedIn: 'root',
})
export class PassportService {
  private _key = 'passport'
  private _base_url = environment.baseUrl + '/api'
  private _http = inject(HttpClient)

  data = signal<undefined | Passport>(undefined)
  avatar = signal<string>(getAvatar())
  isSignin = signal<boolean>(false)

  saveAvatarImgUrl(url: string) {
    let passport = this.data()
    if (passport) {
      passport.avatar_url = url
      this.avatar.set(url)
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
      this.data.set(passport)
      this.avatar.set(getAvatar(passport))
      this.savePassportToLocalStorage()
      return null
    } catch (error: any) {
      if (error.error && typeof error.error === 'object' && error.error.error) {
        return error.error.error;
      }
      if (error.error && typeof error.error === 'string') {
        return error.error;
      }
      return error.statusText || error.message || 'Unknown error';
    }


  }

}