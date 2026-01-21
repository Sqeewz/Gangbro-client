import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ErrorService } from '../_service/error-service';
;
import { catchError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const error = inject(ErrorService)
  return next(req).pipe(
    catchError(error.handleError)
  )
};