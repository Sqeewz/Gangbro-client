import { inject, Injectable } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarConfig } from '@angular/material/snack-bar';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  private _router = inject(Router)
  private _snackbar = inject(MatSnackBar)
  private _snackBarConfig: MatSnackBarConfig = {
    horizontalPosition: 'right',
    verticalPosition: 'top',
    duration: 5000,
  }

  handleError = (error: any): Observable<never> => {
    if (error) {
      let msgFromServer = '';
      if (error.error) {
        if (typeof error.error.error === 'string') msgFromServer = error.error.error;
        else if (typeof error.error.message === 'string') msgFromServer = error.error.message;
        else if (typeof error.error === 'string') msgFromServer = error.error;
        else if (typeof error.error === 'object') msgFromServer = JSON.stringify(error.error);
      }

      switch (error.status) {
        case 0:
          this._snackbar.open('SIGNAL LOST: Cannot reach HQ. Check your uplink (internet).', 'OK', this._snackBarConfig);
          break;
        case 400:
          this._snackbar.open(msgFromServer || 'INVALID INTEL: HQ rejected the request format.', 'OK', this._snackBarConfig);
          break;
        case 401:
          this._snackbar.open(msgFromServer || 'ACCESS DENIED: Credentials expired. Re-authenticate.', 'OK', this._snackBarConfig);
          break;
        case 403:
          this._snackbar.open(msgFromServer || 'RESTRICTED SECTOR: You lack the clearance for this operation.', 'OK', this._snackBarConfig);
          break;
        case 404:
          if (msgFromServer) {
            this._snackbar.open(msgFromServer, 'OK', this._snackBarConfig);
          } else {
            this._router.navigate(['/not-found']);
          }
          break;
        case 429:
          this._snackbar.open('THROTTLED: Too many operations. Cool down, Brawler.', 'OK', this._snackBarConfig);
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          this._snackbar.open('GRID FAILURE: Server-side disturbance detected. Stand by.', 'OK', this._snackBarConfig);
          break;
        default:
          this._snackbar.open(msgFromServer || 'UNKNOWN DISTURBANCE: Sector unstable. Try again.', 'OK', this._snackBarConfig);
          break;
      }
    }
    return throwError(() => error);
  }
}