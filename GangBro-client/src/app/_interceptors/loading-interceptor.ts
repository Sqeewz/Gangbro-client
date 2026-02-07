import { HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'

import { delay, finalize } from 'rxjs'
import { LoadingService } from '../_service/loading-service'

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const spinner = inject(LoadingService)

  // Skip global loading spinner for chat, background polling, or specific intel updates
  // to avoid annoying full-screen interruptions on already active pages.
  const skipLoading =
    req.url.includes('/mission-chats') ||
    req.url.includes('/view/roster') ||
    req.url.includes('/mission/in-progress') ||
    req.url.includes('/mission/to-completed') ||
    req.url.includes('/mission/to-failed') ||
    req.headers.has('X-Skip-Loading');

  if (!skipLoading) {
    spinner.loading()
  }

  return next(req).pipe(
    // delay(2000),
    finalize(() => {
      if (!skipLoading) {
        spinner.idle()
      }
    })
  )
}