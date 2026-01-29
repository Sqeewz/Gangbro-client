import { HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'

import { delay, finalize } from 'rxjs'
import { LoadingService } from '../_service/loading-service'

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const spinner = inject(LoadingService)
  spinner.loading()
  return next(req).pipe(
    // delay(2000),
    finalize(() => spinner.idle())
  )
}