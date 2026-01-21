import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { PassportService } from '../_service/passport-service';

export const guestGuard: CanActivateFn = (route, state) => {
    const passportService = inject(PassportService)
    const router = inject(Router)

    if (passportService.data()?.token) {
        router.navigate(['/profile'])
        return false
    }

    return true
}