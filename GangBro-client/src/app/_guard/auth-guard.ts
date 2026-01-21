import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { PassportService } from '../_service/passport-service';

export const authGuard: CanActivateFn = (route, state) => {
    const passportService = inject(PassportService)
    const router = inject(Router)

    if (passportService.data()?.token) return true

    router.navigate(['/login'])
    return false
}