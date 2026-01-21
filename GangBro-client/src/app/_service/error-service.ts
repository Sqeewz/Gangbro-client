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
  }

  handleError = (error: any): Observable<never> => {
    if (error) {
      switch (error.status) {
        case 400:
          console.log(error)
          if (error.error.message) {
            this._snackbar.open("Invalid request", 'OK', this._snackBarConfig)
          }
          this._snackbar.open('Bad request', 'OK', this._snackBarConfig)
          break;
        case 404:
          this._router.navigate(['/not-found'])
          break;
        case 401:
          this._snackbar.open('Invalid username or password', 'OK', this._snackBarConfig)
          break;
        case 500:
        case 501:
        case 502:
        case 503:
        case 504:
        case 505:
        case 506:
        case 507:
        case 508:
        case 509:
        case 510:
        case 511:
          this._snackbar.open('Invalid username or password', 'OK', this._snackBarConfig)
          break;
        default:
          this._snackbar.open('something went wrong!! , please try again later', 'OK', this._snackBarConfig)
          break;
      }
    }
    return throwError(() => error)
  }
}