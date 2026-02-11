import { inject, Injectable } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { filter } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  loadingRequestCount = 0;
  private _spinner = inject(NgxSpinnerService);
  private _router = inject(Router);
  private _isInitialLoadComplete = false;

  constructor() {
    // Listen for navigation events to reset the initial load state.
    // This ensures that when the user switches pages, the loading screen shows again,
    // but once they are on the page, subsequent requests won't trigger it.
    this._router.events.pipe(
      filter(event => event instanceof NavigationStart)
    ).subscribe(() => {
      this._isInitialLoadComplete = false;
    });
  }

  loading() {
    this.loadingRequestCount++;

    // If we've already finished the initial load for this page view, 
    // skip the global spinner for subsequent background/action requests.
    if (this._isInitialLoadComplete) {
      return;
    }

    if (this.loadingRequestCount !== 1) return;
    this._spinner.show();
  }

  idle() {
    this.loadingRequestCount--;
    if (this.loadingRequestCount <= 0) {
      this.loadingRequestCount = 0;
      this._spinner.hide();

      // Once the first set of requests is finished after navigation,
      // mark initial load as complete to prevent spinner for later requests on this same page.
      this._isInitialLoadComplete = true;
    }
  }
}