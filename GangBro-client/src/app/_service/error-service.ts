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
      const msgFromServer = error.error?.error || error.error?.message;

      switch (error.status) {
        case 0:
          this._snackbar.open('Cannot connect to server. Please check your internet connection.', 'OK', this._snackBarConfig);
          break;
        case 400:
          this._snackbar.open(msgFromServer || 'Bad request: The server could not understand the request.', 'OK', this._snackBarConfig);
          break;
        case 401:
          this._snackbar.open(msgFromServer || 'Unauthorized: Please login again.', 'OK', this._snackBarConfig);
          // Optional: redirect to login if unauthorized
          // this._router.navigate(['/login']);
          break;
        case 403:
          this._snackbar.open(msgFromServer || 'Forbidden: You do not have permission to access this resource.', 'OK', this._snackBarConfig);
          break;
        case 404:
          if (msgFromServer) {
            this._snackbar.open(msgFromServer, 'OK', this._snackBarConfig);
          } else {
            this._router.navigate(['/not-found']);
          }
          break;
        case 405:
          this._snackbar.open('Method Not Allowed: The requested method is not supported.', 'OK', this._snackBarConfig);
          break;
        case 408:
          this._snackbar.open('Request Timeout: The server timed out waiting for the request.', 'OK', this._snackBarConfig);
          break;
        case 409:
          this._snackbar.open(msgFromServer || 'Conflict: This resource already exists or there is a conflict.', 'OK', this._snackBarConfig);
          break;
        case 422:
          this._snackbar.open(msgFromServer || 'Validation Error: Please check your input data.', 'OK', this._snackBarConfig);
          break;
        case 429:
          this._snackbar.open('Too Many Requests: You are being rate limited. Please slow down.', 'OK', this._snackBarConfig);
          break;
        case 500:
        case 501:
        case 502:
        case 503:
        case 504:
        case 505:
          const serverErr = msgFromServer || 'Internal Server Error: Something went wrong on our end.';
          this._snackbar.open(serverErr, 'OK', this._snackBarConfig);
          // Optional: redirect to server-error page
          // this._router.navigate(['/server-error']);
          break;
        default:
          this._snackbar.open(msgFromServer || 'An unexpected error occurred. Please try again later.', 'OK', this._snackBarConfig);
          break;
      }
    }
    return throwError(() => error);
  }
}