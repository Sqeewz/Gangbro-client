import { inject, Injectable } from '@angular/core'
import { environment } from '../../environments/environment'
import { HttpClient } from '@angular/common/http'
import { PassportService } from './passport-service'
import { fileToBase64 } from '../_helpers/file'
import { firstValueFrom } from 'rxjs'
import { CloudinaryImage } from '../_models/cloudinary-image'

@Injectable({
  providedIn: 'root',
})
/**
 * Service for managing brawler/user specific operations like profile updates.
 */
export class UserService {
  private _base_url = environment.baseUrl + '/api/brawler'
  private _http = inject(HttpClient)
  private _passport = inject(PassportService)

  /**
   * Uploads a new avatar image for the current brawler.
   * @param file The image file to upload.
   * @returns A promise of an error message string if failed, otherwise null.
   */
  async uploadAvatarImg(file: File): Promise<string | null> {
    const url = this._base_url + '/avatar'
    const base64string = await fileToBase64(file)
    const uploadImg = {
      'base64_string': base64string.split(',')[1]
    }
    try {
      const cloudinaryImg = await firstValueFrom(this._http.post<CloudinaryImage>(url, uploadImg))
      this._passport.saveAvatarImgUrl(cloudinaryImg.url)
    } catch (error: any) {
      return error.error as string
    }
    return null
  }
}