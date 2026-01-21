import { inject, Injectable } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  loadingRequestCount = 0
  private _spinner = inject(NgxSpinnerService)


  loading() {
    this.loadingRequestCount++
    if (this.loadingRequestCount !== 1) return
    this._spinner.show()
  }

  idle() {
    this.loadingRequestCount--
    if (this.loadingRequestCount <= 0) {
      this.loadingRequestCount = 0; // Ensure it doesn't go negative
      this._spinner.hide()
    }
  }
}