import { HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { catchError } from 'rxjs'
import { ErrorService } from '../_service/error-service'

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const error = inject(ErrorService)
  return next(req).pipe(catchError(e => error.handleError(e)))
}