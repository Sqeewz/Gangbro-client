import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core'
import { provideRouter } from '@angular/router'

import { routes } from './app.routes'
import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { loadingInterceptor } from './_interceptors/loading-interceptor'
import { errorInterceptor } from './_interceptors/error-interceptor'
import { jwtInterceptor } from './_interceptors/jwt-interceptor'

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([loadingInterceptor, errorInterceptor, jwtInterceptor])),
    // importProvidersFrom(NgxSpinnerModule)
  ]
}